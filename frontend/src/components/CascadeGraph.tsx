'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type {
  CascadeData,
  CascadeNode,
  PropagationEvent,
} from '@/types/cascade';

/*
 * The outer graph container remains fixed.
 * This only scales the graph drawing internally.
 */
const GRAPH_SCALE = 1.25;

interface CascadeGraphProps {
  data: CascadeData;
  showLabels: boolean;
  nodeSizeScaling: number;
}

interface SimulatedNode extends CascadeNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  timestamp: string;
  action: PropagationEvent['action'];
  depth: number;
}

interface TooltipState {
  node: CascadeNode;
  x: number;
  y: number;
  connections: number;
}

/* -------------------------------------------------------------------------- */
/*                           REAL RAILS NODE COLORS                           */
/* -------------------------------------------------------------------------- */

/*
 * The protocol uses cyan + indigo as the primary interaction palette.
 *
 * We still give individual nodes different colors, but we constrain the
 * palette to cyan/indigo/blue variants rather than using a rainbow spectrum.
 */
function getNodeColor(
  nodeId: string,
  role: CascadeNode['role'],
): string {
  if (role === 'seed') {
    return '#38BDF8';
  }

  let hash = 0;

  for (
    let index = 0;
    index < nodeId.length;
    index += 1
  ) {
    hash =
      nodeId.charCodeAt(index) +
      ((hash << 5) - hash);
  }

  const normalized =
    Math.abs(hash);

  if (role === 'amplifier') {
    const amplifierPalette = [
      '#818CF8',
      '#60A5FA',
      '#38BDF8',
      '#A5B4FC',
      '#7DD3FC',
    ];

    return amplifierPalette[
      normalized %
        amplifierPalette.length
    ];
  }

  const participantPalette = [
    '#38BDF8',
    '#60A5FA',
    '#67E8F9',
    '#818CF8',
    '#94A3B8',
    '#7DD3FC',
    '#A5B4FC',
  ];

  return participantPalette[
    normalized %
      participantPalette.length
  ];
}

function getRoleLabel(
  role: CascadeNode['role'],
): string {
  switch (role) {
    case 'seed':
      return 'SEED';

    case 'amplifier':
      return 'AMPLIFIER';

    default:
      return 'PARTICIPANT';
  }
}

function getNodeRadius(
  node: CascadeNode,
  scaling: number,
): number {
  const influence =
    Math.max(
      0,
      Math.min(
        100,
        node.influence_score,
      ),
    ) / 100;

  const reachBoost =
    Math.min(
      1,
      Math.log10(
        Math.max(
          node.downstream_reach,
          10,
        ),
      ) / 8,
    );

  const base =
    9 +
    influence * 11 +
    reachBoost * 9;

  return Math.max(
    6,
    base * (scaling / 50),
  );
}

/* -------------------------------------------------------------------------- */
/*                              GRAPH BACKGROUND                              */
/* -------------------------------------------------------------------------- */

function drawBackground(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  /*
   * Mandatory Real Rails base.
   */
  context.fillStyle =
    '#030712';

  context.fillRect(
    0,
    0,
    width,
    height,
  );

  /*
   * Subtle central cyan/indigo intelligence glow.
   */
  const gradient =
    context.createRadialGradient(
      width / 2,
      height / 2,
      20,
      width / 2,
      height / 2,
      Math.max(
        width,
        height,
      ) * 0.62,
    );

  gradient.addColorStop(
    0,
    'rgba(56, 189, 248, 0.07)',
  );

  gradient.addColorStop(
    0.38,
    'rgba(129, 140, 248, 0.035)',
  );

  gradient.addColorStop(
    1,
    'rgba(3, 7, 18, 0)',
  );

  context.fillStyle =
    gradient;

  context.fillRect(
    0,
    0,
    width,
    height,
  );

  /*
   * Fine intelligence-terminal dot matrix.
   */
  context.fillStyle =
    'rgba(148, 163, 184, 0.075)';

  const spacing = 30;

  for (
    let x = spacing;
    x < width;
    x += spacing
  ) {
    for (
      let y = spacing;
      y < height;
      y += spacing
    ) {
      context.beginPath();

      context.arc(
        x,
        y,
        0.65,
        0,
        Math.PI * 2,
      );

      context.fill();
    }
  }

  /*
   * Very subtle border lines around the canvas.
   */
  context.strokeStyle =
    'rgba(31, 41, 55, 0.75)';

  context.lineWidth = 1;

  context.strokeRect(
    0.5,
    0.5,
    width - 1,
    height - 1,
  );
}

/* -------------------------------------------------------------------------- */
/*                              MAIN COMPONENT                                */
/* -------------------------------------------------------------------------- */

export default function CascadeGraph({
  data,
  showLabels,
  nodeSizeScaling,
}: CascadeGraphProps) {
  const containerRef =
    useRef<HTMLDivElement>(null);

  const canvasRef =
    useRef<HTMLCanvasElement>(null);

  const nodesRef =
    useRef<SimulatedNode[]>([]);

  const dimensionsRef =
    useRef({
      width: 0,
      height: 0,
    });

  const animationRef =
    useRef<number | null>(null);

  const [width, setWidth] =
    useState(0);

  const [height, setHeight] =
    useState(0);

  const [tooltip, setTooltip] =
    useState<TooltipState | null>(
      null,
    );

  /* ------------------------------------------------------------------------ */
  /*                           VISIBLE NODE INDEX                             */
  /* ------------------------------------------------------------------------ */

  const visibleNodes =
    useMemo(
      () =>
        new Set(
          data.nodes.map(
            (node) =>
              node.id,
          ),
        ),
      [data.nodes],
    );

  /* ------------------------------------------------------------------------ */
  /*                             GRAPH EDGES                                  */
  /* ------------------------------------------------------------------------ */

  const edges =
    useMemo<GraphEdge[]>(
      () => {
        const eventLookup =
          new Map(
            data.events.map(
              (event) => [
                event.id,
                event,
              ],
            ),
          );

        return data.events
          .filter(
            (event) =>
              event.parent_event_id !==
              null,
          )
          .map((event) => {
            const parent =
              eventLookup.get(
                event.parent_event_id!,
              );

            if (!parent) {
              return null;
            }

            /*
             * Both actors must exist in the currently visible graph.
             */
            if (
              !visibleNodes.has(
                parent.actor_id,
              ) ||
              !visibleNodes.has(
                event.actor_id,
              )
            ) {
              return null;
            }

            /*
             * Avoid rendering meaningless self-links.
             */
            if (
              parent.actor_id ===
              event.actor_id
            ) {
              return null;
            }

            return {
              id: event.id,
              source:
                parent.actor_id,
              target:
                event.actor_id,
              timestamp:
                event.timestamp,
              action:
                event.action,
              depth:
                event.depth,
            };
          })
          .filter(
            (
              edge,
            ): edge is GraphEdge =>
              edge !== null,
          );
      },
      [
        data.events,
        visibleNodes,
      ],
    );

  /* ------------------------------------------------------------------------ */
  /*                         CONNECTION COUNTS                                */
  /* ------------------------------------------------------------------------ */

  const edgeByNode =
    useMemo(() => {
      const map =
        new Map<
          string,
          number
        >();

      for (const edge of edges) {
        map.set(
          edge.source,
          (map.get(
            edge.source,
          ) ?? 0) + 1,
        );

        map.set(
          edge.target,
          (map.get(
            edge.target,
          ) ?? 0) + 1,
        );
      }

      return map;
    }, [edges]);

  /* ------------------------------------------------------------------------ */
  /*                           RESIZE OBSERVER                                */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const observer =
      new ResizeObserver(
        (entries) => {
          const rect =
            entries[0]?.contentRect;

          if (!rect) {
            return;
          }

          dimensionsRef.current = {
            width: rect.width,
            height: rect.height,
          };

          setWidth(
            rect.width,
          );

          setHeight(
            rect.height,
          );
        },
      );

    observer.observe(
      containerRef.current,
    );

    return () => {
      observer.disconnect();
    };
  }, []);

  /* ------------------------------------------------------------------------ */
  /*                                DRAW                                      */
  /* ------------------------------------------------------------------------ */

  const draw =
    useCallback(() => {
      const canvas =
        canvasRef.current;

      if (!canvas) {
        return;
      }

      const context =
        canvas.getContext('2d');

      if (!context) {
        return;
      }

      const {
        width: widthPx,
        height: heightPx,
      } = dimensionsRef.current;

      if (
        widthPx <= 0 ||
        heightPx <= 0
      ) {
        return;
      }

      context.clearRect(
        0,
        0,
        widthPx,
        heightPx,
      );

      drawBackground(
        context,
        widthPx,
        heightPx,
      );

      const centerX =
        widthPx / 2;

      const centerY =
        heightPx / 2;

      /*
       * The graph is scaled internally.
       * The outer flexbox/container size remains unchanged.
       */
      context.save();

      context.translate(
        centerX,
        centerY,
      );

      context.scale(
        GRAPH_SCALE,
        GRAPH_SCALE,
      );

      context.translate(
        -centerX,
        -centerY,
      );

      const nodes =
        nodesRef.current;

      const nodeLookup =
        new Map(
          nodes.map(
            (node) => [
              node.id,
              node,
            ],
          ),
        );

      /* -------------------------------------------------------------------- */
      /*                                EDGES                                 */
      /* -------------------------------------------------------------------- */

      for (
        const edge of edges
      ) {
        const source =
          nodeLookup.get(
            edge.source,
          );

        const target =
          nodeLookup.get(
            edge.target,
          );

        if (
          !source ||
          !target
        ) {
          continue;
        }

        const dx =
          target.x -
          source.x;

        const dy =
          target.y -
          source.y;

        const angle =
          Math.atan2(
            dy,
            dx,
          );

        context.beginPath();

        context.moveTo(
          source.x,
          source.y,
        );

        context.lineTo(
          target.x,
          target.y,
        );

        /*
         * Reposts are the important propagation edges,
         * therefore they receive the stronger cyan signal.
         */
        if (
          edge.action ===
          'repost'
        ) {
          context.strokeStyle =
            'rgba(56, 189, 248, 0.46)';

          context.lineWidth = 2;
        } else {
          context.strokeStyle =
            'rgba(100, 116, 139, 0.20)';

          context.lineWidth = 1;
        }

        context.stroke();

        /* --------------------------------------------------------------- */
        /*                           ARROWHEAD                              */
        /* --------------------------------------------------------------- */

        const arrowX =
          source.x +
          dx * 0.7;

        const arrowY =
          source.y +
          dy * 0.7;

        const arrowSize =
          edge.action ===
          'repost'
            ? 7
            : 5;

        context.fillStyle =
          edge.action ===
          'repost'
            ? 'rgba(56, 189, 248, 0.85)'
            : 'rgba(148, 163, 184, 0.38)';

        context.beginPath();

        context.moveTo(
          arrowX,
          arrowY,
        );

        context.lineTo(
          arrowX -
            arrowSize *
              Math.cos(
                angle -
                  Math.PI / 6,
              ),
          arrowY -
            arrowSize *
              Math.sin(
                angle -
                  Math.PI / 6,
              ),
        );

        context.lineTo(
          arrowX -
            arrowSize *
              Math.cos(
                angle +
                  Math.PI / 6,
              ),
          arrowY -
            arrowSize *
              Math.sin(
                angle +
                  Math.PI / 6,
              ),
        );

        context.closePath();

        context.fill();
      }

      /* -------------------------------------------------------------------- */
      /*                                NODES                                 */
      /* -------------------------------------------------------------------- */

      for (
        const node of nodes
      ) {
        const isInfluencer =
          data.influencers.some(
            (influencer) =>
              influencer.id ===
              node.id,
          );

        const color =
          getNodeColor(
            node.id,
            node.role,
          );

        /* --------------------------------------------------------------- */
        /*                       INFLUENCER GLOW                           */
        /* --------------------------------------------------------------- */

        if (isInfluencer) {
          context.save();

          context.globalAlpha =
            0.14;

          context.shadowColor =
            color;

          context.shadowBlur =
            20;

          context.beginPath();

          context.arc(
            node.x,
            node.y,
            node.radius + 8,
            0,
            Math.PI * 2,
          );

          context.fillStyle =
            color;

          context.fill();

          context.restore();
        }

        /* --------------------------------------------------------------- */
        /*                           NODE GLOW                              */
        /* --------------------------------------------------------------- */

        context.save();

        context.shadowColor =
          color;

        context.shadowBlur =
          isInfluencer
            ? 14
            : 7;

        context.beginPath();

        context.arc(
          node.x,
          node.y,
          node.radius,
          0,
          Math.PI * 2,
        );

        context.fillStyle =
          color;

        context.fill();

        context.restore();

        /* --------------------------------------------------------------- */
        /*                         NODE BORDER                              */
        /* --------------------------------------------------------------- */

        context.beginPath();

        context.arc(
          node.x,
          node.y,
          node.radius,
          0,
          Math.PI * 2,
        );

        context.strokeStyle =
          isInfluencer
            ? 'rgba(255, 255, 255, 0.92)'
            : 'rgba(226, 232, 240, 0.25)';

        context.lineWidth =
          isInfluencer
            ? 2
            : 1;

        context.stroke();

        /* --------------------------------------------------------------- */
        /*                        SEED INNER RING                           */
        /* --------------------------------------------------------------- */

        if (
          node.role ===
          'seed'
        ) {
          context.beginPath();

          context.arc(
            node.x,
            node.y,
            Math.max(
              2,
              node.radius -
                4,
            ),
            0,
            Math.PI * 2,
          );

          context.strokeStyle =
            'rgba(3, 7, 18, 0.65)';

          context.lineWidth =
            1.5;

          context.stroke();
        }

        /* --------------------------------------------------------------- */
        /*                             LABEL                                */
        /* --------------------------------------------------------------- */

        if (showLabels) {
          context.fillStyle =
            'rgba(241, 245, 249, 0.96)';

          context.font =
            node.radius >=
            15
              ? '600 10px sans-serif'
              : '600 9px sans-serif';

          context.textAlign =
            'center';

          context.textBaseline =
            'middle';

          const shortLabel =
            node.label.replace(
              /^User\s+/i,
              'U',
            );

          context.fillText(
            shortLabel,
            node.x,
            node.y,
          );
        }
      }

      context.restore();
    }, [
      data.influencers,
      edges,
      showLabels,
    ]);

  /* ------------------------------------------------------------------------ */
  /*                            FORCE SIMULATION                              */
  /* ------------------------------------------------------------------------ */

  const simulate =
    useCallback(() => {
      const {
        width: widthPx,
        height: heightPx,
      } = dimensionsRef.current;

      if (
        widthPx <= 0 ||
        heightPx <= 0
      ) {
        return;
      }

      const nodes =
        nodesRef.current;

      const nodeLookup =
        new Map(
          nodes.map(
            (node) => [
              node.id,
              node,
            ],
          ),
        );

      const centerX =
        widthPx / 2;

      const centerY =
        heightPx / 2;

      /*
       * Slightly stronger central gravity keeps the graph
       * centered even when visual scaling is increased.
       */
      for (
        const node of nodes
      ) {
        node.vx +=
          (centerX -
            node.x) *
          0.002;

        node.vy +=
          (centerY -
            node.y) *
          0.002;
      }

      /* ------------------------------------------------------------------ */
      /*                           REPULSION                                 */
      /* ------------------------------------------------------------------ */

      for (
        let i = 0;
        i < nodes.length;
        i += 1
      ) {
        for (
          let j = i + 1;
          j < nodes.length;
          j += 1
        ) {
          const a =
            nodes[i];

          const b =
            nodes[j];

          const dx =
            a.x - b.x;

          const dy =
            a.y - b.y;

          const distance =
            Math.sqrt(
              dx * dx +
                dy * dy,
            ) || 1;

          const minimumDistance =
            a.radius +
            b.radius +
            28;

          const strength =
            distance <
            minimumDistance
              ? (
                  minimumDistance -
                  distance
                ) * 0.03
              : 18 /
                (distance *
                  distance);

          const ux =
            dx / distance;

          const uy =
            dy / distance;

          a.vx +=
            ux * strength;

          a.vy +=
            uy * strength;

          b.vx -=
            ux * strength;

          b.vy -=
            uy * strength;
        }
      }

      /* ------------------------------------------------------------------ */
      /*                         LINK ATTRACTION                             */
      /* ------------------------------------------------------------------ */

      for (
        const edge of edges
      ) {
        const source =
          nodeLookup.get(
            edge.source,
          );

        const target =
          nodeLookup.get(
            edge.target,
          );

        if (
          !source ||
          !target
        ) {
          continue;
        }

        const dx =
          target.x -
          source.x;

        const dy =
          target.y -
          source.y;

        const distance =
          Math.sqrt(
            dx * dx +
              dy * dy,
          ) || 1;

        const desiredDistance =
          105;

        const pull =
          (
            distance -
            desiredDistance
          ) * 0.0025;

        const ux =
          dx / distance;

        const uy =
          dy / distance;

        source.vx +=
          ux * pull;

        source.vy +=
          uy * pull;

        target.vx -=
          ux * pull;

        target.vy -=
          uy * pull;
      }

      /* ------------------------------------------------------------------ */
      /*                            INTEGRATE                                */
      /* ------------------------------------------------------------------ */

      for (
        const node of nodes
      ) {
        node.vx *= 0.88;
        node.vy *= 0.88;

        node.x += node.vx;
        node.y += node.vy;

        const padding =
          node.radius +
          8;

        node.x =
          Math.max(
            padding,
            Math.min(
              widthPx -
                padding,
              node.x,
            ),
          );

        node.y =
          Math.max(
            padding,
            Math.min(
              heightPx -
                padding,
              node.y,
            ),
          );
      }
    }, [edges]);

  /* ------------------------------------------------------------------------ */
  /*                         DATA SYNCHRONIZATION                            */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (
      width <= 0 ||
      height <= 0
    ) {
      return;
    }

    const existing =
      new Map(
        nodesRef.current.map(
          (node) => [
            node.id,
            node,
          ],
        ),
      );

    nodesRef.current =
      data.nodes.map(
        (
          node,
          index,
        ) => {
          const old =
            existing.get(
              node.id,
            );

          const radius =
            getNodeRadius(
              node,
              nodeSizeScaling,
            );

          const fallbackAngle =
            (index /
              Math.max(
                data.nodes.length,
                1,
              )) *
            Math.PI *
            2;

          /*
           * Start the graph with a wider distribution so
           * the internal 1.25x scale has useful space.
           */
          const initialDistance =
            Math.min(
              width,
              height,
            ) * 0.23;

          return {
            ...node,

            x:
              old?.x ??
              width / 2 +
                Math.cos(
                  fallbackAngle,
                ) *
                  initialDistance,

            y:
              old?.y ??
              height / 2 +
                Math.sin(
                  fallbackAngle,
                ) *
                  initialDistance,

            vx:
              old?.vx ??
              0,

            vy:
              old?.vy ??
              0,

            radius,
          };
        },
      );
  }, [
    data.nodes,
    width,
    height,
    nodeSizeScaling,
  ]);

  /* ------------------------------------------------------------------------ */
  /*                           RADIUS SYNC                                   */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    nodesRef.current =
      nodesRef.current.map(
        (node) => ({
          ...node,

          radius:
            getNodeRadius(
              node,
              nodeSizeScaling,
            ),
        }),
      );
  }, [nodeSizeScaling]);

  /* ------------------------------------------------------------------------ */
  /*                          ANIMATION LOOP                                 */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    const animate =
      () => {
        simulate();
        draw();

        animationRef.current =
          requestAnimationFrame(
            animate,
          );
      };

    animationRef.current =
      requestAnimationFrame(
        animate,
      );

    return () => {
      if (
        animationRef.current !==
        null
      ) {
        cancelAnimationFrame(
          animationRef.current,
        );
      }
    };
  }, [
    draw,
    simulate,
  ]);

  /* ------------------------------------------------------------------------ */
  /*                            MOUSE HOVER                                  */
  /* ------------------------------------------------------------------------ */

  const handleMouseMove =
    (
      event: React.MouseEvent<HTMLCanvasElement>,
    ) => {
      const canvas =
        canvasRef.current;

      if (!canvas) {
        return;
      }

      const rect =
        canvas.getBoundingClientRect();

      const scaleX =
        dimensionsRef.current.width /
        rect.width;

      const scaleY =
        dimensionsRef.current.height /
        rect.height;

      const rawMouseX =
        (event.clientX -
          rect.left) *
        scaleX;

      const rawMouseY =
        (event.clientY -
          rect.top) *
        scaleY;

      const centerX =
        dimensionsRef.current.width /
        2;

      const centerY =
        dimensionsRef.current.height /
        2;

      /*
       * Reverse the internal visual scale for hit testing.
       */
      const mouseX =
        centerX +
        (rawMouseX -
          centerX) /
          GRAPH_SCALE;

      const mouseY =
        centerY +
        (rawMouseY -
          centerY) /
          GRAPH_SCALE;

      const hovered =
        nodesRef.current.find(
          (node) => {
            const dx =
              mouseX -
              node.x;

            const dy =
              mouseY -
              node.y;

            return (
              Math.sqrt(
                dx * dx +
                  dy * dy,
              ) <=
              node.radius + 5
            );
          },
        );

      if (!hovered) {
        setTooltip(null);
        return;
      }

      setTooltip({
        node: hovered,

        x:
          event.clientX -
          rect.left,

        y:
          event.clientY -
          rect.top,

        connections:
          edgeByNode.get(
            hovered.id,
          ) ?? 0,
      });
    };

  /* ------------------------------------------------------------------------ */
  /*                                UI                                        */
  /* ------------------------------------------------------------------------ */

  return (
    <div
      ref={containerRef}
      className="relative h-[440px] w-full overflow-hidden border border-rails-border bg-rails-obsidian"
    >
      <canvas
        ref={canvasRef}
        data-cascade-graph="true"
        width={width}
        height={height}
        onMouseMove={
          handleMouseMove
        }
        onMouseLeave={() =>
          setTooltip(null)
        }
        className="absolute inset-0 h-full w-full cursor-crosshair"
      />

      {/* ------------------------------------------------------------------ */
      /*                              LEGEND                                 */
      /* ------------------------------------------------------------------ */}

      <div className="pointer-events-none absolute left-3 top-3 border border-rails-border bg-rails-surface/90 px-3 py-2 backdrop-blur-sm">
        <div className="font-mono text-[8px] uppercase tracking-[0.16em] text-rails-textMuted">
          Cascade Topology
        </div>

        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5">
          <div className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full bg-rails-cyan"
              style={{
                boxShadow:
                  '0 0 8px rgba(56,189,248,0.65)',
              }}
            />

            <span className="font-mono text-[8px] text-rails-textMuted">
              Seed
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full bg-rails-indigo"
              style={{
                boxShadow:
                  '0 0 8px rgba(129,140,248,0.6)',
              }}
            />

            <span className="font-mono text-[8px] text-rails-textMuted">
              Amplifier
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-sky-300" />

            <span className="font-mono text-[8px] text-rails-textMuted">
              Participant
            </span>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-3 border-t border-rails-border pt-2">
          <div className="flex items-center gap-1.5">
            <span className="block h-px w-4 bg-rails-cyan" />
            <span className="font-mono text-[8px] text-rails-textMuted">
              Repost
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="block h-px w-4 bg-slate-500/50" />
            <span className="font-mono text-[8px] text-rails-textMuted">
              View
            </span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */
      /*                          GRAPH STATUS                               */
      /* ------------------------------------------------------------------ */}

      <div className="pointer-events-none absolute right-3 top-3 border border-rails-border bg-rails-surface/90 px-3 py-2 backdrop-blur-sm">
        <div className="font-mono text-[8px] uppercase tracking-[0.14em] text-rails-textMuted">
          Network
        </div>

        <div className="mt-1 font-mono text-[10px] font-semibold text-white">
          {data.nodes.length}
          {' '}
          nodes
          {' · '}
          {edges.length}
          {' '}
          links
        </div>
      </div>

      {/* ------------------------------------------------------------------ */
      /*                        EMPTY STATE                                   */
      /* ------------------------------------------------------------------ */}

      {data.nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-rails-obsidian/90">
          <div className="border border-rails-border bg-rails-surface px-5 py-4 text-center">
            <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-rails-textMuted">
              No Active Distribution Nodes
            </div>

            <p className="mt-2 text-xs text-rails-textMuted">
              Adjust the replay position or influence
              threshold to reveal cascade activity.
            </p>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */
      /*                            TOOLTIP                                  */
      /* ------------------------------------------------------------------ */}

      {tooltip && (
        <div
          className="pointer-events-none absolute z-50 w-64 border border-rails-border bg-rails-surface/95 p-4 text-white shadow-2xl backdrop-blur-sm"
          style={{
            left:
              tooltip.x +
              15,

            top:
              tooltip.y +
              15,
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{
                  backgroundColor:
                    getNodeColor(
                      tooltip.node.id,
                      tooltip.node.role,
                    ),

                  boxShadow:
                    `0 0 9px ${getNodeColor(
                      tooltip.node.id,
                      tooltip.node.role,
                    )}`,
                }}
              />

              <div className="min-w-0">
                <div className="truncate text-xs font-semibold text-white">
                  {tooltip.node.label}
                </div>

                <div className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.12em] text-rails-textMuted">
                  {getRoleLabel(
                    tooltip.node.role,
                  )}
                </div>
              </div>
            </div>

            <span className="font-mono text-[8px] text-rails-textMuted">
              {tooltip.connections}
              {' '}
              links
            </span>
          </div>

          <div className="mt-4 space-y-2 border-t border-rails-border pt-3">
            <div className="flex items-center justify-between gap-4">
              <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-rails-textMuted">
                Influence
              </span>

              <span className="font-mono text-xs font-semibold text-rails-cyan">
                {Number.isFinite(
                  tooltip.node
                    .influence_score,
                )
                  ? tooltip.node.influence_score.toFixed(
                      1,
                    )
                  : '0.0'}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-rails-textMuted">
                Followers
              </span>

              <span className="font-mono text-xs text-white">
                {tooltip.node.follower_count.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-rails-textMuted">
                Views
              </span>

              <span className="font-mono text-xs text-white">
                {tooltip.node.views.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-rails-textMuted">
                Downstream Reach
              </span>

              <span className="font-mono text-xs font-semibold text-rails-indigo">
                {tooltip.node.downstream_reach.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="mt-3 border-t border-rails-border pt-2">
            <p className="text-[9px] leading-4 text-rails-textMuted">
              High-leverage positions are emphasized
              because downstream reach is concentrated
              around critical distribution points.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
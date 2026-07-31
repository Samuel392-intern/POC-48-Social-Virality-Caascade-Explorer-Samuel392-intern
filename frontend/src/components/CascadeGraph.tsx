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

/**
 * Generate a deterministic color from the node ID.
 *
 * The seed remains orange so it remains visually identifiable.
 * Every other node gets a stable hue derived from its ID.
 */
function getNodeColor(
  nodeId: string,
  role: CascadeNode['role'],
): string {
  if (role === 'seed') {
    return '#f59e0b';
  }

  let hash = 0;

  for (let index = 0; index < nodeId.length; index += 1) {
    hash =
      nodeId.charCodeAt(index) +
      ((hash << 5) - hash);
  }

  const normalizedHash =
    Math.abs(hash);

  // Golden-angle style distribution gives much better
  // separation between adjacent node colors.
  const hue =
    (normalizedHash * 137.508) % 360;

  if (role === 'amplifier') {
    return `hsl(${hue}, 82%, 62%)`;
  }

  return `hsl(${hue}, 68%, 52%)`;
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

function drawBackground(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  context.fillStyle = '#09090b';
  context.fillRect(
    0,
    0,
    width,
    height,
  );

  // Subtle radial glow around the center.
  const gradient =
    context.createRadialGradient(
      width / 2,
      height / 2,
      20,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.6,
    );

  gradient.addColorStop(
    0,
    'rgba(37, 99, 235, 0.08)',
  );

  gradient.addColorStop(
    0.45,
    'rgba(59, 130, 246, 0.025)',
  );

  gradient.addColorStop(
    1,
    'rgba(9, 9, 11, 0)',
  );

  context.fillStyle = gradient;

  context.fillRect(
    0,
    0,
    width,
    height,
  );

  // Fine dot grid.
  context.fillStyle =
    'rgba(148, 163, 184, 0.10)';

  const spacing = 28;

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
        0.8,
        0,
        Math.PI * 2,
      );

      context.fill();
    }
  }
}

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

  const visibleNodes = useMemo(
    () =>
      new Set(
        data.nodes.map(
          (node) => node.id,
        ),
      ),
    [data.nodes],
  );

  /**
   * Derive graph links directly from the event causality.
   *
   * parent_event_id -> parent actor -> child actor
   */
  const edges = useMemo<GraphEdge[]>(
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

          // Don't draw self-links.
          if (
            parent.actor_id ===
            event.actor_id
          ) {
            return null;
          }

          return {
            id: event.id,
            source: parent.actor_id,
            target: event.actor_id,
            timestamp:
              event.timestamp,
            action:
              event.action,
            depth: event.depth,
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

  const edgeByNode =
    useMemo(() => {
      const map =
        new Map<string, number>();

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

  /**
   * Keep the canvas dimensions synchronized with
   * the fixed outer graph container.
   */
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

          setWidth(rect.width);
          setHeight(rect.height);
        },
      );

    observer.observe(
      containerRef.current,
    );

    return () => {
      observer.disconnect();
    };
  }, []);

  /**
   * Draw the current graph frame.
   */
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

      /**
       * Visual graph zoom.
       *
       * The outer container remains exactly the same
       * size. Only the canvas drawing is enlarged.
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

      /**
       * Draw edges first so nodes render above them.
       */
      for (const edge of edges) {
        const source =
          nodeLookup.get(
            edge.source,
          );

        const target =
          nodeLookup.get(
            edge.target,
          );

        if (!source || !target) {
          continue;
        }

        const dx =
          target.x - source.x;

        const dy =
          target.y - source.y;

        const distance =
          Math.sqrt(
            dx * dx +
              dy * dy,
          ) || 1;

        const angle =
          Math.atan2(dy, dx);

        context.beginPath();

        context.moveTo(
          source.x,
          source.y,
        );

        context.lineTo(
          target.x,
          target.y,
        );

        context.strokeStyle =
          edge.action ===
          'repost'
            ? 'rgba(96, 165, 250, 0.52)'
            : 'rgba(113, 113, 122, 0.22)';

        context.lineWidth =
          edge.action ===
          'repost'
            ? 2
            : 1;

        context.stroke();

        /**
         * Direction arrow.
         */
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
            ? 'rgba(147, 197, 253, 0.82)'
            : 'rgba(161, 161, 170, 0.35)';

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

        // Keep TypeScript aware that distance is intentionally
        // calculated for the edge frame and useful for future
        // edge styling.
        void distance;
      }

      /**
       * Draw nodes.
       */
      for (const node of nodes) {
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

        /**
         * Influencer glow uses the node's own color
         * rather than a universal blue halo.
         */
        if (isInfluencer) {
          context.save();

          context.globalAlpha =
            0.16;

          context.shadowColor =
            color;

          context.shadowBlur =
            18;

          context.beginPath();

          context.arc(
            node.x,
            node.y,
            node.radius + 7,
            0,
            Math.PI * 2,
          );

          context.fillStyle =
            color;

          context.fill();

          context.restore();
        }

        /**
         * Soft node glow.
         */
        context.save();

        context.shadowColor =
          color;

        context.shadowBlur =
          isInfluencer
            ? 14
            : 8;

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

        /**
         * Node border.
         */
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
            ? 'rgba(255, 255, 255, 0.88)'
            : 'rgba(255, 255, 255, 0.22)';

        context.lineWidth =
          isInfluencer
            ? 2
            : 1;

        context.stroke();

        /**
         * Labels.
         */
        if (showLabels) {
          context.fillStyle =
            'rgba(244, 244, 245, 0.95)';

          context.font =
            node.radius >= 15
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

  /**
   * Force simulation.
   */
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

      /**
       * Stronger center gravity keeps the enlarged
       * network visually centered.
       */
      for (const node of nodes) {
        node.vx +=
          (centerX - node.x) *
          0.002;

        node.vy +=
          (centerY - node.y) *
          0.002;
      }

      /**
       * Pairwise repulsion.
       */
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

      /**
       * Link attraction.
       */
      for (const edge of edges) {
        const source =
          nodeLookup.get(
            edge.source,
          );

        const target =
          nodeLookup.get(
            edge.target,
          );

        if (!source || !target) {
          continue;
        }

        const dx =
          target.x - source.x;

        const dy =
          target.y - source.y;

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

      /**
       * Integrate.
       */
      for (const node of nodes) {
        node.vx *= 0.88;
        node.vy *= 0.88;

        node.x += node.vx;
        node.y += node.vy;

        /**
         * Keep nodes inside a slightly padded simulation
         * area so visual scaling doesn't immediately clip them.
         */
        const padding =
          node.radius +
          8;

        node.x = Math.max(
          padding,
          Math.min(
            widthPx - padding,
            node.x,
          ),
        );

        node.y = Math.max(
          padding,
          Math.min(
            heightPx - padding,
            node.y,
          ),
        );
      }
    }, [edges]);

  /**
   * Synchronize simulated nodes with incoming data.
   */
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

          /**
           * Larger starting spread because the graph
           * is intentionally visually larger.
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

  /**
   * Keep radii synchronized with the size slider.
   */
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

  /**
   * Animation loop.
   */
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

  /**
   * Mouse interaction.
   *
   * Convert screen coordinates back through the
   * graph's visual scale so hover still tracks nodes.
   */
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
              mouseX - node.x;

            const dy =
              mouseY - node.y;

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

  return (
    <div
      ref={containerRef}
      className="relative h-[440px] w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950"
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

      {data.nodes.length ===
        0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80 text-sm text-gray-500">
          No active cascade nodes.
        </div>
      )}

      {tooltip && (
        <div
          className="pointer-events-none absolute z-50 max-w-xs rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-white shadow-2xl"
          style={{
            left:
              tooltip.x +
              15,
            top:
              tooltip.y +
              15,
          }}
        >
          <div className="flex items-center gap-2 font-semibold">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{
                backgroundColor:
                  getNodeColor(
                    tooltip.node
                      .id,
                    tooltip.node
                      .role,
                  ),
              }}
            />

            {tooltip.node.label}
          </div>

          <div className="mt-2 space-y-1 text-xs text-gray-300">
            <div className="flex justify-between gap-4">
              <span>
                Role
              </span>

              <span className="font-medium text-gray-100">
                {tooltip.node.role}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span>
                Influence
              </span>

              <span className="font-mono text-blue-400">
                {tooltip.node.influence_score.toFixed(
                  1,
                )}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span>
                Followers
              </span>

              <span className="font-mono text-gray-100">
                {tooltip.node.follower_count.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span>
                Views
              </span>

              <span className="font-mono text-gray-100">
                {tooltip.node.views.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span>
                Downstream reach
              </span>

              <span className="font-mono text-emerald-400">
                {tooltip.node.downstream_reach.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between gap-4">
              <span>
                Connections
              </span>

              <span className="font-mono text-gray-100">
                {tooltip.connections}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
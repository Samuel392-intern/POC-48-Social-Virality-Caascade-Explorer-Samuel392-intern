import { useEffect, useRef, useState, useMemo } from 'react';
import { CascadeData, Node } from '@/types/cascade';

interface CascadeGraphProps {
  data: CascadeData;
  showLabels: boolean;
  nodeSizeScaling: number; // 10 to 100
}

interface SimulatedNode extends Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  originalSize: number;
}

export default function CascadeGraph({ data, showLabels, nodeSizeScaling }: CascadeGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [tooltip, setTooltip] = useState<{ show: boolean; x: number; y: number; content: string } | null>(null);
  const nodesRef = useRef<SimulatedNode[]>([]);

  // Setup resize observer
  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const rect = entry.contentRect;
        setWidth(rect.width);
        setHeight(rect.height);
        if (canvasRef.current) {
          canvasRef.current.width = rect.width;
          canvasRef.current.height = rect.height;
        }
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Update simulation when data or container dimensions change
  useEffect(() => {
    if (width === 0 || height === 0 || !data) return;

    const widthPx = width;
    const heightPx = height;

    // Track existing positions to prevent visual node jumping
    const existingNodesMap = new Map(nodesRef.current.map((n) => [n.id, n]));

    const nodes: SimulatedNode[] = data.nodes.map((node) => {
      const match = existingNodesMap.get(node.id);
      return {
        ...node,
        x: match ? match.x : widthPx / 2 + (Math.random() - 0.5) * 100,
        y: match ? match.y : heightPx / 2 + (Math.random() - 0.5) * 100,
        vx: match ? match.vx : 0,
        vy: match ? match.vy : 0,
        originalSize: node.size,
      };
    });

    nodesRef.current = nodes;

    const simulation = () => {
      const alpha = 0.05;
      const gravity = 0.04;
      const charge = -45;
      const linkForce = 0.08;

      // Apply forces
      nodes.forEach((node) => {
        // Center gravity
        node.vx += (widthPx / 2 - node.x) * gravity;
        node.vy += (heightPx / 2 - node.y) * gravity;

        // Electrostatic charge repulsion between all nodes
        nodes.forEach((other) => {
          if (node.id !== other.id) {
            const dx = node.x - other.x;
            const dy = node.y - other.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const limit = (node.originalSize + other.originalSize) * (nodeSizeScaling / 50) + 10;
            
            if (dist < limit) {
              const repel = (limit - dist) * 0.5;
              node.vx += (dx / dist) * repel;
              node.vy += (dy / dist) * repel;
            } else {
              const force = charge / (dist * dist);
              node.vx += (dx / dist) * force;
              node.vy += (dy / dist) * force;
            }
          }
        });
      });

      // Edge link forces (pull connected nodes closer)
      data.edges.forEach((edge) => {
        const sourceNode = nodes.find((n) => n.id === edge.source);
        const targetNode = nodes.find((n) => n.id === edge.target);
        if (sourceNode && targetNode) {
          const dx = targetNode.x - sourceNode.x;
          const dy = targetNode.y - sourceNode.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const pull = (dist - 60) * linkForce;

          sourceNode.vx += (dx / dist) * pull;
          sourceNode.vy += (dy / dist) * pull;
          targetNode.vx -= (dx / dist) * pull;
          targetNode.vy -= (dy / dist) * pull;
        }
      });

      // Update positions and apply bounds constraint
      nodes.forEach((node) => {
        node.vx *= 0.85; // drag damping
        node.vy *= 0.85;
        node.x += node.vx * alpha;
        node.y += node.vy * alpha;

        const size = node.originalSize * (nodeSizeScaling / 50);
        node.x = Math.max(size, Math.min(widthPx - size, node.x));
        node.y = Math.max(size, Math.min(heightPx - size, node.y));
      });
    };

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, widthPx, heightPx);

      // Draw edges (links)
      ctx.strokeStyle = 'rgba(156, 163, 175, 0.25)';
      ctx.lineWidth = 1.5;
      data.edges.forEach((edge) => {
        const sourceNode = nodes.find((n) => n.id === edge.source);
        const targetNode = nodes.find((n) => n.id === edge.target);
        if (sourceNode && targetNode) {
          ctx.beginPath();
          ctx.moveTo(sourceNode.x, sourceNode.y);
          ctx.lineTo(targetNode.x, targetNode.y);
          ctx.stroke();

          // Draw a small arrowhead towards target
          const dx = targetNode.x - sourceNode.x;
          const dy = targetNode.y - sourceNode.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const targetRadius = targetNode.originalSize * (nodeSizeScaling / 50);
          
          // Draw arrow 3/4 way along the link
          const arrowX = sourceNode.x + dx * 0.7;
          const arrowY = sourceNode.y + dy * 0.7;
          const angle = Math.atan2(dy, dx);
          
          ctx.fillStyle = 'rgba(156, 163, 175, 0.4)';
          ctx.beginPath();
          ctx.moveTo(arrowX, arrowY);
          ctx.lineTo(arrowX - 6 * Math.cos(angle - Math.PI / 6), arrowY - 6 * Math.sin(angle - Math.PI / 6));
          ctx.lineTo(arrowX - 6 * Math.cos(angle + Math.PI / 6), arrowY - 6 * Math.sin(angle + Math.PI / 6));
          ctx.fill();
        }
      });

      // Draw nodes
      nodes.forEach((node) => {
        const radius = node.originalSize * (nodeSizeScaling / 50);
        
        // Node outer glowing halo for influencers
        const isInfluencer = data.influencers.some((inf) => inf.id === node.id);
        if (isInfluencer) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius + 4, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();
        
        ctx.strokeStyle = isInfluencer ? 'rgba(59, 130, 246, 0.8)' : 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = isInfluencer ? 2 : 1;
        ctx.stroke();

        // Node labels
        if (showLabels) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.font = 'bold 9px sans-serif';
          ctx.textAlign = 'center';
          // Split label and print name part (e.g. "User 3" -> "U3")
          const namePart = node.label.split(' ')[1] || node.label;
          ctx.fillText(namePart, node.x, node.y + 3);
        }
      });
    };

    // Animation frame hook
    let animationFrameId: number;
    const animate = () => {
      simulation();
      draw();
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [data, width, height, showLabels, nodeSizeScaling]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const hovered = nodesRef.current.find((node) => {
      const dx = mouseX - node.x;
      const dy = mouseY - node.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const radius = node.originalSize * (nodeSizeScaling / 50);
      return dist < radius + 3;
    });

    if (hovered) {
      const connectionsCount = data.edges.filter(
        (edge) => edge.source === hovered.id || edge.target === hovered.id
      ).length;

      setTooltip({
        show: true,
        x: mouseX,
        y: mouseY,
        content: `
          <div class="font-semibold text-gray-100 flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${hovered.color}"></span>
            ${hovered.label}
          </div>
          <div class="text-xs text-gray-300 mt-1.5 space-y-0.5 font-sans">
            <div>Influence: <span class="font-semibold font-mono text-blue-400">${Math.round(hovered.influence * 100)}%</span></div>
            <div>Connections: <span class="font-semibold font-mono text-emerald-400">${connectionsCount}</span></div>
          </div>
        `,
      });
    } else {
      setTooltip(null);
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-[400px] bg-zinc-950 rounded-xl overflow-hidden relative border border-zinc-800"
    >
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
        className="absolute inset-0 w-full h-full cursor-crosshair"
      />
      
      {data.nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm font-sans bg-zinc-950 bg-opacity-80">
          No active cascade propagation nodes.
        </div>
      )}

      {tooltip && tooltip.show && (
        <div
          className="absolute z-50 pointer-events-none bg-zinc-900 border border-zinc-700 text-white rounded-lg p-2.5 shadow-2xl max-w-xs font-sans"
          style={{ left: `${tooltip.x + 15}px`, top: `${tooltip.y + 15}px` }}
          dangerouslySetInnerHTML={{ __html: tooltip.content }}
        />
      )}
    </div>
  );
}
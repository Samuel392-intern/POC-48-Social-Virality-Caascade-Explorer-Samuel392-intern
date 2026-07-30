'use client';

import { Suspense, useEffect, useState, useMemo, useRef } from 'react';
import CascadeGraph from '@/components/CascadeGraph';
import SpreadTimeline from '@/components/SpreadTimeline';
import InfluencerNodes from '@/components/InfluencerNodes';
import DecayCurves from '@/components/DecayCurves';
import ReplayControls from '@/components/ReplayControls';
import WhyMattersPanel from '@/components/WhyMattersPanel';
import WhoControlsRailPanel from '@/components/WhoControlsRailPanel';
import Filters from '@/components/Filters';
import DownloadSampleData from '@/components/DownloadSampleData';
import type { CascadeData } from '@/types/cascade';

export default function CascadeExplorer() {
  const [cascadeData, setCascadeData] = useState<CascadeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [timeRange, setTimeRange] = useState('1h');
  const [minInfluence, setMinInfluence] = useState(0);
  const [showLabels, setShowLabels] = useState(true);
  const [nodeSize, setNodeSize] = useState(50);

  // Replay states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState(1);
  const duration = 60; // total duration of replay in seconds

  const baseTimeRef = useRef<Date>(new Date());

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/cascade');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setCascadeData(data);
      baseTimeRef.current = new Date();
      setError(null);
      // Reset replay
      setCurrentTime(0);
      setIsPlaying(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setCascadeData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Replay timer loop
  useEffect(() => {
    let timerId: any;
    if (isPlaying) {
      timerId = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 0.1 * speed;
          if (next >= duration) {
            setIsPlaying(false);
            return duration;
          }
          return next;
        });
      }, 100);
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [isPlaying, speed]);

  // Compute filtered data based on active filters and replay time
  const processedData = useMemo(() => {
    if (!cascadeData) return null;

    const baseTime = baseTimeRef.current;
    
    // 1. Time Range Filter (in minutes)
    let rangeMinutes = 60;
    if (timeRange === '5m') rangeMinutes = 5;
    else if (timeRange === '15m') rangeMinutes = 15;
    else if (timeRange === '1h') rangeMinutes = 60;
    else if (timeRange === '6h') rangeMinutes = 360;
    else if (timeRange === '24h') rangeMinutes = 1440;

    const rangeCutoffTime = new Date(baseTime.getTime() - rangeMinutes * 60 * 1000);

    // Filter timeline data
    const filteredTimeline = cascadeData.timeline.filter(item => {
      const t = new Date(item.time);
      return t >= rangeCutoffTime;
    });

    // Filter decay curve
    const filteredDecay = cascadeData.decay_curve.filter(item => {
      const t = new Date(item.time);
      return t >= rangeCutoffTime;
    });

    // Filter base edges by timeRange
    let filteredEdges = cascadeData.edges.filter(edge => {
      const t = new Date(edge.timestamp);
      return t >= rangeCutoffTime;
    });

    // Filter base nodes by minimum influence
    let filteredNodes = cascadeData.nodes.filter(node => {
      return node.influence >= minInfluence;
    });

    // Keep edges only if both source and target nodes are in filteredNodes
    const nodeIds = new Set(filteredNodes.map(n => n.id));
    filteredEdges = filteredEdges.filter(edge => {
      return nodeIds.has(edge.source) && nodeIds.has(edge.target);
    });

    // 2. Replay Filter
    // If we have edges and we are in active replay or paused somewhere
    if (filteredEdges.length > 0) {
      const edgeTimes = filteredEdges.map(e => new Date(e.timestamp).getTime());
      const minEdgeTime = Math.min(...edgeTimes);
      const maxEdgeTime = Math.max(...edgeTimes);

      // Map currentTime (0 to 60) to the edge time range
      const replayTimeLimit = minEdgeTime + (currentTime / duration) * (maxEdgeTime - minEdgeTime);

      // Filter edges that happened before or at the replay time
      filteredEdges = filteredEdges.filter(edge => {
        return new Date(edge.timestamp).getTime() <= replayTimeLimit;
      });

      // Filter nodes: keep influencers (seed nodes) OR nodes connected by the active edges
      const activeNodeIds = new Set<string>();
      
      // Seed influencers (top 3) are always visible as sources of cascade
      cascadeData.influencers.forEach(inf => {
        if (nodeIds.has(inf.id)) {
          activeNodeIds.add(inf.id);
        }
      });

      filteredEdges.forEach(edge => {
        activeNodeIds.add(edge.source);
        activeNodeIds.add(edge.target);
      });

      filteredNodes = filteredNodes.filter(node => activeNodeIds.has(node.id));
    }

    return {
      nodes: filteredNodes,
      edges: filteredEdges,
      timeline: filteredTimeline,
      decay_curve: filteredDecay,
      influencers: cascadeData.influencers, // Keep reference list intact
    };
  }, [cascadeData, timeRange, minInfluence, currentTime]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-lg font-medium">Ingesting Cascade Dynamics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg p-6 max-w-md w-full">
          <h2 className="text-xl font-bold mb-2">Ingestion Failure</h2>
          <p className="mb-4">{error}</p>
          <button onClick={fetchData} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
            Retry Ingestion
          </button>
        </div>
      </div>
    );
  }

  if (!cascadeData || !processedData) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-500">No cascade streams available.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 p-4 md:p-6 transition-colors duration-300">
      <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-200 dark:border-gray-800 pb-5 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-300">
              Real Rails Intelligence Library
            </span>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full dark:bg-emerald-900 dark:text-emerald-300">
              Distribution & Demand
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Social Virality Cascade Explorer</h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1 max-w-3xl">
            Analyze the topology of distribution. Investigate how information diffuses through social networks,
            identifying structural node bottlenecks, decay velocities, and replay propagation models.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Refresh Stream
          </button>
        </div>
      </header>

      {/* Overview stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase">Active Nodes</div>
          <div className="text-2xl font-bold mt-1">{processedData.nodes.length}</div>
          <div className="text-xs text-gray-400 mt-1">Filtered from {cascadeData.nodes.length}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase">Propagation Links</div>
          <div className="text-2xl font-bold mt-1">{processedData.edges.length}</div>
          <div className="text-xs text-gray-400 mt-1">Filtered from {cascadeData.edges.length}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase">Virality Peak</div>
          <div className="text-2xl font-bold mt-1">
            {processedData.timeline.length > 0 
              ? Math.max(...processedData.timeline.map(d => d.count)) 
              : 0}
          </div>
          <div className="text-xs text-gray-400 mt-1">Shares in single time interval</div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase">Replay Cutoff</div>
          <div className="text-2xl font-bold mt-1 font-mono text-blue-600 dark:text-blue-400">
            {Math.floor((currentTime / duration) * 100)}%
          </div>
          <div className="text-xs text-gray-400 mt-1">Replay time: {currentTime.toFixed(1)}s / {duration}s</div>
        </div>
      </div>

      <main className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Visualizations */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 md:p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500"></span>
              Cascade Spread Topology
            </h2>
            <CascadeGraph 
              data={processedData} 
              showLabels={showLabels} 
              nodeSizeScaling={nodeSize} 
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 md:p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500"></span>
                Spread Timeline (Shares)
              </h2>
              <SpreadTimeline 
                data={processedData} 
                currentTime={currentTime} 
                duration={duration} 
              />
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 md:p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500"></span>
                Virality Decay Curve
              </h2>
              <DecayCurves 
                data={processedData} 
                currentTime={currentTime} 
                duration={duration} 
              />
            </div>
          </div>
        </div>

        {/* Right Column: Controls and Context panels */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
            <ReplayControls
              isPlaying={isPlaying}
              setIsPlaying={setIsPlaying}
              currentTime={currentTime}
              setCurrentTime={setCurrentTime}
              speed={speed}
              setSpeed={setSpeed}
              duration={duration}
              data={processedData}
            />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
            <Filters
              timeRange={timeRange}
              setTimeRange={setTimeRange}
              minInfluence={minInfluence}
              setMinInfluence={setMinInfluence}
              showLabels={showLabels}
              setShowLabels={setShowLabels}
              nodeSize={nodeSize}
              setNodeSize={setNodeSize}
            />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
            <InfluencerNodes data={processedData} />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
            <WhoControlsRailPanel influencers={processedData.influencers} />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
            <WhyMattersPanel />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
            <DownloadSampleData data={processedData} />
          </div>
        </div>
      </main>

      <footer className="mt-12 text-center text-xs text-gray-400 dark:text-gray-600 border-t border-gray-200 dark:border-gray-800 pt-6">
        <p>Social Virality Cascade Explorer - Real Rails Intelligence Library. Built with Next.js, FastAPI, TypeScript and Tailwind.</p>
      </footer>
    </div>
  );
}

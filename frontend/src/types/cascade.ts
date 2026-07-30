export interface Node {
  id: string;
  label: string;
  size: number;
  color: string;
  influence: number;
}

export interface Edge {
  source: string;
  target: string;
  weight: number;
  timestamp: string;
}

export interface TimelineData {
  time: string;
  count: number;
}

export interface DecayData {
  time: string;
  value: number;
}

export interface CascadeData {
  nodes: Node[];
  edges: Edge[];
  timeline: TimelineData[];
  influencers: Node[];
  decay_curve: DecayData[];
}
export type EventAction = "view" | "repost";

export type NodeRole =
  | "seed"
  | "amplifier"
  | "participant";

export interface CascadeNode {
  id: string;
  label: string;
  role: NodeRole;

  follower_count: number;
  influence_score: number;

  downstream_reach: number;
  views: number;
}

export interface PropagationEvent {
  id: string;
  timestamp: string;

  actor_id: string;
  parent_event_id: string | null;

  action: EventAction;

  views_generated: number;
  depth: number;
}

export interface CascadeMetric {
  timestamp: string;

  views: number;
  reposts: number;
  active_spreaders: number;

  // Reposts per minute.
  velocity: number;
}

export interface CascadeSource {
  gdelt: "real" | "not_used";
  social_cascade: "synthetic";
  views: "synthetic";
  metrics: "derived";
}

export interface CascadeData {
  scenario_id: string;
  generated_at: string;

  source: CascadeSource;

  nodes: CascadeNode[];
  events: PropagationEvent[];

  metrics: CascadeMetric[];

  influencers: CascadeNode[];

  peak_velocity: number;
  peak_timestamp: string;

  half_life_minutes: number;

  top3_reach_share: number;
  control_score: number;
}
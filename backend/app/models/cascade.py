from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


EventAction = Literal["view", "repost"]
NodeRole = Literal["seed", "amplifier", "participant"]


class CascadeActor(BaseModel):
    """
    Metadata for an actor participating in the cascade.

    This is generated once by the synthetic adapter and passed through
    the analytics pipeline unchanged. It prevents analytics code from
    inventing follower counts or roles later.
    """

    id: str
    label: str
    role: NodeRole
    follower_count: int = Field(ge=0)


class PropagationEvent(BaseModel):
    """
    Atomic event in the propagation stream.

    parent_event_id describes the event through which the actor
    encountered or propagated the content.
    """

    id: str
    timestamp: datetime
    actor_id: str
    parent_event_id: str | None

    action: EventAction
    views_generated: int = Field(ge=0)
    depth: int = Field(ge=0)


class SyntheticCascade(BaseModel):
    """
    Complete output of the synthetic generator.

    The generator owns:
      - actor metadata
      - event generation
      - scenario timing/identity

    Analytics owns:
      - reach
      - influence
      - velocity
      - decay
      - concentration
    """

    scenario_id: str
    generated_at: datetime
    start_time: datetime
    duration_minutes: int = Field(ge=1)

    actors: list[CascadeActor]
    events: list[PropagationEvent]


class CascadeNode(BaseModel):
    """
    Analytics-ready representation of an actor.
    """

    id: str
    label: str
    role: NodeRole

    follower_count: int = Field(ge=0)
    influence_score: float = Field(ge=0, le=100)

    downstream_reach: int = Field(ge=0)
    views: int = Field(ge=0)


class CascadeMetric(BaseModel):
    """
    Time-bucketed metrics derived from propagation events.
    """

    timestamp: datetime

    # Cumulative synthetic views through this timestamp.
    views: int = Field(ge=0)

    # Reposts occurring during this one-minute bucket.
    reposts: int = Field(ge=0)

    # Unique reposting actors active in the rolling five-minute window.
    active_spreaders: int = Field(ge=0)

    # Reposts per minute in this bucket.
    velocity: float = Field(ge=0)


class CascadeSource(BaseModel):
    """
    Explicit data provenance.
    """

    gdelt: Literal["real", "not_used"] = "not_used"
    social_cascade: Literal["synthetic"] = "synthetic"
    views: Literal["synthetic"] = "synthetic"
    metrics: Literal["derived"] = "derived"


class CascadeData(BaseModel):
    """
    Complete normalized response exposed to the frontend.

    The propagation event stream is the source of truth.
    """

    scenario_id: str
    generated_at: datetime

    source: CascadeSource

    nodes: list[CascadeNode]
    events: list[PropagationEvent]

    metrics: list[CascadeMetric]

    influencers: list[CascadeNode]

    peak_velocity: float = Field(ge=0)
    peak_timestamp: datetime

    half_life_minutes: float = Field(ge=0)

    # Percentage of downstream reach held by the top three
    # non-seed nodes.
    top3_reach_share: float = Field(ge=0, le=100)

    # HHI-style reach concentration score on a 0-100 scale.
    # Higher means more concentrated control.
    control_score: float = Field(ge=0, le=100)
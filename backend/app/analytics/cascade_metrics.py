from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timedelta, timezone

from app.models.cascade import (
    CascadeData,
    CascadeMetric,
    CascadeNode,
    PropagationEvent,
    SyntheticCascade,
)


def clamp(
    value: float,
    minimum: float,
    maximum: float,
) -> float:
    return max(
        minimum,
        min(value, maximum),
    )


def normalize(
    value: float,
    minimum: float,
    maximum: float,
) -> float:
    if maximum <= minimum:
        return 0.0

    return (
        value - minimum
    ) / (
        maximum - minimum
    )


def _build_children_index(
    events: list[PropagationEvent],
) -> dict[str, list[str]]:
    """
    Build an event adjacency index:

        parent event -> child events
    """

    children_by_parent: dict[str, list[str]] = defaultdict(list)

    for event in events:
        if event.parent_event_id is None:
            continue

        children_by_parent[
            event.parent_event_id
        ].append(event.id)

    return children_by_parent


def _build_event_lookup(
    events: list[PropagationEvent],
) -> dict[str, PropagationEvent]:
    return {
        event.id: event
        for event in events
    }


def _validate_event_stream(
    events: list[PropagationEvent],
) -> None:
    """
    Validate the assumptions required for replay and attribution.

    Every non-root event must:
      1. reference an existing parent
      2. occur at or after its parent's timestamp
      3. have depth >= parent's depth
    """

    if not events:
        raise ValueError(
            "Cannot validate an empty event stream."
        )

    event_lookup = _build_event_lookup(
        events
    )

    root_events = [
        event
        for event in events
        if event.parent_event_id is None
    ]

    if len(root_events) != 1:
        raise ValueError(
            f"Expected exactly one root event, "
            f"found {len(root_events)}."
        )

    seen_ids: set[str] = set()

    for event in events:

        if event.id in seen_ids:
            raise ValueError(
                f"Duplicate event id: {event.id}"
            )

        seen_ids.add(event.id)

        if event.parent_event_id is None:
            continue

        parent = event_lookup.get(
            event.parent_event_id
        )

        if parent is None:
            raise ValueError(
                f"Event {event.id} references "
                f"missing parent {event.parent_event_id}"
            )

        if event.timestamp < parent.timestamp:
            raise ValueError(
                f"Event {event.id} occurs before "
                f"its parent {parent.id}"
            )

        if event.depth < parent.depth:
            raise ValueError(
                f"Event {event.id} has depth "
                f"{event.depth}, less than parent "
                f"{parent.depth}"
            )


def _build_repost_event_index(
    events: list[PropagationEvent],
) -> dict[str, PropagationEvent]:
    """
    Map each actor to their first repost.

    The current generator only allows one repost per actor, but this
    function intentionally chooses the earliest repost so the analytics
    remain sensible if repeated reposts are introduced later.
    """

    result: dict[str, PropagationEvent] = {}

    for event in events:

        if event.action != "repost":
            continue

        existing = result.get(
            event.actor_id
        )

        if (
            existing is None
            or event.timestamp < existing.timestamp
        ):
            result[event.actor_id] = event

    return result


def build_downstream_reach(
    events: list[PropagationEvent],
) -> dict[str, int]:
    """
    Calculate synthetic downstream reach for each actor.

    Reach is the total synthetic view volume in the event subtree
    beginning at that actor's repost.

    This is intentionally a model-derived metric, not a claim that
    real platforms expose attributable downstream reach this way.
    """

    if not events:
        return {}

    children_by_parent = _build_children_index(
        events
    )

    event_lookup = _build_event_lookup(
        events
    )

    repost_events = _build_repost_event_index(
        events
    )

    reach_by_actor: dict[str, int] = defaultdict(
        int
    )

    for actor_id, repost_event in repost_events.items():

        stack = [
            repost_event.id
        ]

        visited: set[str] = set()

        subtree_total = 0

        while stack:

            event_id = stack.pop()

            if event_id in visited:
                continue

            visited.add(event_id)

            event = event_lookup.get(
                event_id
            )

            if event is None:
                continue

            subtree_total += event.views_generated

            stack.extend(
                children_by_parent.get(
                    event_id,
                    [],
                )
            )

        reach_by_actor[
            actor_id
        ] = subtree_total

    # The seed is the root of the scenario.
    # Its downstream reach includes all non-seed view volume.
    root_event = next(
        (
            event
            for event in events
            if event.parent_event_id is None
        ),
        None,
    )

    if root_event is not None:

        reach_by_actor[
            root_event.actor_id
        ] = sum(
            event.views_generated
            for event in events
            if event.actor_id
            != root_event.actor_id
        )

    return dict(
        reach_by_actor
    )


def _calculate_influence_scores(
    actors,
    events: list[PropagationEvent],
    downstream_reach: dict[str, int],
    start_time: datetime,
    duration_minutes: int,
) -> list[CascadeNode]:
    """
    Calculate an explainable synthetic influence score.

    Weighting:

      15% follower potential
      25% generated views
      45% downstream reach
      15% early propagation

    These weights are product-model assumptions and should be presented
    as derived/synthetic rather than empirical platform truth.
    """

    views_by_actor: dict[str, int] = defaultdict(
        int
    )

    first_repost_by_actor = (
        _build_repost_event_index(
            events
        )
    )

    for event in events:
        views_by_actor[
            event.actor_id
        ] += event.views_generated

    active_actors = [
        actor
        for actor in actors
        if views_by_actor.get(
            actor.id,
            0,
        ) > 0
    ]

    max_followers = max(
        (
            actor.follower_count
            for actor in active_actors
        ),
        default=1,
    )

    max_views = max(
        (
            views_by_actor.get(
                actor.id,
                0,
            )
            for actor in active_actors
        ),
        default=1,
    )

    max_reach = max(
        (
            downstream_reach.get(
                actor.id,
                0,
            )
            for actor in active_actors
        ),
        default=1,
    )

    nodes: list[CascadeNode] = []

    for actor in actors:

        views = views_by_actor.get(
            actor.id,
            0,
        )

        reach = downstream_reach.get(
            actor.id,
            0,
        )

        follower_score = normalize(
            actor.follower_count,
            0,
            max_followers,
        )

        views_score = normalize(
            views,
            0,
            max_views,
        )

        reach_score = normalize(
            reach,
            0,
            max_reach,
        )

        repost_event = (
            first_repost_by_actor.get(
                actor.id
            )
        )

        if repost_event is None:

            early_score = 0.0

        else:

            elapsed_minutes = (
                repost_event.timestamp
                - start_time
            ).total_seconds() / 60.0

            early_score = 1.0 - clamp(
                elapsed_minutes
                / max(
                    duration_minutes,
                    1,
                ),
                0.0,
                1.0,
            )

        influence_score = (
            follower_score * 0.15
            + views_score * 0.25
            + reach_score * 0.45
            + early_score * 0.15
        )

        nodes.append(
            CascadeNode(
                id=actor.id,
                label=actor.label,
                role=actor.role,
                follower_count=actor.follower_count,
                influence_score=round(
                    influence_score * 100,
                    2,
                ),
                downstream_reach=reach,
                views=views,
            )
        )

    return nodes


def _build_metrics(
    events: list[PropagationEvent],
    start_time: datetime,
    duration_minutes: int,
) -> list[CascadeMetric]:
    """
    Convert raw events into minute buckets.

    Views are cumulative.
    Reposts and velocity are per-minute.
    Active spreaders use a five-minute rolling window.
    """

    metrics: list[CascadeMetric] = []

    sorted_events = sorted(
        events,
        key=lambda event: event.timestamp,
    )

    for minute_index in range(
        duration_minutes
    ):

        bucket_start = (
            start_time
            + timedelta(
                minutes=minute_index
            )
        )

        bucket_end = (
            bucket_start
            + timedelta(
                minutes=1
            )
        )

        current_events = [
            event
            for event in sorted_events
            if (
                bucket_start
                <= event.timestamp
                < bucket_end
            )
        ]

        events_until_bucket = [
            event
            for event in sorted_events
            if event.timestamp
            < bucket_end
        ]

        reposts = sum(
            1
            for event in current_events
            if event.action == "repost"
        )

        cumulative_views = sum(
            event.views_generated
            for event in events_until_bucket
        )

        rolling_start = (
            bucket_start
            - timedelta(
                minutes=5
            )
        )

        active_spreaders = len(
            {
                event.actor_id
                for event in sorted_events
                if (
                    event.action == "repost"
                    and rolling_start
                    <= event.timestamp
                    < bucket_end
                )
            }
        )

        metrics.append(
            CascadeMetric(
                timestamp=bucket_start,
                views=cumulative_views,
                reposts=reposts,
                active_spreaders=active_spreaders,
                velocity=float(reposts),
            )
        )

    return metrics


def _calculate_peak(
    metrics: list[CascadeMetric],
) -> tuple[float, datetime]:
    if not metrics:
        return (
            0.0,
            datetime.now(
                timezone.utc
            ),
        )

    peak_metric = max(
        metrics,
        key=lambda metric: metric.velocity,
    )

    return (
        peak_metric.velocity,
        peak_metric.timestamp,
    )


def _calculate_half_life(
    metrics: list[CascadeMetric],
) -> float:
    """
    Measure minutes from peak repost velocity until velocity reaches
    <= 50% of the peak.

    If the threshold is not reached before the scenario ends, return
    the observed post-peak window rather than inventing a decay value.
    """

    if not metrics:
        return 0.0

    peak_index = max(
        range(len(metrics)),
        key=lambda index: metrics[
            index
        ].velocity,
    )

    peak_velocity = metrics[
        peak_index
    ].velocity

    if peak_velocity <= 0:
        return 0.0

    half_target = (
        peak_velocity / 2.0
    )

    for index in range(
        peak_index + 1,
        len(metrics),
    ):

        if (
            metrics[
                index
            ].velocity
            <= half_target
        ):
            return float(
                index - peak_index
            )

    return float(
        len(metrics)
        - 1
        - peak_index
    )


def _calculate_reach_concentration(
    nodes: list[CascadeNode],
) -> tuple[float, float]:
    """
    Calculate concentration from actor-level attributed reach.

    Because ancestor and descendant subtrees can overlap, we normalize
    by total actor-attributed reach rather than by raw unique views.
    This keeps the concentration percentage mathematically bounded.
    """

    non_seed_nodes = [
        node
        for node in nodes
        if node.role != "seed"
        and node.downstream_reach > 0
    ]

    total_attributed_reach = sum(
        node.downstream_reach
        for node in non_seed_nodes
    )

    if total_attributed_reach <= 0:
        return 0.0, 0.0

    ranked = sorted(
        non_seed_nodes,
        key=lambda node: node.downstream_reach,
        reverse=True,
    )

    top3_reach = sum(
        node.downstream_reach
        for node in ranked[:3]
    )

    top3_share = (
        top3_reach
        / total_attributed_reach
    ) * 100.0

    hhi = 0.0

    for node in non_seed_nodes:

        share = (
            node.downstream_reach
            / total_attributed_reach
        )

        hhi += (
            share * share
        )

    return (
        top3_share,
        hhi * 100.0,
    )


def build_cascade_data(
    scenario: SyntheticCascade,
    source_gdelt: str = "not_used",
) -> CascadeData:
    """
    Derive all analytics from one SyntheticCascade.

    `scenario` contains the exact actor metadata and event stream
    produced by synthetic.py. Nothing is regenerated or guessed here.
    """

    events = sorted(
        scenario.events,
        key=lambda event: event.timestamp,
    )

    if not events:
        raise ValueError(
            "Cannot build cascade analytics from "
            "an empty event stream."
        )

    if source_gdelt not in {
        "real",
        "not_used",
    }:
        raise ValueError(
            "source_gdelt must be "
            "'real' or 'not_used'."
        )

    _validate_event_stream(
        events
    )

    downstream_reach = (
        build_downstream_reach(
            events
        )
    )

    nodes = (
        _calculate_influence_scores(
            actors=scenario.actors,
            events=events,
            downstream_reach=downstream_reach,
            start_time=scenario.start_time,
            duration_minutes=scenario.duration_minutes,
        )
    )

    influencers = sorted(
        (
            node
            for node in nodes
            if (
                node.role != "seed"
                and node.views > 0
            )
        ),
        key=lambda node: (
            node.downstream_reach,
            node.influence_score,
        ),
        reverse=True,
    )[:3]

    metrics = _build_metrics(
        events=events,
        start_time=scenario.start_time,
        duration_minutes=scenario.duration_minutes,
    )

    peak_velocity, peak_timestamp = (
        _calculate_peak(
            metrics
        )
    )

    half_life_minutes = (
        _calculate_half_life(
            metrics
        )
    )

    top3_reach_share, control_score = (
        _calculate_reach_concentration(
            nodes
        )
    )

    return CascadeData(
        scenario_id=scenario.scenario_id,
        generated_at=scenario.generated_at,
        source={
            "gdelt": source_gdelt,
            "social_cascade": "synthetic",
            "views": "synthetic",
            "metrics": "derived",
        },
        nodes=nodes,
        events=events,
        metrics=metrics,
        influencers=influencers,
        peak_velocity=round(
            peak_velocity,
            2,
        ),
        peak_timestamp=peak_timestamp,
        half_life_minutes=round(
            half_life_minutes,
            2,
        ),
        top3_reach_share=round(
            top3_reach_share,
            2,
        ),
        control_score=round(
            control_score,
            2,
        ),
    )
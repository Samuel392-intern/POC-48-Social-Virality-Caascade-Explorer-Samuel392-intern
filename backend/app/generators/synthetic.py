from __future__ import annotations

import random
from datetime import datetime, timedelta, timezone

from app.models.cascade import (
    CascadeActor,
    PropagationEvent,
    SyntheticCascade,
)


MAX_DEPTH = 8
DEFAULT_ACTOR_COUNT = 30


def create_actors(
    rng: random.Random,
    count: int = DEFAULT_ACTOR_COUNT,
) -> list[CascadeActor]:
    """
    Create a deterministic synthetic actor population.

    Roles are intentionally structured so the scenario contains:
      - one seed
      - several high-reach amplifiers
      - ordinary participants

    Follower counts are part of the generated scenario and are returned
    alongside events so downstream analytics use the exact same metadata.
    """

    actors: list[CascadeActor] = []

    for index in range(count):

        if index == 0:
            role = "seed"
            follower_count = rng.randint(
                500_000,
                2_000_000,
            )

        elif index <= 4:
            role = "amplifier"
            follower_count = rng.randint(
                100_000,
                1_000_000,
            )

        else:
            role = "participant"
            follower_count = rng.randint(
                2_000,
                120_000,
            )

        actors.append(
            CascadeActor(
                id=f"node_{index}",
                label=f"User {index}",
                role=role,
                follower_count=follower_count,
            )
        )

    return actors


def propagation_capacity(
    actor: CascadeActor,
    rng: random.Random,
) -> int:
    """
    Number of new actors an event can plausibly reach.

    This is deliberately simple synthetic behavior, not a claim about
    real platform mechanics.
    """

    if actor.role == "seed":
        return rng.randint(3, 5)

    if actor.role == "amplifier":
        return rng.randint(2, 4)

    return rng.randint(0, 2)


def _decay_factor(
    elapsed_minutes: float,
    duration_minutes: int,
) -> float:
    """
    Linear synthetic propagation decay.

    The minimum is kept above zero so late-stage events can still happen.
    """

    if duration_minutes <= 0:
        return 0.2

    return max(
        0.20,
        1.0
        - (
            elapsed_minutes
            / duration_minutes
        )
        * 0.75,
    )


def _choose_children(
    available_actors: list[CascadeActor],
    child_count: int,
    rng: random.Random,
) -> list[CascadeActor]:
    """
    Prefer higher-reach actors while retaining randomness.

    We sample from a small high-follower candidate pool rather than
    always picking the top accounts.
    """

    if child_count <= 0 or not available_actors:
        return []

    child_count = min(
        child_count,
        len(available_actors),
    )

    available_actors.sort(
        key=lambda actor: actor.follower_count,
        reverse=True,
    )

    candidate_pool_size = min(
        len(available_actors),
        max(5, child_count * 3),
    )

    candidate_pool = available_actors[
        :candidate_pool_size
    ]

    return rng.sample(
        candidate_pool,
        k=child_count,
    )


def generate_synthetic_cascade(
    seed: int = 4827,
    duration_minutes: int = 60,
    actor_count: int = DEFAULT_ACTOR_COUNT,
) -> SyntheticCascade:
    """
    Generate one coherent synthetic cascade.

    Returns:
      - exact actor metadata used by the simulation
      - the complete chronological propagation event stream
      - scenario metadata

    All downstream analytics should operate on this object.
    """

    duration_minutes = max(
        10,
        min(duration_minutes, 24 * 60),
    )

    actor_count = max(
        6,
        min(actor_count, 500),
    )

    rng = random.Random(seed)

    generated_at = datetime.now(timezone.utc)

    start_time = (
        generated_at.replace(
            second=0,
            microsecond=0,
        )
        - timedelta(
            minutes=duration_minutes - 1,
        )
    )

    max_time = (
        start_time
        + timedelta(
            minutes=duration_minutes - 1,
        )
    )

    scenario_id = (
        f"synthetic-"
        f"{start_time.strftime('%Y%m%d-%H%M')}-"
        f"{seed}"
    )

    actors = create_actors(
        rng,
        count=actor_count,
    )

    actor_lookup = {
        actor.id: actor
        for actor in actors
    }

    seed_actor = actor_lookup["node_0"]

    # --------------------------------------------------------
    # Root event
    # --------------------------------------------------------

    seed_views = int(
        seed_actor.follower_count
        * rng.uniform(
            0.10,
            0.25,
        )
    )

    seed_event = PropagationEvent(
        id="event_0",
        timestamp=start_time,
        actor_id=seed_actor.id,
        parent_event_id=None,
        action="view",
        views_generated=max(
            seed_views,
            100,
        ),
        depth=0,
    )

    events: list[PropagationEvent] = [
        seed_event
    ]

    # Breadth-first propagation queue.
    frontier: list[PropagationEvent] = [
        seed_event
    ]

    # First version uses each actor once. This produces a clean
    # causal tree and makes attribution/replay straightforward.
    available_actors = actors[1:].copy()

    event_counter = 1

    while frontier and available_actors:

        parent_event = frontier.pop(0)

        if parent_event.depth >= MAX_DEPTH:
            continue

        parent_actor = actor_lookup.get(
            parent_event.actor_id
        )

        if parent_actor is None:
            continue

        elapsed_minutes = (
            parent_event.timestamp
            - start_time
        ).total_seconds() / 60.0

        if elapsed_minutes >= duration_minutes:
            continue

        decay_factor = _decay_factor(
            elapsed_minutes=elapsed_minutes,
            duration_minutes=duration_minutes,
        )

        # Chance that this event continues propagation at all.
        continuation_probability = (
            0.72 * decay_factor
        )

        if rng.random() >= continuation_probability:
            continue

        capacity = propagation_capacity(
            parent_actor,
            rng,
        )

        if capacity <= 0:
            continue

        child_count = min(
            capacity,
            len(available_actors),
        )

        children = _choose_children(
            available_actors,
            child_count,
            rng,
        )

        for child in children:

            if child not in available_actors:
                continue

            available_actors.remove(child)

            # ------------------------------------------------
            # VIEW EVENT
            # ------------------------------------------------

            view_delay = rng.randint(
                15,
                240,
            )

            view_timestamp = (
                parent_event.timestamp
                + timedelta(
                    seconds=view_delay,
                )
            )

            if view_timestamp > max_time:
                continue

            view_count = int(
                child.follower_count
                * rng.uniform(
                    0.05,
                    0.35,
                )
                * decay_factor
            )

            view_event = PropagationEvent(
                id=f"event_{event_counter}",
                timestamp=view_timestamp,
                actor_id=child.id,
                parent_event_id=parent_event.id,
                action="view",
                views_generated=max(
                    view_count,
                    50,
                ),
                depth=parent_event.depth + 1,
            )

            events.append(view_event)
            event_counter += 1

            # ------------------------------------------------
            # REPOST DECISION
            # ------------------------------------------------

            if child.role == "amplifier":
                repost_probability = 0.72
            else:
                repost_probability = 0.25

            repost_probability *= decay_factor

            if rng.random() >= repost_probability:
                continue

            # ------------------------------------------------
            # REPOST EVENT
            # ------------------------------------------------

            repost_delay = rng.randint(
                20,
                180,
            )

            repost_timestamp = (
                view_timestamp
                + timedelta(
                    seconds=repost_delay,
                )
            )

            if repost_timestamp > max_time:
                continue

            repost_views = int(
                child.follower_count
                * rng.uniform(
                    0.15,
                    0.70,
                )
                * decay_factor
            )

            repost_event = PropagationEvent(
                id=f"event_{event_counter}",
                timestamp=repost_timestamp,
                actor_id=child.id,
                parent_event_id=view_event.id,
                action="repost",
                views_generated=max(
                    repost_views,
                    100,
                ),
                depth=view_event.depth,
            )

            events.append(repost_event)
            event_counter += 1

            # A repost becomes a new propagation source.
            frontier.append(
                repost_event
            )

    events.sort(
        key=lambda event: event.timestamp
    )

    return SyntheticCascade(
        scenario_id=scenario_id,
        generated_at=generated_at,
        start_time=start_time,
        duration_minutes=duration_minutes,
        actors=actors,
        events=events,
    )
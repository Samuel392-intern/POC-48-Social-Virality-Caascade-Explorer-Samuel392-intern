from fastapi import FastAPI, Query

from app.analytics.cascade_metrics import build_cascade_data
from app.generators.synthetic import generate_synthetic_cascade
from app.models.cascade import CascadeData


app = FastAPI(
    title="Social Virality Cascade Explorer API",
    version="2.0.0",
)


@app.get("/")
async def root():
    return {
        "message": "Social Virality Cascade Explorer API",
        "version": "2.0.0",
        "data_model": "event-driven",
    }


def _generate_cascade(
    seed: int,
    duration_minutes: int,
) -> CascadeData:

    scenario = generate_synthetic_cascade(
        seed=seed,
        duration_minutes=duration_minutes,
    )

    return build_cascade_data(
        scenario=scenario,
    )


@app.get(
    "/api/cascade",
    response_model=CascadeData,
)
async def get_cascade(
    seed: int = Query(
        default=4827,
        description="Deterministic seed for the synthetic scenario",
    ),
    duration_minutes: int = Query(
        default=60,
        ge=10,
        le=1440,
        description="Length of the simulated cascade in minutes",
    ),
) -> CascadeData:

    return _generate_cascade(
        seed=seed,
        duration_minutes=duration_minutes,
    )


@app.get(
    "/api/sample-data",
    response_model=CascadeData,
)
async def get_sample_data(
    seed: int = Query(
        default=4827,
        description="Deterministic seed for the sample scenario",
    ),
    duration_minutes: int = Query(
        default=60,
        ge=10,
        le=1440,
        description="Length of the simulated sample in minutes",
    ),
) -> CascadeData:

    return _generate_cascade(
        seed=seed,
        duration_minutes=duration_minutes,
    )
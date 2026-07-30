from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
import random
from datetime import datetime, timedelta

app = FastAPI(title="Social Virality Cascade Explorer API")

# Mock data models
class Node(BaseModel):
    id: str
    label: str
    size: int
    color: str
    influence: float

class Edge(BaseModel):
    source: str
    target: str
    weight: float
    timestamp: str

class CascadeData(BaseModel):
    nodes: List[Node]
    edges: List[Edge]
    timeline: List[dict]  # {time: string, count: int}
    influencers: List[Node]
    decay_curve: List[dict]  # {time: string, value: float}

# Generate mock cascade data
def generate_mock_cascade():
    # Generate nodes
    nodes = []
    for i in range(20):
        nodes.append(Node(
            id=f"node_{i}",
            label=f"User {i}",
            size=random.randint(10, 50),
            color=f"hsl({random.randint(0, 360)}, 70%, 50%)",
            influence=random.random()
        ))

    # Generate edges (simulate a cascade)
    edges = []
    for i in range(1, 20):
        # Each node shares to a few previous nodes
        num_shares = random.randint(1, 3)
        for _ in range(num_shares):
            target = random.randint(0, i-1)
            edges.append(Edge(
                source=f"node_{i}",
                target=f"node_{target}",
                weight=random.random(),
                timestamp=(datetime.now() - timedelta(minutes=random.randint(0, 60))).isoformat()
            ))

    # Generate timeline (last 60 minutes)
    timeline = []
    for i in range(60):
        time = (datetime.now() - timedelta(minutes=59-i)).isoformat()
        count = random.randint(0, 20)
        timeline.append({"time": time, "count": count})

    # Influencers (top 3 by influence)
    sorted_nodes = sorted(nodes, key=lambda x: x.influence, reverse=True)
    influencers = sorted_nodes[:3]

    # Decay curve (exponential decay)
    decay_curve = []
    for i in range(60):
        time = (datetime.now() - timedelta(minutes=59-i)).isoformat()
        value = 100 * (0.9 ** i)  # simple exponential decay
        decay_curve.append({"time": time, "value": value})

    return CascadeData(
        nodes=nodes,
        edges=edges,
        timeline=timeline,
        influencers=influencers,
        decay_curve=decay_curve
    )

@app.get("/")
async def root():
    return {"message": "Social Virality Cascade Explorer API"}

@app.get("/api/cascade", response_model=CascadeData)
async def get_cascade():
    return generate_mock_cascade()

# Endpoint for downloading sample data
@app.get("/api/sample-data")
async def get_sample_data():
    # Return the same mock data as JSON for download
    return generate_mock_cascade()
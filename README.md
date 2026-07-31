# Social Virality Cascade Explorer

## Real Rails Intelligence Library — Distribution & Demand

Social Virality Cascade Explorer is a production-style demo for the **Real Rails Intelligence Library**. It explores how information propagates through a synthetic social network, how downstream reach concentrates around influential nodes, how propagation velocity changes over time, and how a cascade can be replayed event-by-event.

The application is designed for three audiences:

- **Everyday viewers:** understand how something becomes viral.
- **Builders:** inspect the event-driven propagation model and reusable data flow.
- **Allocators:** understand where distribution power and reach concentration sit.

> **Data note:** The social repost graph and view cascade are currently **synthetic/mock data**. GDELT is represented as `not_used` in the current API response. Analytics metrics are derived from the synthetic event stream.

---

## Features

### Cascade graph
Interactive network visualization derived from propagation events.

- Seed, amplifier, and participant roles.
- Directional propagation edges.
- Repost links are visually emphasized.
- Deterministic per-node colors.
- Influencer highlighting.
- Node hover tooltips.
- Configurable node-size scaling.
- Optional node labels.
- Visual zoom inside a fixed graph container.

### Spread timeline
Displays cascade activity and exposure behavior over the selected replay window.

### Propagation decay
Visualizes how propagation momentum changes as the cascade ages.

### Influencer analysis
Ranks nodes based on downstream propagation impact and derived influence metrics.

### Who Controls the Rail
Summarizes reach concentration and control using:

- Top-3 reach share.
- Network concentration/control score.
- Key influencer nodes.

### Replay mode
Replay the event stream from its beginning.

- Play / pause.
- Reset.
- 0.5x / 1x / 2x / 5x speeds.
- Timeline slider.
- Current replay position.
- Replay-aware graph and metrics.

### Filters

- 5-minute horizon.
- 15-minute horizon.
- 30-minute horizon.
- Full 1-hour scenario.
- Minimum influence threshold.
- Node-size scaling.
- Toggle node labels.

### Downloadable sample data
Download the current API dataset as JSON for further analysis.

### Animated WebGL background
Fullscreen WebGL1 halftone shader background.

- Plain WebGL1.
- Fullscreen triangle.
- No WebGL libraries.
- Device pixel ratio capped at 2.
- Animation pauses when the browser tab is hidden.
- Cursor interaction is disabled.
- Palette:
  - `#0B1026`
  - `#3D46E8`
  - `#B18CFF`
  - `#FFD6E7`

---

## Architecture

The project is split into a Next.js frontend and FastAPI backend.

```text
Social Virality Cascade Explorer
│
├── frontend/
│   ├── Next.js
│   ├── TypeScript
│   ├── Tailwind CSS
│   ├── Recharts
│   └── WebGL1 shader background
│
└── backend/
    ├── FastAPI
    ├── Pydantic
    ├── Synthetic event generator
    └── Cascade analytics
```

### Data flow

```text
Synthetic event generator
        │
        ▼
PropagationEvent stream
        │
        ▼
Cascade analytics
        │
        ├── nodes
        ├── events
        ├── metrics
        ├── influencers
        ├── peak velocity
        ├── half-life
        ├── top-3 reach share
        └── control score
        │
        ▼
FastAPI /api/cascade
        │
        ▼
Next.js API rewrite
        │
        ▼
Dashboard
```

---

# Backend

## Backend directory

```text
backend/
└── app/
    ├── main.py
    ├── models/
    │   └── cascade.py
    ├── generators/
    │   └── synthetic.py
    └── analytics/
        └── cascade_metrics.py
```

## Main backend modules

### `app/main.py`

FastAPI application and API routes.

Current routes:

```text
GET /
GET /api/cascade
GET /api/sample-data
```

The cascade endpoint accepts:

```text
seed
duration_minutes
```

Example:

```text
http://localhost:8001/api/cascade?seed=4827&duration_minutes=60
```

### `app/generators/synthetic.py`

Generates the synthetic event stream.

The generator creates:

- Actors.
- Actor roles.
- Follower counts.
- View events.
- Repost events.
- Parent-child event relationships.
- Propagation depth.
- Timestamps.
- Synthetic downstream views.

The event stream is deterministic for a given seed.

### `app/models/cascade.py`

Defines the normalized API contract using Pydantic.

Core models:

```text
CascadeNode
PropagationEvent
CascadeMetric
CascadeSource
CascadeData
```

### `app/analytics/cascade_metrics.py`

Transforms the raw event stream into dashboard analytics.

It calculates:

- Downstream reach.
- Influence scores.
- Cascade metrics.
- Active spreaders.
- Velocity.
- Peak velocity.
- Peak timestamp.
- Half-life.
- Top-3 reach share.
- Control/concentration score.
- Influencer ranking.

---

# Backend API response

The current `/api/cascade` response follows this shape:

```json
{
  "scenario_id": "synthetic-20260730-1614-4827",
  "generated_at": "2026-07-30T17:13:11.694376Z",
  "source": {
    "gdelt": "not_used",
    "social_cascade": "synthetic",
    "views": "synthetic",
    "metrics": "derived"
  },
  "nodes": [],
  "events": [],
  "metrics": [],
  "influencers": [],
  "peak_velocity": 0,
  "peak_timestamp": "2026-07-30T16:18:00Z",
  "half_life_minutes": 0,
  "top3_reach_share": 0,
  "control_score": 0
}
```

The exact numeric values vary with the selected seed and generated scenario.

### `PropagationEvent`

Each propagation event contains:

```json
{
  "id": "event_7",
  "timestamp": "2026-07-30T16:18:47Z",
  "actor_id": "node_13",
  "parent_event_id": "event_6",
  "action": "repost",
  "views_generated": 24235,
  "depth": 1
}
```

This creates a causal chain such as:

```text
Seed view
   │
   ▼
User A view
   │
   ▼
User A repost
   │
   ▼
User B view
```

---

# Frontend

## Frontend directory

```text
frontend/
├── src/
│   ├── app/
│   │   └── page.tsx
│   ├── components/
│   │   ├── CascadeGraph.tsx
│   │   ├── DecayCurves.tsx
│   │   ├── DownloadSampleData.tsx
│   │   ├── Filters.tsx
│   │   ├── InfluencerNodes.tsx
│   │   ├── ReplayControls.tsx
│   │   ├── ShaderBackground.tsx
│   │   ├── SpreadTimeline.tsx
│   │   ├── WhoControlsRailPanel.tsx
│   │   └── WhyMattersPanel.tsx
│   └── types/
│       └── cascade.ts
├── next.config.ts
├── tailwind.config.mjs
└── package.json
```

## Important frontend components

### `page.tsx`

Main dashboard orchestration.

Responsible for:

- Fetching `/api/cascade`.
- Replay state.
- Time-window filtering.
- Influence filtering.
- Visible event calculation.
- Passing normalized data to child components.

### `CascadeGraph.tsx`

Canvas-based cascade topology renderer.

Responsible for:

- Force-style simulation.
- Event-derived graph edges.
- Node drawing.
- Deterministic node colors.
- Influencer highlighting.
- Hover tooltips.
- Internal visual graph zoom.
- Fixed outer graph container size.

### `ShaderBackground.tsx`

Fullscreen WebGL1 halftone background.

The shader is intentionally independent of cascade data.

### `SpreadTimeline.tsx`

Recharts timeline visualization.

### `DecayCurves.tsx`

Recharts decay visualization synchronized with replay.

### `ReplayControls.tsx`

Playback controls and snapshot export actions.

### `InfluencerNodes.tsx`

Influencer ranking panel.

### `WhoControlsRailPanel.tsx`

Reach concentration and control analysis.

### `Filters.tsx`

Dashboard filtering controls.

---

# Prerequisites

Recommended environment:

- Node.js 18+.
- npm.
- Python 3.10+.
- A modern browser with WebGL1 support.

Verify:

```powershell
python --version
node --version
npm --version
```

---

# Local development

## 1. Clone the repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd POC-48-Social-Virality-Caascade-Explorer-Samuel392-intern
```

---

## 2. Start the backend

Open a terminal in:

```text
backend/
```

### Create the virtual environment

If it has not been created yet:

```powershell
python -m venv venv
```

### Activate the environment

PowerShell:

```powershell
.env\Scripts\Activate.ps1
```

You should see:

```text
(venv) PS ...
```

If PowerShell blocks script execution:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

Then:

```powershell
.env\Scripts\Activate.ps1
```

### Install dependencies

If `requirements.txt` exists:

```powershell
python -m pip install -r requirements.txt
```

At minimum, the backend needs FastAPI, Uvicorn, and Pydantic.

### Start FastAPI

The project currently uses **port 8001**:

```powershell
python -m uvicorn app.main:app --port 8001
```

Test:

```text
http://localhost:8001/api/cascade
```

Optional deterministic scenario:

```text
http://localhost:8001/api/cascade?seed=4827&duration_minutes=60
```

---

## 3. Start the frontend

Open a second terminal in:

```text
frontend/
```

Install dependencies:

```powershell
npm install
```

Start Next.js:

```powershell
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## 4. Frontend/backend routing

The frontend requests:

```text
/api/cascade
```

Next.js rewrites this to FastAPI:

```text
http://localhost:8001/api/cascade
```

Architecture:

```text
Browser
   │
   ▼
Next.js
localhost:3000
   │
   │ rewrite
   ▼
FastAPI
localhost:8001
```

Keep the backend terminal running while using the frontend.

---

# Troubleshooting

## `uvicorn` is not recognized

Use:

```powershell
python -m uvicorn app.main:app --port 8001
```

If dependencies are missing:

```powershell
python -m pip install -r requirements.txt
```

## `ModuleNotFoundError: No module named 'fastapi'`

Activate the venv:

```powershell
.env\Scripts\Activate.ps1
```

Then install:

```powershell
python -m pip install fastapi uvicorn pydantic
```

## Port 8000 is already in use

The project currently uses:

```text
8001
```

Start with:

```powershell
python -m uvicorn app.main:app --port 8001
```

## Port 8001 is already in use

Check:

```powershell
netstat -ano | findstr :8001
```

Then:

```powershell
Get-Process -Id <PID>
```

Terminate an old Python/Uvicorn process if appropriate and restart the backend.

## Frontend reports `Invalid cascade response: missing events, nodes, or metrics.`

Check:

```text
http://localhost:8001/api/cascade
```

The response must contain:

```text
scenario_id
generated_at
source
nodes
events
metrics
influencers
peak_velocity
peak_timestamp
half_life_minutes
top3_reach_share
control_score
```

If it instead contains legacy fields such as `edges`, `timeline`, or `decay_curve`, the frontend is reaching an old backend process.

## WebGL background does not appear

The shader requires WebGL1. The application falls back to the normal dashboard if WebGL is unavailable.

## Shader background is too dominant

In `ShaderBackground.tsx`, adjust:

```tsx
opacity: 0.62
```

For a subtler effect:

```tsx
opacity: 0.45
```

For a stronger effect:

```tsx
opacity: 0.75
```

## Halftone dots are too large

In `ShaderBackground.tsx`:

```glsl
float cells = 18.0 + u_intensity * 30.0;
```

Higher `cells` values make smaller dots. For example:

```glsl
float cells = 36.0 + u_intensity * 55.0;
```

---

# Data provenance

The project explicitly separates real and synthetic sources.

Current API source metadata:

```json
{
  "gdelt": "not_used",
  "social_cascade": "synthetic",
  "views": "synthetic",
  "metrics": "derived"
}
```

Therefore:

- The social propagation network is not being presented as real platform event telemetry.
- View counts are synthetic.
- Analytics are calculated from the synthetic event stream.
- GDELT is reserved as an upstream/adapter source and is not currently used for social event-level data.

This distinction should remain visible as the project evolves.

---

# Design principles

## Distribution & Demand is the core rail

The dashboard focuses on:

- Who can reach audiences.
- How quickly information travels.
- Where reach concentrates.
- Which nodes have disproportionate amplification power.

## Event-driven over arbitrary snapshots

The cascade is modeled as a chronological event stream rather than separately generated nodes, edges, timelines, and decay arrays.

That makes replay and derived analytics causally connected.

## Synthetic data is clearly labeled

Synthetic data is suitable for a proof of concept, but simulated reposts and views should never be presented as real platform telemetry.

## Derived analytics should be reproducible

Metrics such as influence, velocity, reach concentration, and half-life are calculated from the underlying event stream.

---

# Future extension points

Potential adapter structure:

```text
backend/app/
├── adapters/
│   ├── gdelt.py
│   ├── social_platform.py
│   └── ...
```

Intended pattern:

```text
External source
      │
      ▼
Data adapter
      │
      ▼
Normalized event model
      │
      ▼
Cascade analytics
      │
      ▼
Frontend
```

This allows external sources to be introduced without rewriting the visualization layer.

---

# Production considerations

Before deploying beyond a proof of concept, consider:

- Authentication and API authorization.
- Rate limiting.
- Structured logging.
- Input validation and request limits.
- Persistent scenario storage.
- Background ETL jobs.
- Adapter-level provenance tracking.
- Monitoring and error reporting.
- CDN/caching for static assets.
- Server-side generation for large scenarios.
- Real-data licensing and platform API terms.
- Privacy and data-governance controls.

---

# Development workflow

### Backend

```powershell
cd backend
.env\Scripts\Activate.ps1
python -m uvicorn app.main:app --port 8001
```

Verify:

```text
http://localhost:8001/api/cascade
```

### Frontend

In another terminal:

```powershell
cd frontend
npm run dev
```

Then:

```text
http://localhost:3000
```

### Dependency changes

Frontend:

```powershell
npm install
```

Backend:

```powershell
python -m pip install -r requirements.txt
```

---

# Current project status

The current implementation includes:

- Event-driven synthetic cascade generation.
- FastAPI analytics API.
- Next.js dashboard.
- Cascade topology visualization.
- Replay mode.
- Spread timeline.
- Propagation decay.
- Influencer analysis.
- Rail control analysis.
- Dashboard filters.
- JSON export.
- Animated WebGL1 halftone background.
- Explicit synthetic-data provenance.

The primary evolution path is to improve synthetic cascade richness and realism, then introduce external-source adapters while keeping provenance explicit.

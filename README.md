# 🪨 Bedrock Finder

> Reverse-engineer your Minecraft coordinates from bedrock floor patterns.

Bedrock Finder is a tool that lets you determine your **exact X/Z coordinates** in a Minecraft world by entering the bedrock/deepslate pattern you observe beneath your feet. It works by comparing your pattern against the deterministic noise function Minecraft uses to generate bedrock, narrowing down all possible matching positions.

---

## How It Works

Minecraft's bedrock floor (y=0–4) is generated using a **deterministic per-block random function** seeded from the world seed and block coordinates. The pattern is unique enough across a region that a small observed grid can reliably pinpoint your position.

```
Observed grid (9×9)  →  Pattern matcher  →  Candidate coordinates
       ■□■□□               backend API         (x: 512, z: -240)
       □■□■□                                   (x: 512, z: -2544)  ← best match
       ■□□□■
```

1. **Open the grid editor** and paint in the bedrock (■) and non-bedrock (□) blocks you see at your feet
2. **Configure** your Minecraft edition, y-level scanned, and search region
3. **Submit** — the API scores every candidate position against your pattern
4. **Teleport** to the best match

---

## Project Structure

```
bedrock-finder/
├── frontend/        # React + TypeScript UI
├── backend/         # Node/Express pattern-matching API
├── shared/          # Types and core algorithm (used by both)
├── docs/            # Architecture notes and algorithm writeup
└── .github/
    └── workflows/   # CI and deployment pipelines
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Install

```bash
git clone https://github.com/your-org/bedrock-finder.git
cd bedrock-finder
npm install
```

### Run (dev)

```bash
npm run dev
```

Frontend: http://localhost:5173  
Backend API: http://localhost:3000

### Run tests

```bash
npm test
```

### Build for production

```bash
npm run build
```

---

## API

### `POST /api/analyse`

Accepts a bedrock grid and returns ranked coordinate candidates.

**Request**

```json
{
  "grid": [[1,0,1,0],[0,1,0,1],[1,1,0,0],[0,0,1,1]],
  "yLevel": 4,
  "edition": "java",
  "searchRadius": 1000,
  "worldSeed": "optional — leave blank for seed-agnostic search"
}
```

**Grid values**: `0` = stone/air, `1` = bedrock

**Response**

```json
{
  "candidates": [
    { "x": 512, "z": -240, "confidence": 0.97, "matchedCells": 15, "totalCells": 16 },
    { "x": 512, "z": -2544, "confidence": 0.81, "matchedCells": 13, "totalCells": 16 }
  ],
  "searchedPositions": 4000000,
  "durationMs": 312
}
```

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Issues and PRs are welcome.

## License

MIT

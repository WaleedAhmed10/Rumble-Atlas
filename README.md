# WWE Royal Rumble Predictor

A **MERN Stack** web app that lets you build a Royal Rumble roster, run live simulations, and get **AI/ML win predictions**, for real WWE fans

- **M**ongoDB — stores wrestlers, rumble setups, and simulation history
- **E**xpress — REST API backend
- **R**eact — frontend UI (Vite)
- **N**ode.js — server runtime

## Features

| Page | What it does |
|------|-------------|
| **Home** | Overview, recent simulations, quick links |
| **Wrestlers** | Add/edit/delete wrestlers (CRUD), import/export JSON |
| **Builder** | Pick 30 wrestlers and assign entry numbers #1–#30 |
| **AI Predict** | ML win probability (weighted scoring + Monte Carlo) |
| **Simulate** | Watch the Rumble play out minute-by-minute |
| **Results** | View winner, stats, timeline, share results |

## AI / ML (Simple & Easy to Understand)

The ML lives in `server/ml/predictor.js`:

1. **Weighted Scoring** — combines win %, elimination resistance, and entry position bonus (late entries get a boost)
2. **Monte Carlo** — runs 500 full simulations and counts who wins most often. It uses the same match engine (`server/ml/engine.js`) as the live Simulate page, and both win % and elimination resistance affect each match

No TensorFlow or Python needed — pure JavaScript that's easy to read and modify.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- MongoDB is **optional** — file storage works out of the box

## Quick Start

### 1. Install dependencies

```bash
npm run install-all
```

### 2. Configure database (optional)

Copy the example env file:

```bash
# macOS / Linux
cp server/.env.example server/.env
# Windows (cmd)
copy server\.env.example server\.env
```

The server tries MongoDB first. If it is not running, it automatically uses JSON file storage — no extra setup needed.

> Shortcut: `npm run dev` starts the backend and frontend together.

### 3. Start the backend (Terminal 1)

```bash
npm run server
```

Server runs at **http://localhost:5000**

### 4. Start the frontend (Terminal 2)

```bash
npm run client
```

App opens at **http://localhost:3000**

## Project Structure

```
WWE-Royal-Rumble-Predictor/
├── client/                 # React frontend
│   └── src/
│       ├── pages/          # Home, Wrestlers, Builder, Simulate, Results, Predictions
│       ├── components/     # Navbar, shared UI
│       └── App.css         # All page styles
├── server/                 # Express backend
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API routes
│   ├── ml/predictor.js     # AI/ML prediction logic
│   └── data/               # Default wrestler roster
└── package.json            # Root scripts
```

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/wrestlers` | List all wrestlers |
| POST | `/api/wrestlers` | Add wrestler |
| PUT | `/api/wrestlers/:id` | Update wrestler |
| DELETE | `/api/wrestlers/:id` | Delete wrestler |
| POST | `/api/wrestlers/reset` | Reset to default roster |
| GET | `/api/setup` | Get current rumble setup |
| POST | `/api/setup` | Save rumble setup |
| GET | `/api/simulations` | Simulation history |
| POST | `/api/simulations/run` | Run a full match on the server, save it, return frames to replay |
| POST | `/api/simulations` | Save simulation result |
| POST | `/api/predict` | Quick AI prediction |
| POST | `/api/predict/monte-carlo` | Monte Carlo prediction |

## License

See [LICENSE](LICENSE).

---

*Fan project — not affiliated with WWE*

## Deploying

`render.yaml` deploys the API only. Without `MONGODB_URI` the API falls back to a JSON file, which Render's free tier wipes on every restart/deploy, so set `MONGODB_URI` (e.g. a free MongoDB Atlas cluster) for data that persists. Deploy the `client` separately (Netlify, Vercel, Render Static Site) with `VITE_API_URL` set to `https://<your-api>.onrender.com/api`.

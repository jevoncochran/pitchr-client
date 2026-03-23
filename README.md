# Pitchr — Client

Frontend for **Pitchr**, a CRM built for Intercon Visuals to manage outbound B2B sales for a video production agency in Tampa, FL.

Built with React + TypeScript + Vite, styled with Tailwind CSS.

---

## What it does

- **Dashboard** — overdue follow-ups, today's tasks, gone-silent alerts, and pipeline stats at a glance
- **Leads** — searchable, filterable list of prospects with pipeline stage, industry, business type, and hot lead flags
- **Pipeline** — drag-and-drop kanban board across 9 stages with stage visibility controls
- **Follow-up Sequence** — kanban view of where every lead sits in the A/B/C outreach cycle
- **Lead Detail** — full profile with touchpoint history, contacts, social handles, notes, locations, and referral tracking

---

## Tech Stack

| Layer | Library |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS |
| Routing | React Router v6 |
| Drag & drop | @hello-pangea/dnd |
| Icons | react-icons |
| HTTP | axios |

---

## Prerequisites

- Node.js 18+
- The Pitchr server running (see `pitchr-server`)

---

## Getting Started

```bash
# Install dependencies
npm install

# Copy the environment file and fill in your values
cp .env.example .env

# Start the dev server
npm run dev
```

The app runs at `http://localhost:5173` by default.

---

## Environment Variables

Create a `.env` file in the project root:

```env
VITE_API_URL=http://localhost:3000
```

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the Pitchr backend. Use your Railway URL in production. |

---

## Building for Production

```bash
npm run build
```

Output goes to `dist/`. Deploy to Vercel, Netlify, or any static host.

> **Important:** Set `VITE_API_URL` to your production backend URL before building.

---

## Project Structure

```
src/
├── components/       # Shared UI (InternalLayout, nav, modals)
├── pages/
│   ├── DashboardPage.tsx
│   ├── LeadsPage.tsx
│   ├── LeadDetailPage.tsx
│   ├── AddLeadPage.tsx
│   ├── PipelinePage.tsx
│   ├── SequencePage.tsx
│   └── LoginPage.tsx
├── types.d.ts        # Shared TypeScript types and enums
├── App.tsx           # Route definitions
└── main.tsx          # Entry point
```

---

## Notes

- All API calls use `axios` with `VITE_API_URL` as the base — never hardcode `localhost:3000`
- Pipeline stages: `NEW_LEAD`, `CONTACTED`, `ENGAGED`, `MEETING_SCHEDULED`, `PROPOSAL_SENT`, `CONVERTED`, `DORMANT`, `NOT_A_FIT`, `LOST`
- Sequence positions: `VISIT_A`, `A1–A3`, `VISIT_B`, `B1–B3`, `VISIT_C`, `C1–C3`

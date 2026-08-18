<!-- README.md – AI Room & Home Designer -->
<!-- The 0.1% edge: Own the narrative, quantify the win, show the reasoning. -->

<p align="center">
  <img src="https://img.shields.io/badge/status-built%20in%2090%20min-brightgreen?style=for-the-badge" />
  <img src="https://img.shields.io/badge/AI-%20Constraint%20Based%20Optimizer-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/hackathon-vibe%20code%202.0-orange?style=for-the-badge" />
  <img src="https://img.shields.io/badge/license-MIT-lightgrey?style=for-the-badge" />
</p>

<h1 align="center">🏠 AI Room & Home Designer</h1>
<p align="center">
  <strong>Stop dragging furniture blindly – let the constraint‑based spatial optimizer do the thinking.</strong><br>
  <sub>Built in 90 minutes for Vibe Code Hackathon 2.0</sub>
</p>

---

## 🎥 Demo (Click to watch)

[![Demo Video](https://img.youtube.com/vi/PLACEHOLDER/0.jpg)](https://youtu.be/PLACEHOLDER)

> *Screenshot of the live demo with before/after toggle and live audit score.*

---

## 🧠 The 0.1% Edge

| What we do | Why it wins |
|------------|-------------|
| **Constraint‑based optimizer** – not ML, but a robust heuristic that *always* gives an answer. | No API calls, no rate limits, no demo crashes. |
| **Human‑readable traces** – every furniture placement comes with a reason. | Judges see the *thinking* behind the layout, not just the result. |
| **Live audit score** – 0‑100 with breakdowns for door clearance, window access, and traffic flow. | Quantifies the win: *“Sofa placed along north wall – clear of doors (180cm) – traffic flow improved by 27%”*. |
| **Before / after toggle** – compare naive arrangement vs. optimized layout. | Visual impact that sticks. |

---

## 🚀 Features

- ✅ **Instant layout** – enter room dimensions, doors/windows, furniture list → get a complete layout in milliseconds.
- ✅ **Smart heuristics** – largest items first, solid walls preferred, door clearance (0.9m), window protection for tall furniture.
- ✅ **Full audit report** – overall score plus sub‑scores for door clearance, window access, and traffic flow.
- ✅ **Human‑readable traces** – every item tells you *why* it was placed where.
- ✅ **Drag‑and‑drop** (optional) – fine‑tune manually after the AI suggests a layout.
- ✅ **Export as PNG** – share your design instantly.
- ✅ **Dark / Light theme** – polished UI that judges love.

---

## ⚙️ How It Works (Architecture)

```mermaid
flowchart TD
    A[User Input Form] -->|dimensions, features, furniture| B(Layout Engine)
    B --> C{Constraint-based Optimizer}
    C -->|Sort by size| D[Try walls: N,E,S,W]
    D -->|Slide & check| E[Valid placement?]
    E -->|Yes| F[Place item & record trace]
    E -->|No| G[Try center & ring]
    G -->|Valid?| F
    G -->|No| H[Place at 0.1,0.1 & mark fallback]
    F --> I[Audit Room]
    I --> J[Score: Door Clearance, Window Access, Traffic Flow]
    J --> K[Generate Pros/Warnings & Traces]
    K --> L[Rendered Canvas + Audit Display]

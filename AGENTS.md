# AGENTS.md — VIBE CODE HACKATHON 2.0
## Problem 01: AI Room & Home Designer — Team Rulebook

**Time budget: 90 minutes. No exceptions, no scope creep after minute 10.**

This file is the single source of truth for the team. If there's ever a
disagreement mid-build, whatever this file says wins — argue about it
*after* we submit, not during.

---

## 0. The Contract (read this first)

- Scope is **locked at T+10min**. Anyone who suggests a new feature after
  that gets told "add-on list" and ignored until core is done.
- **Integrate every 15 minutes.** Nobody works in isolation for 40+ minutes.
  Isolation is how hackathon teams die at minute 85 with three unmerged pieces.
- **Working > clever.** A boring feature that runs flawlessly beats an
  ambitious one that crashes on stage.
- **Every module fails silently, never loudly.** No red console errors on
  screen, ever, during demo. Wrap it, catch it, default it.

---

## 1. Architecture (locked)

- Single-page app. Plain HTML/CSS/JS (or React only if the team already
  knows it cold — do not learn a framework right now).
- **Room canvas**: SVG or `<canvas>`, grid-based, renders room outline from
  user-entered dimensions + door/window positions.
- **Layout engine**: rule-based placement (constraint heuristic, not ML).
  This is the "AI" — own it, name it confidently ("constraint-based spatial
  optimizer"), don't apologize for it not being a neural net.
- **Input**: structured form (dimensions, doors, windows, furniture list) +
  optional natural-language box that parses into the same structured format.
- **No backend server** unless the LLM call requires one. If in doubt, skip
  the LLM call — keyword-matching parser is zero-risk and still demos fine.

---

## 2. Agent Roles & Ownership

Each agent owns their file(s) and does NOT touch another agent's files
without asking in the group chat first. Merge conflicts waste more time
than almost anything else in a 90-minute build.

### Agent A — Canvas & Rendering
**Owns:** `canvas.js` / `Room.jsx`
- Render room outline from length/width input.
- Place door/window markers on walls at user-specified positions.
- Draggable, grid-snapped furniture rectangles/icons.
- **Definition of done:** a room with 3+ furniture pieces can be dragged
  around without breaking, at any room size from 6x6 to 30x30 ft.

### Agent B — Layout Engine ("the AI")
**Owns:** `layoutEngine.js`
- Input: room dims + door/window positions + furniture list (with
  approximate sizes). Output: x/y/rotation for each item.
- Heuristic: place largest items against longest clear walls first, keep a
  clearance radius around doors, avoid window-blocking for tall furniture,
  maximize contiguous open floor space.
- Also compute the **flow/walkability score** (e.g. % of floor area kept
  clear + door clearance met = score out of 100). This is the differentiator
  — give it the most focus and the most testing.
- **Definition of done:** given any reasonable input, returns a layout with
  zero overlapping furniture and a numeric score, every time, no exceptions.

### Agent C — UI/UX & Input
**Owns:** `styles.css`, input form markup
- Clean input form: dimensions, doors/windows, furniture picker (checkboxes
  or dropdown, not free text — free text is Agent D's error-proofing nightmare).
- Natural-language input box (optional feature — wire it to a simple parser
  or LLM call, but the structured form must work standalone as a fallback).
- One consistent color palette, one font pairing, a title screen, a
  before/after toggle animation. This is what judges see in the first 5 seconds.
- **Definition of done:** the whole app looks like one product, not four
  people's homework stapled together.

### Agent D — Integration, Error-Proofing, Demo
**Owns:** `main.js` (glue code), the pitch
- Merges A + B + C every 15 minutes on the clock — set a phone timer.
- Wraps every function boundary in try/catch with sane fallback values.
- Caps inputs to prevent demo-breaking edge cases (max room size, max
  furniture count) rather than trying to "fix" every edge case.
- Writes and rehearses the 90-second pitch (see Section 4).
- **Definition of done:** the full click-through — enter room, enter
  furniture, hit generate, see layout + score — works twice in a row without
  touching devtools.

---

## 3. The Checkpoint Rule

Set a phone timer. At **every** checkpoint, whoever is "done" helps whoever
is behind. Nobody keeps polishing their own piece while a teammate is stuck.

| Time | Checkpoint |
|---|---|
| T+10 | Scope locked, files split, wireframe agreed |
| T+25 | First merge — does anything render at all? |
| T+40 | Second merge — can you go input → layout end to end (ugly is fine) |
| T+55 | Third merge — full pipeline working, start error-proofing |
| T+70 | Feature freeze. Only bug fixes from here. |
| T+80 | Polish pass done. Pitch rehearsed once. |
| T+88 | Final test on the actual demo laptop. |
| T+90 | Submit. |

---

## 4. Demo Script (Agent D owns this, but everyone should know it)

1. **(10s)** "Most room-planning tools make you drag furniture around
   blind. We built a layout engine that actually reasons about clearance,
   flow, and usability."
2. **(20s)** Type a natural-language prompt or fill the form live.
3. **(20s)** Hit generate — show the before (naive/messy) vs. after
   (optimized) toggle.
4. **(15s)** Point at the flow score. Explain in one sentence what it means.
5. **(15s)** Close: "With more time we'd add [voice input / real ML
   placement / multi-room support] — but this core loop is fully working,
   end to end, right now." Judges reward honesty about scope over
   overclaiming.

Never say "AI" without being able to answer "what's actually happening
under the hood" in one sentence. Have that sentence memorized.

---

## 5. Add-ons (only touch these after T+70 if core is fully done)

Priority order — stop at the first one you don't finish:

1. Dark/light theme toggle (cheap, looks professional)
2. Export layout as PNG
3. Voice input for the natural-language box (high risk — only if way ahead)

---

## 6. The 0.1% Edge

This is what separates a top-1% submission from a merely-working one.
Most teams will submit a functional-but-generic version of this exact
prompt. Here's how you don't blend in:

- **Name your algorithm.** "Constraint-based spatial optimizer" sounds like
  a real system. "We used if-statements to move furniture" does not — even
  if it's the same code. Precision of language signals engineering maturity
  to judges who are pattern-matching on confidence as much as substance.
- **Show your reasoning, not just your output.** A one-line explanation
  under the generated layout ("Bed placed along north wall — clears 3ft
  door swing, maximizes natural light from window") turns a black box into
  something that *reads* as intelligent, even though it's just a
  human-readable trace of the heuristic. This is the single highest
  ROI move in your entire 90 minutes.
- **Quantify the win.** Don't just say "better layout" — show "62% → 89%
  usable floor space" or "clearance violations: 3 → 0." Judges remember
  numbers, not adjectives.
- **Rehearse the failure answer, not just the success demo.** When asked
  "what if it doesn't fit," or "what about irregular room shapes," the
  team that says "great question, here's exactly where we drew the line
  and why" beats the team that gets defensive. Confidence about your
  scope boundary reads as expertise, not weakness.
- **Ship the honest limitation up front**, before they ask. It preempts
  the "gotcha" question and reframes the whole judging conversation around
  what you built well instead of what you didn't build.

---

## 7. Hard Rules (do not break these)

- No new features after T+10.
- No unmerged branches after T+55.
- No console errors visible during demo — catch everything.
- No one person becomes a bottleneck others wait on — if you're blocked
  more than 5 minutes, say so out loud immediately.

# Product brief: Foundation cross-product expansion and discovery

**Author:** Natalie Friedman · **Date:** August 24, 2026 · **Status:** Exploration, continues the August prototype (5 moments, live at natdaalleykat.github.io/ld-prototypes-aug2026/foundation-expansion/)

## Problem

Nearly all Foundation (and Developer) customers use feature flags only. Experimentation, Observability, and Guarded Rollouts are already in or attached to the plan they pay for, but customers never discover them, never enable them, and never build the habit that makes them expand or renew. Interruption marketing has not moved this. The account is instrumented, the SDK is installed, and the problems these products solve show up in the customer's normal flag workflow every week. We are not catching those moments.

## Goals

Three adoption goals, each with its own funnel:

1. **Experimentation**: get flags-only customers to run their first experiment.
2. **Observability**: get them to enable session replay, errors, logs, or traces.
3. **Guarded Rollouts**: get them to run their first guarded rollout (grounded in what the Guardian trial and Foundation/Developer plans actually include, verified in code).

Non-goal: pricing or packaging changes. This is discovery and activation of what they already have or can trial.

## Method

For each goal, work through four questions, in this order:

1. **Lowest-friction enable moments.** Where is enabling the thing nearly free because of what the user is already doing? Example: they are already pasting SDK install code, and o11y is two more lines in the same file.
2. **Problem moments.** Where does the user hit the exact problem the product solves? Example: staring at a flag rollout with no idea if it hurt anything (guarded rollout), or at an experiment result with no idea why it lost (session replay).
3. **Existing enablers.** What product machinery already exists that lowers the cost (audiences, event awareness for metric pre-matching, SDK detection), and who is entitled to it on which plan.
4. **Channel and message.** For each moment: the right surface (inline card, modal, empty state, email, Vega), the positioning, and the copy angle.

Every concept gets an engineering feasibility pass against the product codebase before it survives: if the mock says "one click," we name exactly what the product would have to do to make that click real, and either scope it honestly or kill it. Designer, PM, and engineer takes on each concept, iterated until they agree.

## Deliverables

1. **The exploration doc**: moments matrix per goal, feasibility verdicts with code citations, channel recommendations.
2. **Refined prototype**: keep the moments that survive, revise the ones that overpromise, add new ones for guarded rollouts and the o11y surfaces beyond replay.
3. **Recommendations**: (a) the shortlist we believe will actually work, and (b) the smallest cheapest test for each that answers the riskiest question first. Example: before building a slick "turn this rollout into an experiment" flow, ship a dumb card in that spot and measure whether anyone clicks it.

## Principles

- Suggest at the moment of the problem, not on a schedule.
- Never suggest what we cannot verify is low friction for this account (right SDK, right plan, right data present).
- Demand-test before build: engagement on the cheap version gates investment in the flow behind it.
- Honest mechanics: no mock ships a promise the primitive cannot keep.

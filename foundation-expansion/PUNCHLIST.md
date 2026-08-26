# Punch list: product changes to ship the four flows

Sizes: XS (hours) / S (days) / M (1-2 weeks) / L (multi-week or cross-team). Anchors are the product codebase paths from `research/`. Each flow ships behind its own dogfood flag targeted on account-context attributes (the flags-only account attributes etc., the product code).

## Shared (build once, used by A, B, D)

| # | Change | Anchor | Size |
|---|---|---|---|
| S1 | "Create metric from event" module: event list (key, volume, last seen) + prefilled create-metric modal. Reuse existing internal APIs and the existing prefill path (the product code). New UI is the sourced list wrapper. | the product code | M |
| S2 | Marketo lifecycle map entries: first-metric-created, o11y-integrated, first-guarded-started, first-experiment-started (one map line + one Marketo field each; clone the AgentControl loop). | the product code | XS each |
| S3 | Flags-only targeting segments on the internal LD instance (no code). | account context attrs | XS |

## Flow A: experiment from a flag rollout

| # | Change | Anchor | Size |
|---|---|---|---|
| A1 | Inline card on rollout rules + save-modal variant. Add as a variant of the existing entry-point flag test rather than a new surface; reuse the analytics an existing internal API taxonomy. Gate: entitled, no experiment on flag, no active guarded/progressive rollout on rule, 0 experiments started. | the existing entry-point test; eligibility the product code (relax the single-variation predicate for the card only); save-flow slot the product code | S |
| A2 | Create modal prefills: name from flag name, attach line copy. Modal already accepts existing internal APIs props; deferred creation after flag save already exists. | the product code | XS-S |
| A3 | Design page "Ready to launch" checklist: reorder today's flat missing-requirements strings into an actionable checklist with inline hypothesis field. The strings and gating already exist (an existing internal API); this is presentation + inline actions. | the product code | M |
| A4 | Event-sourced metric section in the design page metrics picker (uses S1). | an existing internal API area | S on top of S1 |
| A5 | Start confirmation copy: one sentence stating the rule's rollout is replaced by the experiment's allocation; inline "turn on flag" step when flag is off. | start path + the product code | S |
| A6 | No-events branch: track() snippet + "we'll email when the first event arrives" (event-store last-seen gives the trigger; email via S2 pattern). | event_activity endpoints | S |
| A7 | Re-entry: flag sidebar Experiments row shows "1 draft · N steps left". | flag sidebar | S |

**Sequencing:** A1+A2 first (card → existing modal → existing design page), measure clicks. A3/A4 second, justified by click data. A5 ships with A1 (honesty is not optional). A6/A7 third.

## Flow B: first guarded rollout

| # | Change | Anchor | Size |
|---|---|---|---|
| B1 | Recommended tag input beyond release policies (signal-derived: >=2 variations, no policy). The tag renders today; extend an existing internal API's input. | the product code | S |
| B2 | Allowance line in the mode picker + review modal. Entitlement API already returns usage + limits; hide when unlimited (`hardLimit: -1`); degrade to upgrade line at hard cap. | the product codereview modal the product code | S |
| B3 | Sourced metrics picker: "From your telemetry" (autogen the auto-created telemetry metrics*`, show only when receiving events) + "From events you send" (S1) + scratch. Today the picker is a bare an existing internal API. | the product code | M |
| B4 | First-run notify default: already the default (`defaultRollback: false`). Add the one-line explainer copy under the Auto rollback column; flip default to rollback after first completed guarded rollout (account-level bit). | the product code | XS copy, S for the flip |
| B5 | Sessions link from regression evidence: an existing internal API as a near-copy of an existing internal API (time-scoped, flag-scoped query). Respect the regional sessions killswitch. | the product code | S |
| B6 | Completion-state ladder nudge ("measure the upside next time"). | the product code MonitoringCompleted state | S |
| B7 | PRODUCT DECISION (Guardian team): lifetime counter policy (reset window? exclude short-lived test rollouts?), 14-vs-30-day trial copy mismatch, and why the dead trackers' UI was cut. Blocks aggressive promotion of G1, not the build. | the product code | decision |

## Flow C: observability setup

| # | Change | Anchor | Size |
|---|---|---|---|
| C1 | Install-page checkbox extending snippets with the o11y plugins (diff-highlighted). Precedent on the same page: "Show guidance for Guarded Releases and Experimentation" checkbox with its tracked event. Snippet variants live in the shared snippet source (cross-repo). | the product code; the shared snippet source | M (cross-repo) |
| C2 | Monitoring blind-state card (rewired moment 3) opening the existing setup drawer; needs an environment-preselect prop and language-from-detected-SDK. | the product code (add `defaultEnvironmentKey`), the product code (an existing internal API) | S |
| C3 | Min-version compatibility table (SDK name+version → o11y plugin support), sourced from the shared snippet source. THE blocking dependency for every "detected compatible SDK" claim; without it, gate on SDK name only and soften copy. | the product code + new table | M |
| C4 | Connected celebration: toast + "what lit up" one-time callout on the Integrated Client/Server transition (hook exists and fires an event today). | the product code; one-time announcement primitive an existing internal API | S |
| C5 | 24h-after-copy recovery email (snippet-copied event exists; add the Marketo map entry, S2). | an existing internal API | XS |
| C6 | Regional sessions suppression in all copy (the regional sessions killswitch) and unsupported-SDK hiding. | route guards | XS-S |

## Flow D: metric from an event

| # | Change | Anchor | Size |
|---|---|---|---|
| D1 | Flags-list banner + "Unmeasured rollout" chips. Needs the unmeasured-rollouts count: rules with rollout, no an existing internal API, no attached experiment, last 90d. Cheapest as a frontend computation over flag list data; backend aggregation if list pagination hides it. | flags list; flag config data | S-M |
| D2 | Drawer (S1) + success state with the METRIC READY picker preview. | S1 + new success component | S on top of S1 |
| D3 | Show-once dismissal via member dismissals (server-persisted primitive exists). | an existing internal API / memberDismissals | XS |
| D4 | METRIC READY chips in the real rollout mode picker once >=1 metric exists (ties D to A/B). | the product code | S |

## Instrumentation gate (applies to every flow)

Ship nothing without: impression/click/dismiss on every new surface, per-step completion on checklists, and the flow's north-star conversion (A: start rate; B: guarded starts + second-rollout rate; C: integrated-within-7-days by entry; D: converts whose next rollout starts measured). Check the warehouse for the six dead guarded-rollout tracker names before minting new ones.

## v2 additions from the adversarial review (research/adversary-findings.md)

| # | Change | Flow | Size |
|---|---|---|---|
| V1 | Flag-level rollout predicate shared by card render and Start (replaces rule-level gate). | A | XS |
| V2 | Staleness gate on the save-modal entry (evaluation threshold) + pre-exposure disclosure in the Start dialog (count from flag diagnostics). | A | S |
| V3 | Approval-required environments: suppress the flow v1; later, defer experiment creation until approval applies. | A | S (suppress) / M (defer) |
| V4 | Permissions predicate: every entry renders only with all rights the terminal action needs. | all | S |
| V5 | Multivariate v1 restriction (2-variation flags) + >2-variation landing behavior (treatments todo, control = highest traffic). | A | S |
| V6 | Randomization unit derived from chosen metric's units; inline mismatch surfacing. | A, D | S |
| V7 | Success criteria = required explicit choice in the prefilled metric modal. | D | XS |
| V8 | Rollback/notify default sticky to last-used + visible change callout (no silent flips). | B | S |
| V9 | Grace-zone copy + save-time 403 handling (race on last slot). | B | S |
| V10 | Autogen suggestion section runtime check (autogen metrics exist for project AND pass RG validation). | B | S |
| V11 | Connected moment via email/Courier + 7-day listening-state timeout to troubleshooting; min-version troubleshooting line in the waiting state. | C | S |
| V12 | Exclude sample/templated experiments from the 0-experiments gate; per-member server-persisted dismissals; env label on each event row in D's drawer; entitlement-conditioned forward-pointing copy. | all | XS each |

Cut by review: "Pause ramp" regression action (ramp pauses itself); live diff-highlighting in the shared snippet source snippets for v1 (static appended block instead); sidebar readiness computation (v1 is a plain draft link).

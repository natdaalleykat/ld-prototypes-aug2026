# End-to-end flow specs (v1, pre-adversary)

Decisions below are grounded in research/ (mechanics verified against the product codebase + live flags). Each flow = trigger, steps, every branch, instrumentation, and the product changes required.

## Flow A: Experiment from a flag rollout

**Entry:** inline card (moment 1) or save-confirmation modal (moment 2) on a freshly configured percentage rollout rule.

**Gating (all must hold):** account entitled (the experimentation gate); no experiment on this flag; no active guarded/progressive rollout on this rule; account has started 0 experiments (this is a first-experiment activation flow, not a power-user feature); flag not archived; not dismissed for this flag.

### The core decisions (the questions Natalie asked)

1. **Auto-create? No. One-field modal.** Clicking opens the existing create-draft modal with name prefilled ("new-checkout-flow experiment", editable) and hypothesis optional. Draft creation is cheap (name only), but silent creation makes orphan drafts, surprises users, and skips the one moment of comprehension we get. One field, one button.
2. **Attach the flag? Yes, fully automatic.** Flag + the specific rule attached (rule id, or fallthrough for the default rule), treatments derived from the flag's variations with an even split, randomization unit defaulted to `user`, analysis config defaulted by methodology. If the rule isn't saved yet, use the existing deferred-creation machinery (create after flag save). The user never sees "attach a flag" as a task.
3. **No metric yet? The design page carries them.** Land on the design page with a "Ready to launch" checklist replacing today's flat missing-requirements list:
   - done: Flag and audience attached (shows flag + rule summary)
   - done: Treatments (50/50, editable)
   - todo: **Add a primary metric**, with three inline paths, in order: (a) "From events you already send": event-store list (event key, volume, last seen), each opens the create-metric modal prefilled with the event key locked; (b) pick an existing metric (hidden when project has none); (c) create from scratch.
   - todo: **Hypothesis** (required to start), single inline text field with a one-line helper and an example.
   - **Branch: account sends no events at all.** Honest state: "We haven't seen events from your app yet. Metrics are built on events you send with one line of code." + track() snippet + docs link + "we'll update this the moment an event arrives" (event store gives last-seen; poll). This is the only branch where code is required, and we say so.
4. **How do they know what's next?** The checklist is the answer: N of M complete, each todo is actionable in place, and the Start button's disabled tooltip lists exactly what's missing (exists today; keep). When the last item completes, Start becomes primary-highlighted.

### Start and after

5. **Start confirmation states the targeting change honestly:** "Starting updates the Default rule: the experiment serves its own traffic split (50/50) to this audience. Your flag stays on." If the flag is off: inline "Turn on flag" step in the same dialog, not an error.
6. **Running:** results page, iteration running; design health checks surface "waiting for metric events" as a status, not a failure, for the first hours.

**Branches:** flag turned off between create and start (inline fix); guarded/progressive rollout started on the rule meanwhile (start blocked with the reason and a link to the rollout); user abandons draft (draft persists; the flag sidebar Experiments row shows "1 draft · 2 steps left", the re-entry point).

**Instrumentation:** card shown/clicked/dismissed (reuse an existing internal API taxonomy), modal completion, per-checklist-step completion, metric-path chosen (event/existing/scratch), time-to-start, start rate, D7 result views.

## Flow B: First guarded rollout

**Entry:** rollout mode picker (moment 5), guarded option with Recommended tag + "5 included, 0 used" line.

**Gating:** the guarded-rollouts gate on; hard limit not reached (at hard limit the option renders with an upgrade line instead of the inclusion line, and does not carry the Recommended tag); Recommended shown when the rule has ≥2 variations and no policy already recommends something else.

### Steps

1. **Select guarded → the existing form**, with the metrics field upgraded to three sourced sections:
   - "From your telemetry" (o11y connected): autogen metrics (HTTP error rate, latency), top suggestion preselected. This is the zero-setup path.
   - "From events you send": event-store list, one-click create (shared module with Flow A).
   - Neither: create from scratch + a cross-link: "Set up observability and get error and latency metrics automatically" (into Flow C). No dead ends.
2. **Regression behavior default: notify, not auto-rollback, for the account's first guarded rollout.** Rationale: a false-positive auto-rollback on their first try destroys trust in the whole product; a notify that catches a real regression builds it. The toggle is visible with plain copy; after one completed guarded rollout, default flips to rollback.
3. **Target by** defaults from the metric's randomization units (user). **Stages** default 5/10/25/50 over 24h with presets.
4. **Review and save** shows the guarded instruction summary plus the allowance line: "This uses 1 of your 5 included guarded rollouts (starts when the rollout starts)."
5. **Running:** rule card shows stage progress (current %, next stage countdown) + health badge (flag receiving evaluations, metric receiving events).
6. **Regression (notify mode):** banner on the flag + email/inbox: metric vs baseline chart, top error groups and a "watch a session" link when o11y is connected, actions: Roll back now / Keep serving / Pause ramp. Auto-rollback mode: "we reverted to current-checkout at 14:32" + evidence + restore path.
7. **Clean completion:** "Rolled out to 100%, no regressions across 4 stages." Ladder nudge: "Next time, measure the upside too: run it as an A/B test."

**Branches:** no metric and no events and no o11y (create from scratch or Flow C detour; the guarded option never disappears); allowance approaching/exhausted (existing usage alerts; at hard cap the Save-blocked state must be impossible to reach from this flow because the entry point already degraded).

**Instrumentation:** picker option views/selects by entitlement state, metric source chosen, notify-vs-rollback setting, save rate, the guarded-trial backend event (filter state), regression encounters, rollback actions, completion rate, second-guarded-rollout rate.

## Flow C: Observability setup (both entries)

**Entries:** (1) SDK install page checkbox (moment 6); (2) "Set up observability" from the flag Monitoring blind state (moment 3), which opens the existing setup drawer with environment preselected and language from the detected SDK.

### Steps

1. Checkbox (default off) extends install + init snippets live with diff highlighting. Copy is the honest scope: two packages, one config block, privacy strict by default.
2. **Awaiting connection:** same pattern as SDK setup verify-connection: "Listening for telemetry from Production…" persistent but calm; user may deploy hours later, so the state also lives on the Monitoring tab.
3. **Connected (Integrated transition):** toast + the Monitoring page fills in; a one-time "what just lit up" callout: errors/sessions/logs/traces tabs live, 4 metrics auto-created (link to metrics list), "your next rollout can guard itself" (into Flow B).

**Branches:** unsupported SDK (checkbox hidden; moment-3 card hidden; nothing renders rather than a dead end); sessions regionally unavailable (suppress replay claims, keep errors/logs/traces); telemetry arrives in a different environment than preselected (connected state names the env it heard from).

**Instrumentation:** checkbox opt-in rate, snippet copies, drawer opens by source, integrated-within-7-days by entry point, downstream: guarded rollout starts among newly integrated accounts.

## Flow D: Metric from an event you already send

**Entry:** flags-list banner (moment 4).

**Gating:** ≥2 rollout rules in the last 90 days with no metric/experiment attached; ≥1 active event key; 0 non-autogen metrics in the project; dismissible with server-persisted show-once.

### Steps

1. Banner → drawer: events with volume and last-seen (event store, sorted by last seen).
2. "Create metric" → existing create-metric modal prefilled via the existing path: event key locked, name suggested from the key, success criterion defaulted (conversion, higher is better), randomization unit defaulted.
3. **Success state answers "now what":** "order_completed conversion is ready. Next time you roll out a flag, choose Experiment or Guarded rollout in the rollout picker; this metric will be one click away." Explicitly forward-looking; running rollouts are never touched (exposure contamination).
4. Next rollout: flows A and B light up with the metric present.

**Instrumentation:** banner shown/clicked/dismissed, drawer event chosen, metric created within 7 days, then: % of next rollouts started as experiment/guarded among converts vs control.

## Shared build

- **"Create metric from event" module** (list + prefilled modal): used by A (design page), B (metrics field), D (drawer). Build once.
- All four flows behind their own dogfood flags, targeted with account-context attributes (flags-only detection).
- Marketo map entries: first-metric-created, o11y-integrated, first-guarded-started, first-experiment-started.

---

# v2 amendments (post-adversarial review; full findings in research/adversary-findings.md)

1. **Flow A gates flag-level, not rule-level**: any measured/progressive rollout anywhere on the flag (fallthrough or any rule) suppresses the card and blocks Start; the same predicate runs at card render and at Start.
2. **E2 (save modal) gets a staleness gate**: the offer is valid only while the rule hasn't meaningfully served (evaluation threshold); after that the card suppresses, and any later Start dialog discloses prior exposure with a real count ("~4,100 users already saw a variation under the 25/75 split; results may carry pre-exposure bias").
3. **Approval-required environments: v1 suppresses the flow entirely.** Deferred creation against an unapplied approval request is undefined; "turn on flag" becomes an approval request too. Later version defers experiment creation until the approval applies.
4. **Allowance copy is lifetime-honest**: "Uses 1 of your 5 included guarded rollouts when it starts. Not refunded if it rolls back." Rollback and completion states show the updated count. The Guardian reset/exemption decision is a launch gate for promotion, not for the build.
5. **Flow C gains a gating section**: the o11y access gate enabled AND self-serve o11y entitlement; included quotas stated at the connected moment; regional sessions killswitch suppresses replay claims everywhere, including Flow B's regression link.
6. **Permissions rule for every flow**: an entry point renders only if the member holds every right the terminal action needs; otherwise it does not render at all.
7. **Multivariate v1**: the Flow A card shows only on 2-variation flags. More variations land on the design page with Treatments as an open step, control defaulted to the highest-traffic variation.
8. **Randomization unit follows the metric**, not a hardcoded `user` default; mismatches surface on the checklist, not at Start.
9. **Flow D never defaults metric direction**: success criteria is a required explicit choice (a `payment_failed` conversion metric with "higher is better" would poison Flow B's regression detection).
10. **No hidden default flips in Flow B**: rollback-vs-notify is sticky to last-used with a visible callout on change. Grace-zone copy exists ("using your 2 grace rollouts"), and a save-time 403 has honest copy even though the entry degrades first.
11. **Scope honesty**: the shared snippet source snippet variants are their own workstream (v1 = static appended block, no live diff); per-env integration detection is new backend work (v1 claims stay project-level); the sidebar draft row is a link, not a readiness computation; min-version table is a launch dependency with a troubleshooting fallback in the waiting state.
12. **Cut**: "Pause ramp" action (the ramp pauses itself on regression; the user's choices are roll back, keep serving, or dismiss the metric).

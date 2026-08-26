# Adversarial review findings (25, ranked) and dispositions — 2026-08-25

Blockers (all fixed in FLOWS v2 + prototype):
1. A: start blocker is FLAG-level (fallthrough or any rule with measured/progressive rollout blocks start; the product codeindependently verified). Card + checklist + Start all gate flag-level now.
2. A/E2: save-modal entry creates pre-exposure bias (rule serves user's split while they finish setup; Start re-buckets). Fixed: staleness gate (suppress card once the rule has served beyond a threshold), and the Start dialog discloses prior exposure with a count from flag diagnostics.
3. A: approval-required environments break deferred creation and inline flag-on. v1: suppress the flow in approval-required envs; later: defer create until approval applies, "request to turn on".
4. B: allowance copy must say lifetime + non-refundable. Fixed: "counts when it starts; not refunded if it rolls back", rollback state shows updated count. Guardian reset/exemption ask stays a launch gate for aggressive promotion.
5. C: gating section added: the o11y access gate=enabled AND self-serve entitlement; quotas stated in the connected callout.

Majors (dispositions):
6. Permissions: every entry renders only when the member holds all rights the terminal action needs; invisible otherwise (v1).
7. Multivariate: v1 card restricted to 2-variation flags; >2 lands with Treatments as a todo, control defaulted to highest-traffic variation.
8. Randomization unit defaults from the chosen metric's units (event store carries ContextKinds); mismatch surfaces inline on the checklist.
9. D: success criteria is an explicit required choice, never silently defaulted (payment_failed example). Prototype modal updated.
10. B: no silent notify→rollback default flip; sticky to last-used + visible callout when the default changes.
11. B: handle save-time 403 with honest copy anyway (race on last slot); explicit grace-zone copy ("using your 2 grace rollouts").
12. B: autogen suggestion section renders only when autogen metrics exist for the project AND pass RG validation (runtime check), plus the G3 launch-gate verification.
13. C: integration status is project-level; v1 claims scoped to project, per-env detection specced as new backend work.
14. C: min-version table is a launch dependency; awaiting state gets a troubleshooting path (">1 day? check SDK version >= X").
15. C: connected moment also delivered via email/Courier to the member who opted in; listening state flips to troubleshooting after 7 days.
16. C: the shared snippet source snippet variants = own workstream; v1 fallback = static appended block per language, no live diff.
17. A: sidebar re-entry v1 = "1 draft" link only; readiness computation stays on the design page.

Minors: 18 exclude example/templated experiments from the 0-experiments gate; 19 dismissals per member, server-persisted; 20 show env next to each event in D's drawer, warn on non-prod; 21 condition all forward-pointing copy on entitlement state; 22 template rule name + actual split in the Start dialog; 23 "Pause ramp" cut (the ramp pauses itself; user actions are roll back / keep serving / dismiss); 24 gate regression "watch a session" on the sessions killswitch; 25 define all B metrics on state=available/consumed fires only.

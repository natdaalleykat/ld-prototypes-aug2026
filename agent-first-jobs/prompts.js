// Prompts for the agent-jobs prototype.
// Round 3: revised after two rounds of read-only dry runs against two real repos
// (one large app that already uses LaunchDarkly, one Next.js app that does not).
// PROMPTS[job](withKeys) returns the text that "Copy prompt" puts on the clipboard.
const PROMPTS = (() => {
  const OPEN = `You're setting up LaunchDarkly in this repo for me.`;

  const RULES = `Ground rules:
- Step 1 is read-only. Show me what you found before you change anything, and keep that report short enough to read in a minute.
- If this repo already uses LaunchDarkly, reuse its client, key setup, flag conventions and LaunchDarkly project. Skip the SDK install, the keys and the links below, and tell me which project it points at.
- Where this repo's own rules (CLAUDE.md, AGENTS.md, contributing docs) conflict with mine, follow the repo and tell me.
- If I have uncommitted changes other than lockfiles, list them and ask whether to carry them onto the new branch. Never commit.
- When you ask me to choose, name your default so I can just say "go".
- If nothing is worth doing, say what you checked and stop. Don't make a change just to have something to show.`;

  const SDK = `Install the LaunchDarkly SDK for this stack and initialize it once. Tell me which context key you evaluate against. On serverless, flush events before the handler returns.`;

  const KEYS = (k) => k ?
`Keys for LaunchDarkly project "default", environment "Production". Store the one you need the way this repo already stores secrets. If there is no convention, use a .env file that git ignores. If .env is tracked by git, stop and ask me. Never print the key, and tell me which variable to add where the app is deployed.
   Server-side SDK key (code that runs on a server): sdk-EXAMPLE-0000-0000-000000000000
   Client-side ID (browser code):                    6901e2f4a1b2c3d4e5f60718
   Mobile key (mobile apps):                         mob-EXAMPLE-0000-0000-000000000000` :
`Ask me for the LaunchDarkly key you need: the server-side SDK key for code that runs on a server, the client-side ID for browser code, or the mobile key. Store it the way this repo already stores secrets. If there is no convention, use a .env file that git ignores. If .env is tracked by git, stop and ask me. Never print the key, and tell me which variable to add where the app is deployed.`;

  const LINK = (tpl) =>
`You don't need LaunchDarkly API access. Give me this link with the values filled in so I can create the flag in one click, then wait until I say it exists. If browser or mobile code reads the flag, remind me to turn on client-side SDK availability when I create it.
   https://app.launchdarkly.com/projects/default/flags/new?template=${tpl}&flagKey=<flag key>&description=<one line, URL-encoded>`;

  const RUN = `Once the flag exists, trigger the wrapped code once in the lightest way you can (a test, a short script, or one request) so LaunchDarkly records an evaluation, and tell me what it returned. If that needs a heavy local setup, give me the one command to run instead.`;

  const FLAGLINK = `https://app.launchdarkly.com/projects/default/flags/<flag key>/targeting`;

  return {
kill: (k) => `${OPEN}

Job: put a kill switch on the riskiest code path in this app.

${RULES}

1. Find the code paths most likely to cause an incident. Start with calls to third-party services (payments, email or SMS, auth, LLM and other APIs, queues), then anything risky that changed recently. Show me the top 3, ranked by how much breaks for users if it fails. For each: file and line, what breaks, and whether a timeout, fallback or flag already protects it. Ask me which one to guard.
2. After I choose, work on a new branch. ${SDK} Wrap it in a boolean flag named kill-switch-<what it guards>, for example kill-switch-stripe-checkout. true means the code runs and false skips it. The code fallback is true, so nothing changes until I turn it off. When it is off, degrade sensibly instead of throwing.
3. ${KEYS(k)}
4. ${LINK('kill-switch')}
5. ${RUN}
6. Finish with a short note I can paste to my team: the 3 candidates and why, what is now behind the kill switch and what users see when it is off, the branch name, and the flag link ${FLAGLINK}.`,

dark: (k) => `${OPEN}

Job: put my work in progress behind a release flag so it can merge without being released.

${RULES}

1. First decide whether there is unreleased work here that adds behavior. Read git status, my uncommitted changes, and the commits on this branch that are not on the default branch. If the two can't be compared, use the uncommitted changes and say so.
   - If there is: show me where the new behavior enters the code (up to 3 places, file and line, one sentence each) and which one you would wrap. Ask me to confirm.
   - If the work only removes or refactors, is already behind a flag, or nothing is in progress: say so, and don't add a flag to code that has already shipped. Ask me what I'm about to build next, so you can set up its flag and guard before I write it.
2. After I answer, work on a branch. ${SDK} Wrap the new code path in a boolean flag named release-<feature>. The code fallback is false, so the old behavior runs until I turn the flag on.
3. ${KEYS(k)}
4. ${LINK('release')}
5. ${RUN}
6. Finish with a short note I can paste to my team: what is behind the flag, how to turn it on for one person first and then roll it out by percentage, the branch name, and the flag link ${FLAGLINK}.`,

flags: (k) => `${OPEN}

Job: find the feature toggles this codebase already has and move the first one to LaunchDarkly.

${RULES}

1. Find anything that turns product behavior on or off: env-var toggles (ENABLE_, FEATURE_, USE_, DISABLE_, or any variable whose presence enables a feature), boolean config, homegrown flag helpers, hardcoded allowlists, other flag SDKs, and hardcoded features I would need a redeploy to turn off. Show me a count by type and the list with file and line. Put infrastructure, test-only, security and dead config in one line at the end, and don't recommend them. Recommend one to move first: prefer one that is read in several places or that someone has had to redeploy to change. If none qualifies, recommend moving nothing. Ask me to confirm.
2. After I confirm, work on a new branch. ${SDK} Replace the reads of that one toggle with a boolean flag named after it in kebab case, for example ENABLE_NEW_CHECKOUT becomes enable-new-checkout. The code fallback is the toggle's current value, so nothing changes until I flip the flag.
3. ${KEYS(k)}
4. ${LINK('release')}
5. ${RUN}
6. Finish with a short note I can paste to my team: the inventory, what moved, the branch name, the flag link ${FLAGLINK}, and a suggested order for the rest. If I want the rest moved in bulk, tell me my options, but don't require any extra setup now.`,

tune: (k) => `${OPEN}

Job: make one hardcoded production setting adjustable from LaunchDarkly.

${RULES}

1. Find hardcoded values that teams end up tuning in production: timeouts, retry counts, rate limits, batch and page sizes, thresholds, promo or plan settings, and model names or parameters. Skip anything that already changes without a deploy. If a value is only displayed and the real one lives in another system (a price in a payment provider, for example), say so and don't recommend it on its own. Show me the top 3: file and line, current value, and why it is worth making adjustable. Prefer values that have changed before in git history or that already vary by customer or plan. Ask me which one.
2. After I choose, work on a new branch. ${SDK} Read the value from a number or string flag named config-<setting>, with the unit in the name (for example config-checkout-timeout-ms). The code fallback is today's hardcoded value, so nothing changes until I edit the flag. Clamp or validate the value so a bad edit can't break the app.
3. ${KEYS(k)}
4. ${LINK('custom')}
   Also tell me the flag type to pick and the two values to enter: today's value and one alternative.
5. ${RUN}
6. Finish with a short note I can paste to my team: the 3 candidates, what is now adjustable and its safe range, the branch name, and the flag link ${FLAGLINK}.`,

basic: (k) => `${OPEN}

Job: install the LaunchDarkly SDK and prove one flag evaluates.

${RULES}

1. Detect the stack. Tell me which SDK you will install and where you will initialize it. Ask me to confirm.
2. After I confirm, work on a new branch. ${SDK} Gate one harmless line (a startup log is fine) behind a boolean flag named test-flag with code fallback false.
3. ${KEYS(k)}
4. ${LINK('custom')}
5. ${RUN}`
  };
})();
if (typeof module !== 'undefined') module.exports = PROMPTS;

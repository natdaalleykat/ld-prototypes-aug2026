// Prompts for the agent-jobs prototype. Round 2: revised after read-only dry runs.
// PROMPTS[job](withKeys) returns the text that "Copy prompt" puts on the clipboard.
const PROMPTS = (() => {
  const OPEN = `You're setting up LaunchDarkly in this repo for me. You do all of the work here. LaunchDarkly has no access to my code.`;

  const RULES = `Ground rules:
- Step 1 is read-only. Show me what you found before you change anything.
- If this repo already uses LaunchDarkly, reuse its client, key setup and flag conventions. Skip the SDK install and the keys below, and tell me which LaunchDarkly project it points at.
- Where this repo's own rules (CLAUDE.md, AGENTS.md, contributing docs) conflict with mine, follow the repo and tell me.
- If I have uncommitted changes, tell me before you create a branch. Never commit.
- If nothing is worth doing, say what you checked and stop. Don't make a change just to have something to show.`;

  const KEYS = (k) => k ?
`Keys for LaunchDarkly project "default", environment "Production". Use the one that matches this app and store it the way this repo already stores secrets. If there is no convention, use a .env file that git ignores. If .env is tracked by git, stop and ask me. Never print the key.
   Server-side SDK key: sdk-EXAMPLE-0000-0000-000000000000
   Client-side ID:      6901e2f4a1b2c3d4e5f60718
   Mobile key:          mob-EXAMPLE-0000-0000-000000000000` :
`Ask me for the LaunchDarkly key this app needs (server-side SDK key, client-side ID, or mobile key). Store it the way this repo already stores secrets. If there is no convention, use a .env file that git ignores. If .env is tracked by git, stop and ask me. Never print the key.`;

  const LINK = (tpl) =>
`You don't need LaunchDarkly API access. Give me this link with the values filled in so I can create the flag in one click, then wait until I say it exists:
   https://app.launchdarkly.com/projects/default/flags/new?template=${tpl}&flagKey=<flag key>&description=<one line, URL-encoded>`;

  const RUN = `Once the flag exists, trigger the wrapped code once in the lightest way you can (a test, a short script, or one request) so LaunchDarkly records an evaluation, and tell me what it returned. If that needs a heavy local setup, give me the one command to run instead.`;

  const FLAGLINK = `https://app.launchdarkly.com/projects/default/flags/<flag key>/targeting`;

  return {
kill: (k) => `${OPEN}

Job: put a kill switch on the riskiest outside dependency in this app.

${RULES}

1. Find calls to third-party services: payments, email or SMS, auth, LLM and other APIs, queues. Show me the top 3, ranked by how much breaks for users if the service fails. For each: file and line, what breaks, and whether a timeout, fallback or flag already protects it. Prefer ones with no protection today. Ask me which one to guard.
2. After I choose, work on a new branch. Install the LaunchDarkly SDK for this stack. Wrap the call in a boolean flag named kill-switch-<dependency>. true means the call runs and false skips it. The code fallback is true, so nothing changes until I turn it off. When it is off, degrade sensibly instead of throwing.
3. ${KEYS(k)}
4. ${LINK('kill-switch')}
5. ${RUN}
6. Finish with a short note I can paste to my team: the 3 candidates and why, what is now behind the kill switch and what users see when it is off, the branch name, and the flag link ${FLAGLINK}.`,

dark: (k) => `${OPEN}

Job: put my work in progress behind a release flag so it can merge without being released.

${RULES}

1. Read git status, my uncommitted changes, and the commits on this branch that are not on the default branch. If the two can't be compared (shallow clone, no shared history), use the uncommitted changes and say so. If nothing is in progress, use the most recent feature commit. Show me where the new behavior enters the code: up to 3 places, file and line, one sentence each, and which one you would wrap. If the work removes or refactors something rather than adding behavior, or it is already behind a flag, say so and recommend no new flag. Ask me to confirm.
2. After I confirm, work on a branch. Install the LaunchDarkly SDK for this stack. Wrap the new code path in a boolean flag named release-<feature>. The code fallback is false, so the old behavior runs until I turn the flag on.
3. ${KEYS(k)}
4. ${LINK('release')}
5. ${RUN}
6. Finish with a short note I can paste to my team: what is behind the flag, how to turn it on for one person first and then roll it out by percentage, the branch name, and the flag link ${FLAGLINK}.`,

flags: (k) => `${OPEN}

Job: find the feature toggles this codebase already has and move the first one to LaunchDarkly.

${RULES}

1. Find env-var toggles (ENABLE_, FEATURE_, USE_, DISABLE_ and similar), boolean config entries, homegrown flag helpers, hardcoded allowlists, and calls to any other feature flag SDK. Count only toggles that change product behavior. Put infrastructure, test-only, security and dead config in one line at the end, and don't recommend them. Show me a count by type and the list with file and line. Recommend one to move first: prefer one that is read in several places or that someone has had to redeploy to change. If none qualifies, recommend moving nothing. Ask me to confirm.
2. After I confirm, work on a new branch. Install the LaunchDarkly SDK for this stack. Replace the reads of that one toggle with a boolean flag of the same name in kebab case. The code fallback is the toggle's current value, so nothing changes until I flip the flag.
3. ${KEYS(k)}
4. ${LINK('release')}
5. ${RUN}
6. Finish with a short note I can paste to my team: the inventory, what moved, the branch name, the flag link ${FLAGLINK}, and a suggested order for the rest. If I want the rest moved in bulk, tell me my options, but don't require any extra setup now.`,

tune: (k) => `${OPEN}

Job: make one hardcoded production setting adjustable from LaunchDarkly.

${RULES}

1. Find hardcoded values that teams end up tuning in production: timeouts, retry counts, rate limits, batch and page sizes, thresholds, prices or plan limits, and model names or parameters. Skip anything already read from config that changes without a deploy. Show me the top 3: file and line, current value, and why it is worth making adjustable. Prefer values that have changed before in git history or that already have a per-customer exception. Ask me which one.
2. After I choose, work on a new branch. Install the LaunchDarkly SDK for this stack. Read the value from a number or string flag named config-<setting>. The code fallback is today's hardcoded value, so nothing changes until I edit the flag. Clamp or validate the value so a bad edit can't break the app.
3. ${KEYS(k)}
4. ${LINK('custom')}
   Also tell me the flag type to pick and the two values to enter: today's value and one alternative.
5. ${RUN}
6. Finish with a short note I can paste to my team: the 3 candidates, what is now adjustable and its safe range, the branch name, and the flag link ${FLAGLINK}.`,

basic: (k) => `${OPEN}

Job: install the LaunchDarkly SDK and prove one flag evaluates.

${RULES}

1. Detect the stack. Tell me which SDK you will install and where you will initialize it. Ask me to confirm.
2. After I confirm, work on a new branch. Install and initialize the SDK. Gate one harmless line (a startup log is fine) behind a boolean flag named test-flag with code fallback false.
3. ${KEYS(k)}
4. ${LINK('custom')}
5. ${RUN}`
  };
})();
if (typeof module !== 'undefined') module.exports = PROMPTS;

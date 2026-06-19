---
name: creating-agent-skills
description: |
  Reference guide for authoring, structuring, naming, evaluating, and shipping
  Agent Skills (SKILL.md folders). Use this whenever the user asks to "create a
  skill", "turn this workflow into a skill", "write a SKILL.md", "fix/review a
  skill that isn't triggering", "build a skills library", or "package this
  knowledge for an agent". Also consult before letting an agent draft a skill
  from its own successful trajectory (meta-skill / self-improving-skill flows).
  Do NOT use this for general MCP server setup, prompt-engineering unrelated to
  skills, or one-off system-prompt edits that aren't meant to be reusable.
version: 1.0.0
license: MIT
---

# Creating Agent Skills

Condensed operating manual for the open `agentskills.io` standard. Source:
Google, *Agent Skills* whitepaper (May 2026). Use this as the checklist and
style guide any time you author, review, or evaluate a Skill.

## One-line mental model

> System prompt = instinct. AGENTS.md = project README. Tools/MCP = hands.
> RAG = library. **Skills = the runbook an experienced colleague hands you on
> day one, and that the agent never forgets.**

A Skill is *know-how* (how to do a kind of work). An MCP server is *reach*
(access to an external system). They compose — a Skill's steps typically call
MCP tools. Don't reinvent MCP as a script, and don't put global, always-true
project conventions in a Skill — that belongs in `AGENTS.md`.

---

## 1. Anatomy & progressive disclosure

```
skill_name/
├── SKILL.md      # Required: YAML frontmatter + markdown instructions
├── scripts/      # Optional: deterministic code (parsing, math, formatting)
├── references/   # Optional: supplementary docs loaded only when needed
└── assets/       # Optional: templates, schemas, files used in output
```

Skills load in three levels — this is the whole point of the format:

1. **Metadata** (`name` + `description`) — always in context (~30–80 tokens).
2. **SKILL.md body** — loaded only when the description matches the task.
3. **Bundled resources** — loaded strictly on demand; scripts execute without
   ever entering the token window.

A hundred installed skills cost only ~100 × 50 tokens of always-on metadata.
Never put something in the SKILL.md body that only matters once in a while —
push it to `references/`.

**Rule of thumb:** if the body is climbing past ~500 lines (hard ceiling
~5,000 words), the next paragraph almost certainly belongs in `references/`,
or the skill is actually two skills.

---

## 2. Naming

- Directory: `snake_case` (e.g. `bigquery_ingestion`)
- Skill name: `kebab-case`, prefer the **gerund form** (`managing-databases`,
  `processing-pdfs` — not `pdf-processor`)
- Avoid generic names: `utils`, `tools`, `helper`, `data`
- Avoid vendor prefixes (`claude-*`, `gemini-*`) and internal jargon outsiders
  won't recognize

---

## 3. The description field — this is the routing algorithm

It is the **only** thing the model sees when deciding whether to load the
skill. Spend more time here than on the rest of the file.

- State **what it does** AND **when to use it**
- Front-load trigger keywords ("Generate a commit message…", not "This skill
  helps with…")
- Explicitly state **what it is NOT for** (anti-triggers) to stop over-firing
- Be a little **pushy** — models tend to under-trigger skills. Prefer "Make
  sure to use this whenever the user mentions X, Y, or Z, even if they don't
  say the word 'skill'" over a flat description
- Keep it ~50 words / ≤200 chars for API use, ≤1024 chars in YAML
- Must survive rephrasing: write 3 positive and 3 negative trigger phrases as
  a sanity check before finalizing

```yaml
---
name: cafe-preparation
description: |
  Calculates daily ingredient needs and generates prep sheets for cafe
  operations. Use when the user asks to estimate daily quantities, convert
  drinks to ingredients, or generate shopping lists.
  Do NOT use for employee shift scheduling or financial accounting.
---
```

---

## 4. The minimal SKILL.md template

```markdown
---
name: skill-name
description: |
  [What it does in one verb-led sentence.] Use this skill when the user
  [trigger phrase 1], [trigger phrase 2], or [trigger phrase 3].
  Do NOT use for [anti-trigger 1] or [anti-trigger 2].
version: 1.0.0
license: MIT
allowed-tools: [Optional] Read Bash Write
metadata:
  author: [Optional] your-handle
---

# Skill Name

## When to use
- [Concrete scenario]
- [Concrete scenario]

## When NOT to use
- [Out-of-scope scenario]

## Workflow
1. [Step]
2. [Step]
3. See `references/advanced.md` for [edge case].

## Examples
- Input: "..." → Output: "..."

## Output format
- Use `assets/template.md` etc.

## Anti-patterns to avoid
- Don't [...]
```

---

## 5. Two paths to a first draft

- **Path A — translate what you already know.** A subject-matter expert has
  a runbook, onboarding guide, or compliance doc. Translate it into the
  template above; no coding required.
- **Path B — crystallize what the agent just did.** The agent completed a
  non-trivial, repeatable task. Capture the successful trace into a draft
  SKILL.md and have a human review it (meta-skill / self-improving pattern).
  **An un-reviewed agent-drafted skill is often worse than no skill at all** —
  always land it in the draft tier first (see §7).

---

## 6. The five rules

1. **One skill, one job.** If the description needs "and" between unrelated
   capabilities, split it.
2. **Descriptions are an interface.** A vague description = an unused skill.
3. **Skills are dependencies.** Version them, pin them, review them in PRs. A
   skill without a test is a hope, not a capability.
4. **The right team owns the right skill.** Domain experts own domain skills;
   don't let a platform team bottleneck the org's knowledge.
5. **The runtime is interchangeable.** Don't tie a skill to one model or one
   coding agent — portability is part of the value.

## Quality principles

1. **Run the task yourself first.** Real failure produces signal; speculation
   produces noise.
2. **Give the reason, not just the rule.** Models generalize to edge cases
   when they understand *why*. If you're typing "ALWAYS" / "NEVER" in caps,
   stop and explain the rationale instead — capitalized imperatives get
   ignored once the skill is co-loaded with others ("Context Debt").
3. **Every line should earn its place.** Keep gotchas, exact commands,
   business logic, anti-patterns. Cut boilerplate the model already knows.
4. **Make instructions verifiable.** If the agent can't tell whether it
   followed a rule, the rule is too vague.
5. **Bundle what repeats.** Helper code the agent keeps re-deriving belongs
   in `scripts/`, not in prose.
6. **Shift intelligence left.** Push deterministic logic into testable
   scripts instead of hoping the LLM interprets a wall of rules correctly at
   runtime.

---

## 7. Tiered authority (graduate skills, don't trust them on day one)

| Tier | Capability | Required before promotion |
|---|---|---|
| **Read-Only** | Fetch/query/describe data; no state mutation | LLM-as-judge eval; ~90% trigger accuracy |
| **Draft-Only** | Produces content for human review; can't send/commit | Golden dataset of 20+ cases; human approval |
| **Action-Allowed** | Executes irreversible operations | Full adversarial red-teaming; sustained pass across multiple repeated runs (not one lucky pass); zero rollback events |

Anything an agent (not a human) drafts — including meta-skill output — enters
at **Draft-Only** regardless of how confident the generator is.

---

## 8. Do's and Don'ts

**Do:**
- Start small and concrete; build the library one workflow at a time
- Spend disproportionate time on the description field
- Trust progressive disclosure — don't pre-load everything "just in case"
- Bundle deterministic work in `scripts/`, not as prose instructions
- Treat Skills as code: tests, versioning, PR review
- Remember: Skills **+** MCPs, not Skills **vs.** MCPs

**Don't:**
- Write vague descriptions like "helps with documents"
- Let a SKILL.md body exceed ~5,000 words — move detail to `references/`
- Hard-code paths or secrets
- Embed "always do X" global rules that belong in `AGENTS.md` instead
- Install untrusted third-party skills without auditing them first (a skill
  is code that runs in your context — treat it like any other dependency)
- Reinvent MCP as a bundled script
- Point an agent at an empty folder and ask it to generate fifty skills on
  day one — that's how you get a bad library, fast

---

## 9. Skill smells (revise if you see these)

- **Over 5,000 words** → probably two skills, or undisclosed reference material
- **Two domain teams could plausibly own it** → not yet decomposed; split along team lines
- **You can't write three test cases for it** → description is too vague
- **It references nothing else** → might just be a long instruction that belongs in the system prompt / AGENTS.md
- **You keep adding "edge case" sections** → each edge case probably wants its own skill
- **Description starts with "a helpful skill for…"** → rewrite to name the trigger, inputs, and output explicitly

---

## 10. Eval coverage checklist

A skill is "evaluated" only when **all four** are satisfied — failing any one
holds it at the draft tier regardless of happy-path performance:

- [ ] **Trigger** — positive AND negative test cases; target ~90% trigger accuracy
- [ ] **Execution** — correct output/tool-calls across representative inputs
- [ ] **Regression** — adding this skill causes zero drops elsewhere in the library
- [ ] **Token budget** — co-loaded with 5–15 other frequently-active skills, it
      doesn't degrade unrelated turns (never evaluate a skill in isolation only —
      isolation is a trap; production performance routinely drops 20–30% vs.
      offline pass@1 numbers)

Useful evaluation patterns, roughly in order of effort:
1. **Eval-as-unit-test** — 2–3 JSON cases (`input`, `expected_tools`,
   `expected_output`, `rubric`) run in CI on every change.
2. **Golden dataset** — 20+ curated (input → expected) pairs committed with
   the skill.
3. **LLM-as-judge** — score outputs against a rubric at scale; swap reference
   positions to kill ordering bias; calibrate to ~90% agreement with humans.
4. **Adversarial/red-team** — one rephrasing + one negative boundary case per
   positive trigger.
5. **Canary/shadow mode** — small % of live traffic before full rollout,
   required before any Action-Allowed release.

Example minimal eval case:

```json
{
  "case_id": "refund_dup_charge_001",
  "input": "I was charged twice for order #4521 last Tuesday",
  "expected_skill": "refund_processor",
  "expected_tool_calls": [
    {"tool": "lookup_order", "args": {"order_id": "4521"}},
    {"tool": "check_duplicate_charge", "args": {"order_id": "4521"}}
  ],
  "expected_output_format": "confirmation_with_refund_id",
  "rubric": ["acknowledges duplicate", "cites order id", "provides next step"]
}
```

For trajectory checks, match the strictness to the tier: read-only skills can
use an unordered-subset match; action-allowed skills need exact or in-order
matching, since a "right answer via the wrong sequence of tool calls" is
invisible to output-only scoring but can cause real side effects.

---

## 11. Deployment checklist

- [ ] Frontmatter validates (lint passes)
- [ ] Description includes what + when + when-not
- [ ] Scripts have unit tests passing in CI
- [ ] Eval suite passes in CI with a min-pass threshold
- [ ] Security scan clean (no secrets, no untrusted deps)
- [ ] Description reviewed by someone other than the author
- [ ] Cross-tool install paths tested if shipping publicly
- [ ] Org-level admin provisioning updated (if applicable)

---

## 12. Composition notes (for multi-skill systems)

- **State, not prose, between skills.** Pass structured pointers (file paths,
  IDs) between steps, not raw LLM text reasoning — don't use the context
  window as a message bus.
- **Capability profiles.** When many skills would otherwise all load at
  once, group them into swappable bundles (active skills + tool access +
  instructions) scoped to an execution state, rather than activating
  everything simultaneously.
- **Single-agent-with-skills beats multi-agent by default** when the use case
  is one general-purpose agent flexing into many specialist roles (e.g. 100
  process variants in a single domain). Multi-agent is still the right call
  for genuine parallelism, real capability/security boundaries, or
  heterogeneous models — Skills don't replace that.

---

## 13. Trusting third-party skills

| Source | Default stance |
|---|---|
| First-party vendor skills (built by the team that owns the underlying product) | Trust by default; pin a version |
| Org-curated skills (your own domain teams, PR-reviewed) | Trust within the org; review on adoption |
| Community skills (marketplaces, individual repos) | Audit before adopting; pin aggressively |

---

## 14. Where to start tomorrow

1. Sit with the most experienced practitioner for an hour; have them narrate
   3 workflows they do regularly. Record it — the transcript is almost
   literally the first draft of 3 skills.
2. Pick the most repeated workflow. Run it yourself with no skill loaded;
   note exactly where it fails.
3. Draft a SKILL.md from the transcript. Write 3 eval cases (2 positive, 1
   negative) **before** writing the body.
4. Ship to the Read-Only tier. Iterate the description until trigger accuracy
   clears ~90% in production-like conditions.
5. Repeat, one workflow at a time. Resist generating a large batch of skills
   in one shot.

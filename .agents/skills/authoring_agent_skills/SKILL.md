---
name: authoring-agent-skills
description: |
  Authors, reviews, structures, and creates reusable Agent Skills (SKILL.md folders) conforming to the open agentskills.io standard. Use this when the user asks to create a skill, turn a workflow into a skill, package knowledge for an agent, or draft/refactor a skill from successful runs.
  Do NOT use for general MCP server setup, system-prompt config edits, or environment setup.
version: 1.0.0
license: MIT
---

# Authoring Agent Skills

## When to use
- Authoring a new reusable skill in the project (under `.agents/skills/`).
- Translating a human runbook or trajectory into a reusable agent skill.
- Reviewing or updating an existing skill to improve trigger accuracy or execution quality.

## When NOT to use
- Writing general project rules (use `AGENTS.md` instead).
- Setting up third-party libraries, CLI tools, or MCP servers.

## Anatomy of a Skill
A skill folder must be located under `.agents/skills/<directory_name>/` (where `<directory_name>` is `snake_case`) and must contain at least a `SKILL.md` file:
```
.agents/skills/skill_directory/
├── SKILL.md      # Required: YAML frontmatter + markdown instructions
├── scripts/      # Optional: helper scripts/code
├── references/   # Optional: supplemental documentation (under 500 lines)
└── assets/       # Optional: templates, assets, schemas
```

## Workflow for Creating a Skill
1. **Define Name & Directory**:
   - Directory: Use `snake_case` (e.g. `mocking_auth_and_store_testing`).
   - Skill name in YAML: Use `kebab-case`, gerund form (e.g. `mocking-auth-and-store-testing`).
2. **Draft the Description**:
   - The description must be verb-led, clear, and specify triggers ("Use this when...") and anti-triggers ("Do NOT use for..."). Keep it under 1024 characters in YAML.
3. **Write the Body**:
   - Follow the template below. Keep the instructions concrete, actionable, and explanation-first (give the *why* instead of just the *what*). Keep the body under 500 lines.
4. **Register or Verify**:
   - Ensure the skill is discovered. (Skills in `.agents/skills/` are automatically discovered).
   - Verify trigger accuracy and check for potential regressions or token bloat.

## SKILL.md Template
```markdown
---
name: skill-name-in-kebab-case
description: |
  [Verb-led sentence describing capability]. Use this skill when the user [trigger 1], [trigger 2], or [trigger 3].
  Do NOT use for [anti-trigger 1] or [anti-trigger 2].
version: 1.0.0
license: MIT
---

# Skill Name in Title Case

## When to use
- [Scenario A]
- [Scenario B]

## When NOT to use
- [Anti-scenario A]

## Workflow
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Examples
- Input: "..."
  Output: "..."
```

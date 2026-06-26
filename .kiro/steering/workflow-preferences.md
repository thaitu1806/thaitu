# Workflow Preferences

## Steering Maintenance

Keep the steering files in `.kiro/steering/` aligned with reality. Whenever a change is made that future sessions need to know about, update the appropriate steering file in the same turn — without being asked.

Triggers that warrant a steering update:

- New infrastructure or tooling added (build system, native platform, test framework, deploy target, MCP server, etc.).
- Architectural changes that affect how features fit together (new top-level directory, new shared library, new data flow).
- Renamed or removed conventions, scripts, or commands documented in steering.
- Discovery that an existing steering claim is incorrect (e.g., a referenced tool is not actually used, a stated fact is stale).

Rules:

- Prefer updating an existing file over creating a new one when the topic fits.
- Create a new steering file only when the topic is large enough to deserve its own page and does not fit cleanly elsewhere.
- Keep entries terse and factual. Steering is loaded into every conversation, so brevity matters.
- Do not log per-feature implementation details in steering — those belong in spec files under `.kiro/specs/`.

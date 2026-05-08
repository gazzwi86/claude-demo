# `.claude/commands/` — slash commands

Each `.md` file here registers a slash command. Frontmatter declares the
arguments; the body is the prompt Claude follows when the command is
invoked.

## Available commands

| Command | What it does |
|---|---|
| `/add-endpoint <api\|web> <resource>` | Scaffolds a Fastify route (or Next.js route handler) + a zod schema in `@looper/shared` + a Vitest test. |
| `/anatomy [refresh \| lint] [files...]` | Regenerates the per-area wiki under `docs/wiki/`. `lint` checks for stale markers. |
| `/check-health` | Boots `apps/api`, polls `/health`, reports the JSON, kills the server. Used as a connectivity smoke. |
| `/open-pr` | Cleans the working tree, runs the security checker, pushes, opens a PR with `/review` queued. |
| `/setup [graphify]` | Wires git hooks, chmods scripts, configures the Stop-hook local LLM. With `graphify`: also installs the knowledge graph indexer. |

## How to add one

1. Create `.claude/commands/<name>.md` with frontmatter:
   ```yaml
   ---
   description: One-line summary shown in the slash-command picker.
   arguments:
     - name: <arg>
       description: <what it is>
       required: true
   ---
   ```
2. Body: the literal prompt Claude follows. Reference `$ARGUMENTS.<arg>` to interpolate.
3. Test it: `/<name> <args>`.

## Conventions

- Body should be a numbered list of steps when there's a clear sequence.
- Reference *files by path* and *commands by exact invocation* — Claude executes literally.
- Keep commands narrow. If a command does five things, that's five commands.

---
name: generate-docs
description: Analyses a codebase and generates comprehensive documentation — README, architecture diagrams, module docs, API reference — as a pull request. Trigger phrases: "generate documentation", "create docs", "document this codebase", "add a README", "write architecture docs".
---

# Generate Docs

The generate-docs skill analyses a repository and produces structured documentation
using the Diataxis framework, then opens a PR with the generated content. It is
adaptive — it only generates sections the codebase actually needs.

See the full reference implementation at [gazzwi86/ai-docs](https://github.com/gazzwi86/ai-docs/tree/935d71c).

## Phases

The skill runs in this order. Each phase produces one or more files that are committed
separately so reviewers can step through the generated documentation:

1. **Assess** — map the repository structure; detect stack, framework, CI/CD, IaC, auth
2. **README** — product-centric entry point (title + description, C4 context diagram, quick start, usage, configuration, docs index)
3. **Architecture** — C4 container diagram, sequence diagrams for key flows, technology stack table
4. **Modules** — per-package or per-service documentation based on the detected structure
5. **Reference** — API docs (link to OpenAPI spec rather than duplicating), CLI reference, configuration options
6. **Secret scan** — re-scan all generated output for credentials before writing any file
7. **Open PR** — create a PR with all generated files; each phase is a separate commit

## Diataxis structure

Organise all documentation using Diataxis categories plus domain-specific sections:

| Category | Directory | Purpose |
|----------|-----------|---------|
| Tutorials | `docs/getting-started/` | Learning-oriented, hand-holding |
| How-to guides | `docs/guides/` | Task-oriented, assumes knowledge |
| Reference | `docs/reference/` | Complete, accurate, no narrative |
| Explanation | `docs/explanation/` | Concepts, trade-offs, decisions |
| App docs | `docs/app/` | Module-level: purpose, API, usage |
| Infrastructure | `docs/infrastructure/` | C4 diagrams, resource inventory |
| DevSecOps | `docs/devsecops/` | Auth model, data flows, controls |
| DevOps | `docs/devops/` | CI/CD pipeline, deployment, runbooks |

Never mix categories — a tutorial that drifts into reference material fails at both.

## Adaptive generation

Only generate sections when the codebase signals they are needed:

| Signal | Generated section |
|--------|------------------|
| `terraform/`, `cdk/`, `pulumi/` | `docs/infrastructure/` with C4 diagrams |
| `Dockerfile`, `docker-compose.yml` | Container architecture in infrastructure docs |
| `.github/workflows/`, `.gitlab-ci.yml` | `docs/devops/ci-cd-pipeline.md` |
| Auth modules, middleware | `docs/devsecops/` |
| Database schemas, migrations | `docs/explanation/data-model.md` with ERD |
| `openapi.yaml`, `swagger.json` | Reference and link to spec (do not duplicate) |

## Diagram standards

Every concept that can be diagrammed should be diagrammed. All diagrams use Mermaid:

- **C4 Context** — system and its external actors (every README gets this)
- **C4 Container** — services, databases, frontends within the system
- **ERD** — for data models
- **Sequence** — for key service interactions
- **Flowchart** — for pipeline stages and business processes

Maximum 10–12 nodes per diagram. Split into focused diagrams if larger. Every Mermaid
diagram must be syntactically valid.

## Secret handling imperative

Never include secrets, API keys, tokens, passwords, or connection strings in any
generated output. Replace with `<PLACEHOLDER>` or a descriptive label. For `.env`
files: document variable names only, never values. Re-scan all output for credential
patterns (`AKIA`, `ghp_`, `sk-`, `BEGIN PRIVATE KEY`, `mongodb+srv://`) before
writing any file.

## API documentation rule

For repositories with OpenAPI/Swagger or AsyncAPI specs: reference and link to the
spec file. Do not duplicate the full API surface. Provide 2–3 annotated examples for
the most common endpoints and link: "For the complete API reference, see `<spec_path>`."

## Evaluation criteria

- The skill must run a secret scan on its output before writing any file.
- Every README must include a C4 context diagram.
- The skill must not generate `docs/infrastructure/` unless IaC is detected.
- Generated files must not contain `{{PLACEHOLDER}}` tokens or fabricated behaviour.
- All Mermaid diagrams must render without syntax errors.
- The skill must open a PR at the end, not just write files to disk.

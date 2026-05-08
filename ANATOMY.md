# Repository Anatomy

_Last full refresh: 2026-05-08T14:00:00Z_

## File tree

```
apps/
├── web/
│   ├── middleware.ts
│   ├── app/
│   │   ├── (auth)/login/page.tsx
│   │   ├── (auth)/signup/page.tsx
│   │   ├── (app)/studio/page.tsx
│   │   ├── (app)/dashboard/page.tsx
│   │   ├── (app)/account/page.tsx
│   │   ├── page.tsx                    # home / landing
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── studio/
│   │   │   ├── TransportBar.tsx
│   │   │   ├── PadGrid.tsx
│   │   │   ├── Pad.tsx
│   │   │   ├── EffectsRack.tsx
│   │   │   ├── LoopRecorder.tsx
│   │   │   ├── LibraryDrawer.tsx
│   │   │   └── Meter.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Slider.tsx
│   │       └── TextField.tsx
│   ├── lib/audio/
│   │   ├── engine.ts
│   │   ├── effects.ts
│   │   ├── padNode.ts
│   │   ├── recorder.ts
│   │   ├── buffers.ts
│   │   ├── synth.ts
│   │   └── impulseResponse.ts
│   ├── hooks/
│   │   ├── useAudioEngine.ts
│   │   ├── usePad.ts
│   │   └── useRecorder.ts
│   ├── lib/
│   │   ├── api-client.ts
│   │   └── auth-client.ts
│   └── e2e/
│       ├── auth-pages.spec.ts
│       ├── auth-live.spec.ts
│       ├── studio.spec.ts
│       ├── visual-tour.spec.ts
│       └── _screenshots.mjs
│
└── api/
    └── src/
        ├── routes/
        │   ├── auth.ts
        │   ├── loops.ts
        │   ├── sessions.ts
        │   └── health.ts
        ├── services/
        │   ├── authService.ts
        │   ├── loopService.ts
        │   └── s3Service.ts
        ├── db/
        │   ├── storage.ts
        │   ├── users.ts
        │   ├── loops.ts
        │   └── sessions.ts
        ├── middleware/
        │   ├── authGuard.ts
        │   └── errorHandler.ts
        ├── server.ts
        └── tests/
            ├── setup.ts
            ├── auth.test.ts
            └── loops.test.ts

packages/
└── shared/
    └── src/
        ├── schemas.ts
        ├── types.ts
        ├── constants.ts
        ├── index.ts
        └── schemas.test.ts

infra/
├── terraform/
│   ├── main.tf
│   ├── providers.tf
│   ├── variables.tf
│   ├── outputs.tf
│   └── modules/
│       ├── s3-loops/
│       ├── dynamodb/
│       ├── iam/
│       └── cloudfront/
└── docker/
    ├── docker-compose.yml
    └── init/seed.sh
```

## Areas

| Area | Wiki page | Files |
|---|---|---|
| Web Audio engine | [web-audio](docs/wiki/web-audio.md) | 7 files |
| Web studio components | [web-studio](docs/wiki/web-studio.md) | 7 files |
| Web UI primitives | [web-ui](docs/wiki/web-ui.md) | 3 files |
| Web hooks | [web-hooks](docs/wiki/web-hooks.md) | 3 files |
| Web lib (API clients) | [web-lib](docs/wiki/web-lib.md) | 2 files |
| Web pages | [web-pages](docs/wiki/web-pages.md) | 9 files |
| Web E2E tests | [web-e2e](docs/wiki/web-e2e.md) | 5 files |
| API routes | [api-routes](docs/wiki/api-routes.md) | 4 files |
| API services | [api-services](docs/wiki/api-services.md) | 3 files |
| API database layer | [api-db](docs/wiki/api-db.md) | 4 files |
| API middleware | [api-middleware](docs/wiki/api-middleware.md) | 2 files |
| API tests | [api-tests](docs/wiki/api-tests.md) | 3 files |
| Shared package | [shared](docs/wiki/shared.md) | 5 files |
| Infra — Terraform | [infra-terraform](docs/wiki/infra-terraform.md) | 10 files |
| Infra — Docker | [infra-docker](docs/wiki/infra-docker.md) | 2 files |

## Stale entries

_(none — full refresh completed 2026-05-08T14:00:00Z)_

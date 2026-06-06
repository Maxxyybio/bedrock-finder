# Contributing to Bedrock Finder

Thank you for contributing. Here's what you need to know.

---

## Branch strategy

```
main      — stable, always deployable
dev       — integration branch for features
feat/*    — individual feature branches
fix/*     — bug fixes
```

Never commit directly to `main`. Open a PR against `dev`.

## Commit messages

Follow Conventional Commits:

```
feat: add screenshot upload for pattern extraction
fix: correct Java LCG seed mixing for negative coordinates
docs: add algorithm writeup for bedrock generation
test: add edge-case tests for grid scoring
chore: bump vitest to 1.0
```

## Pull requests

- One concern per PR
- All tests must pass (`npm test`)
- Include a short description of *why*, not just *what*
- Link the relevant issue if one exists

## Running locally

```bash
npm install
npm run dev
```

## Adding support for a new edition / version

1. Add the generation function in `shared/src/bedrock.ts`
2. Export it via `isBedrockAt` dispatch
3. Add the y-level range in `shared/src/bedrock.ts` and update the UI in `ConfigPanel.tsx`
4. Write tests in `backend/src/tests/bedrock.test.ts`

## File structure rules

- **shared/** — pure functions only. No framework deps, no I/O.
- **backend/** — Express routes stay thin; logic lives in `services/`.
- **frontend/** — Components only do rendering. Data logic goes in `hooks/`.

## Code style

- TypeScript strict mode throughout
- `prettier` for formatting — run `npm run format` before committing
- No `any` unless absolutely necessary and commented
- No barrel exports (`index.ts` re-exports) — import directly

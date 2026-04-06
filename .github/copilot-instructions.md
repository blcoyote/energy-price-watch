# Energy Prices — Project Guidelines

## Stack

- **Framework**: React 19 with TypeScript (strict mode)
- **Build**: Vite 8 with React Compiler (`babel-plugin-react-compiler`)
- **Data fetching**: TanStack Query v5 (`@tanstack/react-query`)
- **Visualisation**: Recharts (`recharts`)
- **Package manager**: pnpm

## Architecture: Vertical Slices

All feature code lives under `src/features/<slice-name>/`. Each slice is self-contained and owns its own API layer, components, types, and public barrel export. Cross-slice sharing goes in `src/shared/`.

```
src/
  features/
    electricity-prices/
      api/          # TanStack Query hooks (use*.ts)
      components/   # React components and charts
      types/        # TypeScript interfaces / zod schemas
      index.ts      # Public re-exports only
    gas-prices/
      ...
  shared/
    api/            # Base fetch client, error types
    components/     # Truly generic UI (Spinner, ErrorBoundary)
    hooks/          # Non-feature hooks
    types/          # Shared domain types (e.g. EnergyUnit)
  App.tsx
  main.tsx
```

Never import directly from another slice's internals — always go through its `index.ts`.

## Code Style

- Use named exports everywhere; no default exports except route components.
- Prefer `type` over `interface` for object shapes that won't be extended.
- Co-locate test files next to source: `MyComponent.test.tsx`.
- Max 1 componenent pr file, but feel free to export multiple related utility functions from the same file. 
- Group related components in folders rather than in files if it improves readability.
- Use path aliases: `@features/*`, `@shared/*` (configure in `tsconfig.app.json` and `vite.config.ts`).

## Build & Test

```bash
pnpm install          # install dependencies
pnpm dev              # start dev server
pnpm build            # type-check + build
pnpm lint             # eslint
```

## Conventions That Differ From Defaults

- React Compiler is enabled — do **not** add manual `useMemo`/`useCallback` wrappers unless performance profiling proves it necessary.
- All server state is managed by TanStack Query; never put remote data in `useState`.
- Chart components receive pre-shaped data via props; data transformation logic lives in the `api/` layer or a `utils.ts` file within the slice.

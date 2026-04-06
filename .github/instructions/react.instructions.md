---
description: "Use when writing React components, hooks, or any React-specific code. Covers component structure, state management, event handling, and React 19 / React Compiler conventions for this project."
applyTo: "src/**/*.{tsx,ts}"
---

# React Patterns

## React Compiler

This project uses `babel-plugin-react-compiler` (React 19). The compiler automatically memoises components, values, and callbacks.

- **Do not** add `useMemo`, `useCallback`, or `memo` manually unless a profiler trace proves it is necessary.
- The compiler only optimises components and hooks that follow the Rules of Hooks. Keep hooks call-site clean.

## Component Rules

- One component per file.
- Group related components in a sub-folder with an `index.ts` barrel rather than stacking them in one file.
- Use named exports everywhere. Default exports are only allowed for route-level page components.
- Prefer `type` over `interface` for prop shapes.

```tsx
// ✅ correct
export type PriceCardProps = {
  price: number
  unit: string
}

export function PriceCard({ price, unit }: PriceCardProps) {
  return <div>{price} {unit}</div>
}
```

## State

| What                  | Where                          |
|-----------------------|--------------------------------|
| Remote / server data  | TanStack Query — never `useState` |
| Derived values        | Inline or `useMemo` (compiler handles it) |
| UI-only transient state | `useState` |
| Cross-component state | Lift to nearest common parent; avoid context for simple cases |

## Event Handlers

Prefer inline arrow functions for simple handlers. Named handler functions only when the logic is non-trivial or reused:

```tsx
// simple — inline is fine
<button onClick={() => setOpen(false)}>Close</button>

// non-trivial — extract
function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
  // ...
}
<form onSubmit={handleSubmit}>
```

## Effects

- Use `useEffect` for synchronising with external systems (DOM APIs, subscriptions, timers).
- Do **not** use `useEffect` to derive state from props — compute it inline instead.
- Always return a cleanup function when the effect registers a listener or starts a timer.

```tsx
useEffect(() => {
  const controller = new AbortController()
  // ...
  return () => controller.abort()
}, [dependency])
```

## Refs

Use `useRef` for values that must persist across renders without triggering a re-render (e.g. previous values, DOM node references, flags):

```tsx
const wrapperRef = useRef<HTMLDivElement>(null)
```

## Custom Hooks

- One hook per file, named `use<Thing>.ts`.
- Place feature-specific hooks directly in the slice root (`src/features/<slice>/`).
- Place generic hooks in `src/shared/hooks/`.
- A hook must not return JSX — if you need both logic and markup, split into a hook + component.

## TypeScript

- Enable strict mode (already configured in `tsconfig.app.json`).
- Prefer explicit return types on exported functions and hooks.
- Use `as const` for static lookup objects instead of enums.

```ts
// ✅ prefer
const PRICE_AREA_LABELS = {
  DK1: 'DK Vest',
  DK2: 'DK Øst',
} as const
```

## Accessibility

- Every interactive element must have an accessible label (`aria-label`, `aria-labelledby`, or visible text).
- Use semantic HTML: `<button>` for actions, `<a>` for navigation, `<label>` to associate form controls.
- Do not rely on colour alone to convey meaning — pair with text or iconography.

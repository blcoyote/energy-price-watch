---
description: "Use when writing data fetching hooks, query functions, API calls, or any server state management with TanStack Query. Covers query keys, query functions, mutations, and error handling patterns."
applyTo: "src/features/**/api/**"
---

# TanStack Query Patterns

## Setup

Wrap the app with `QueryClientProvider` in `main.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes — sensible default for price data
      retry: 2,
    },
  },
})
```

## Query Key Conventions

- Define query keys as `const` objects at the top of the `api/` file.
- Use hierarchical arrays: `[scope, entity, ...params]`.

```ts
// src/features/electricity-prices/api/queryKeys.ts
export const electricityPriceKeys = {
  all: ['electricity-prices'] as const,
  lists: () => [...electricityPriceKeys.all, 'list'] as const,
  list: (params: PriceQueryParams) => [...electricityPriceKeys.lists(), params] as const,
  detail: (id: string) => [...electricityPriceKeys.all, 'detail', id] as const,
}
```

## Query Hooks

One hook per resource, located in `src/features/<slice>/api/use<Resource>.ts`.

```ts
export function useElectricityPrices(params: PriceQueryParams) {
  return useQuery({
    queryKey: electricityPriceKeys.list(params),
    queryFn: () => fetchElectricityPrices(params),
  })
}
```

- Always destructure `{ data, isPending, isError, error }` at the call site — never use `status` strings.
- Never put the fetched data into `useState`. Return it directly from the hook.

## Mutation Hooks

```ts
export function useSubmitPriceAlert() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: AlertPayload) => postPriceAlert(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: electricityPriceKeys.lists() })
    },
  })
}
```

## Fetch Client

Keep raw `fetch` calls in a dedicated function, not inside hooks:

```ts
// src/features/electricity-prices/api/electricityPricesApi.ts
async function fetchElectricityPrices(params: PriceQueryParams): Promise<ElectricityPrice[]> {
  const url = new URL('/api/electricity-prices', import.meta.env.VITE_API_BASE_URL)
  url.searchParams.set('from', params.from)
  url.searchParams.set('to', params.to)

  const res = await fetch(url)
  if (!res.ok) throw new ApiError(res.status, await res.text())
  return res.json() as Promise<ElectricityPrice[]>
}
```

- Construct URLs using `URL` + `searchParams` — never string interpolation with user input.
- Throw a typed `ApiError` on non-2xx so TanStack Query can retry/display correctly.

## Error Handling

Define `ApiError` in `src/shared/api/errors.ts`:

```ts
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}
```

Render errors with the `isError` / `error` values from `useQuery` — wrap pages in an `<ErrorBoundary>` from `src/shared/components/`.

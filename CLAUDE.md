# CLAUDE.md

Guidance for AI assistants working in **ordering-components** — the shared logic layer for Ordering/Finitless customer apps.

**Repository:** [Finitless-com/ordering-components](https://github.com/Finitless-com/ordering-components) (formerly `OrderingPlus/components` / `OrderingX/components`)

**Consumed as a git submodule** at `src/@/components` in marketplace apps such as [website-marketplace-v26](https://github.com/Finitless-com/website-marketplace-v26). Changes here affect **every app** that embeds this submodule — keep them generic and backward-compatible.

## What this repo is

A **headless React layer**: controllers, React contexts, hooks, and the Ordering SDK. It contains **no marketplace-specific UI skin**. Each consumer app (e.g. website-marketplace-v26) provides styled `UIComponent` implementations in its own `src/ui` folder.

**Stack:** React (peer >=16; consumers use 18), functional components, React Hooks, ES modules. ESLint standard + react. **No styled-components** in this repo.

**Package manager for lint:** `yarn lint` (this repo's own scripts). Consumer apps use pnpm.

**No test suite.** Verify with `yarn lint` and integration testing in a consumer app.

## Directory layout

```
src/
├── components/              # Controllers (~100+) — one folder per feature
│   ├── Cart/
│   ├── Checkout/
│   ├── LoginForm/
│   └── OrdersDashboardComponents/   # Dashboard/admin UI — NOT used by marketplace SPA
├── contexts/                # Global state (18 providers)
├── hooks/                   # Shared hooks (useGoogleMaps, useCartStudent…)
├── sdk/
│   ├── src/                 # TypeScript SDK source — edit here
│   └── lib/                 # Compiled JS output — do not hand-edit
├── utils/                   # Pure helpers
├── constants/               # Shared constants (timezones, etc.)
├── webStrategy/             # localStorage adapter for web apps
└── index.js                 # Barrel re-export — consumers must NOT import this
```

## Controller pattern (mandatory)

Every feature component is a **controller** that:

1. Accepts `UIComponent` (required for rendering) plus domain props.
2. Uses contexts/hooks for state and API calls.
3. Returns **only** `<UIComponent {...computedProps} />` (or `null` while loading) — no layout markup of its own.

```js
import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useOrder } from '../../contexts/OrderContext'
import { useConfig } from '../../contexts/ConfigContext'

export const ExampleFeature = (props) => {
  const { UIComponent, someProp } = props
  const [orderState, { updateProduct }] = useOrder()
  const [stateConfig] = useConfig()
  const [localState, setLocalState] = useState(null)

  // …effects, handlers, derived values…

  return (
    <>
      {UIComponent && (
        <UIComponent
          {...props}
          orderState={orderState}
          configs={stateConfig.configs}
          localState={localState}
          handleAction={handleAction}
        />
      )}
    </>
  )
}

ExampleFeature.propTypes = {
  UIComponent: PropTypes.elementType,
  someProp: PropTypes.string
}
```

### Rules for controllers

- **Spread `{...props}` into UIComponent** so the skin receives both passed-through and computed props.
- **PropTypes on the controller**, documenting `UIComponent` and public props.
- **No JSX beyond the UIComponent render** — no `<div>`, no styled-components, no CSS imports.
- **No consumer-specific branching** (e.g. "if marketplace v26") — use props or config from `useConfig()`.
- Handlers passed to UI should be named `handle*` or `on*` consistently with existing controllers.

### How consumers wire controllers

In website-marketplace-v26 (`src/ui/src/components/ExampleFeature/index.js`):

```js
import { ExampleFeature as ExampleFeatureController } from '~components/components/ExampleFeature'

const ExampleFeatureUI = (props) => { /* styled JSX */ }

export const ExampleFeature = (props) => (
  <ExampleFeatureController {...props} UIComponent={ExampleFeatureUI} />
)
```

**Never** add presentation to the controller — the consumer's `UIComponent` owns all visual design.

## Contexts

All contexts live under `src/contexts/`. They are composed by `OrderingProvider` (`src/contexts/OrderingContext/index.js`).

| Context | Hook | Purpose |
|---------|------|---------|
| ApiContext | `useApi()` | Ordering SDK instance + setLanguage/setOrdering |
| SessionContext | `useSession()` | Auth, user, login/logout |
| OrderContext | `useOrder()` | Carts, order type, addresses, checkout state |
| ConfigContext | `useConfig()` | Project configs from API |
| LanguageContext | `useLanguage()` | `[state, t]` — translations dictionary + `t()` helper |
| EventContext | `useEvent()` | Analytics/event bus |
| UtilsContext | `useUtils()` | Formatting helpers (price, date, distance…) |
| ValidationsFieldsContext | `useValidationFields()` | Dynamic form validation rules |
| SiteContext | `useSite()` | Site metadata |
| CustomerContext | `useCustomer()` | Customer profile operations |
| BusinessContext | `useBusiness()` | Active business state |
| ToastContext | `useToast()` | Toast notifications |
| WebsocketContext | `useWebsocket()` | socket.io real-time |
| OrderingThemeContext | `useOrderingTheme()` | API-driven theme overrides |
| OptimizationLoadContext | — | First-load / optimize-load cache |
| ProductContext | — | Product detail scope |
| BillingContext | — | Billing (dashboard) |

**Provider tree order matters** — follow the nesting in `OrderingProvider` when adding new providers.

### webStrategy

`src/webStrategy/index.js` — `WebStrategy` class abstracting `localStorage`. Passed into providers that persist session/language/cart client-side. Other platforms (React Native) use different strategies in their consumer apps.

## Ordering SDK

- Import: `import { Ordering } from '../../sdk/lib/index'` (inside contexts) or via `useApi()`.
- Source of truth: `src/sdk/src/**/*.ts`. Compiled output in `src/sdk/lib/` and `src/sdk/lib-esm/`.
- **Edit TypeScript in `sdk/src/`**, then rebuild if the repo has a build step; do not patch `lib/` by hand unless you know the compile pipeline.
- Typical usage: `ordering.businesses().get()`, `ordering.orders(orderId).get()`, `ordering.translations().asDictionary().get()`.

ApiContext instantiates `new Ordering(settings)` from consumer `config.json` + worker overrides.

## i18n

- In controllers: `const [, t] = useLanguage()` then `t('LANG_KEY', 'English fallback')`.
- **Always provide a fallback string** — missing DB keys show the fallback.
- Placeholder tokens (`_attribute_`, `_from_`, `_to_`, `:amount:`) are replaced at runtime — preserve them verbatim.
- New keys added here may need export in consumer `i18n/generate.cjs` scans.

## Hooks (`src/hooks/`)

Shared logic extracted from controllers when reused across multiple components:

- `useGoogleMaps`, `useCartStudent`, `useSelectedStudent`, `useSchools`, `useSchoolStudents`

Add a hook when **two or more controllers** need the same logic. Keep one-off logic inside the controller.

## OrdersDashboardComponents

`src/components/OrdersDashboardComponents/` — controllers for the **admin/dashboard** app, not the customer marketplace SPA. They may contain more opinionated UI coupling. **Do not import these from marketplace apps** unless explicitly wiring a dashboard.

When fixing marketplace bugs, check you're editing the **customer** controller (e.g. `components/Cart/`), not a dashboard variant.

## Barrel export (`src/index.js`)

`src/index.js` re-exports every controller and context. **Consumer apps must never import from this barrel** — it pulls the entire SDK into the entry chunk (~3 MB regression). Consumers deep-import:

- `~components/components/Cart`
- `~components/contexts/OrderContext`

When adding a new export, add it to `index.js` for backward compatibility, but document deep-import paths for consumers.

## Adding a new controller — checklist

1. Create `src/components/NewFeature/index.js` following the controller pattern.
2. Add PropTypes including `UIComponent: PropTypes.elementType`.
3. Use existing contexts — don't create parallel state if `OrderContext`/`ConfigContext` already cover it.
4. Export from `src/index.js`.
5. In the consumer app, create `src/ui/src/components/NewFeature/index.js` + `styles.js` with the wired export.
6. Run `yarn lint` here; run `pnpm lint` + `pnpm build` in the consumer.

## Common LLM mistakes — avoid these

1. **Adding styled-components or CSS** — belongs in the consumer's `src/ui`.
2. **Importing from `src/index.js` barrel inside this repo's controllers** — use relative imports.
3. **Editing `sdk/lib/` instead of `sdk/src/`** — lib is generated.
4. **Marketplace-specific copy or layout in controllers** — pass data; let UIComponent render.
5. **Breaking UIComponent prop contracts** — adding/removing/renaming props breaks all consumer skins; deprecate gradually.
6. **Creating duplicate contexts** — extend existing ones.
7. **Using npm/pnpm in this repo** — lint script is `yarn lint`.
8. **Editing consumer repo files when tasked with submodule work** — and vice versa.
9. **Dashboard vs customer confusion** — verify the correct component folder.
10. **Forgetting `{...props}` spread** on UIComponent — skins lose passthrough props.

## Relationship to website-marketplace-v26

| Layer | Repo | Path |
|-------|------|------|
| Logic (this repo) | ordering-components | `src/@/components/src/` |
| Presentation | website-marketplace-v26 | `src/ui/` |
| Routes | website-marketplace-v26 | `src/pages/`, `src/App.js` |
| Worker/SEO | website-marketplace-v26 | `worker/` |

When working **inside the marketplace repo's submodule checkout**, treat edits as ordering-components PRs. The marketplace's `CLAUDE.md` forbids casual submodule edits — coordinate cross-repo changes explicitly.

## Conventions

- Functional components + hooks. ES modules.
- ESLint: `yarn lint` (`standard` + `plugin:react/recommended`).
- Relative imports within this repo (`../../contexts/OrderContext`).
- PropTypes on exported controllers.
- Branch naming in consumer apps: `feature/<LINEAR-ID>-<desc>`. Submodule follows its own repo workflow.

# Test batch registry — ordering-components (ORD-1084)

Living inventory for **incremental** test + coverage work. One batch ≈ one focused session (~8–12 controllers or one SDK/context domain). Do **not** try to test the whole repo in a single session.

## Coverage gate — interim vs final

| Stage | What 70% means |
|-------|----------------|
| **During batches (now)** | ≥70% average on whatever is currently in `vitest.config.js` `coverage.include` (**162 patterns** today). Keeps CI honest while surface grows. |
| **At issue completion (ship)** | ≥70% average with **all** testable units in `coverage.include` — every controller, context, SDK class, and hook from this registry (or explicitly `skipped`). |

**Ship criterion:** full inventory in gate + ≥70% on that full set. **Not acceptable:** 70% on a partial include only.

The CI gate uses a **scoped include** that grows batch-by-batch (same incremental technique as ORD-1080 dashboard). ORD-1084 must expand until **all ~210 units** are in gate before phase 3.5.

## Inventory (today vs target at ship)

| Surface | Total units | In gate today | Remaining |
|---------|-------------|---------------|-----------|
| `src/utils` + `constants` + `webStrategy` | ~10 | ~10 | — |
| `src/sdk/lib/models` | 22 | 22 | — |
| `src/sdk/lib/classes` | 28 | 10 | 18 |
| `src/contexts` (web) | 17 | 2 | 15 |
| `src/components` (marketplace, excl. dashboard) | ~118 | **118** | — |
| `src/components/OrdersDashboardComponents` | 27 | **27** | 0 |
| `src/hooks` | 5 | 0 | 5 (H1) |

**Gate today:** 162 path patterns ≈ **77%** of ship target. **Branches** (~60%) is the metric most likely to block the gate as large controllers are added.

## Rules per batch (every session)

1. Pick the **next pending batch** from the tables below.
2. Add tests under `ComponentName/__tests__/` (see `docs/CONTROLLER_TEST_MIGRATION_PLAN.md`).
3. **Expand `vitest.config.js` `coverage.include`** for every new file/folder in the batch.
4. Run: `yarn test && yarn lint:check && yarn test:coverage:summary` — gate must stay ≥70%.
5. Mark batch `done` here + update `docs/ci-coverage-plan.md` progress %.
6. Stop — do not spill into the next batch in the same session unless explicitly asked.

## Test file organization

Controller tests use **two layouts** (both valid):

| Layout | Example | When |
|--------|---------|------|
| **Per-component** (ideal long-term) | `LoginForm/__tests__/LoginForm.test.jsx` | Few controllers today (`OrderTypeControl`, `Analytics`, `Emitter`) |
| **Domain suite** (current bulk) | `authControllers.test.jsx` with nested `describe('LoginForm')` | ~145 controllers grouped by feature area under `src/components/__tests__/` |

**"Batch"** (7–19, D1–D4) was only an **internal planning label** for incremental coverage sessions — not a permanent file name. Test files are named by **domain** (`authControllers`, `dashboardOrdersControllers`, …). Inside each file, every controller has its own `describe('ComponentName')` block with dedicated tests.

Splitting domain suites into per-component files can happen incrementally later; coverage and behavior are unchanged by file name.

---

| Pattern | When | Helper |
|---------|------|--------|
| **Smoke** | Controller renders `UIComponent` with props | `renderController` |
| **Partial mock** | Controller uses 1–2 contexts | `vi.mock` + `importOriginal` |
| **SDK API** | URL building, validation throws | `createMockOrdering` |
| **Context** | Provider + hook behavior | RTL + mocked API |
| **Skip for now** | Heavy Stripe/Firebase/Maps iframe | Mock module; test branch only |

---

## Foundation batches (DONE)

| Batch | Scope | Tests | Gate avg (when isolated) | Status |
|-------|-------|-------|--------------------------|--------|
| **1** | `utils`, `constants`, `webStrategy` | 40 | ~96.7% | ✅ done |
| **2** | SDK core: `Model`, `Order`, `User`, `ApiBase`, `Ordering`, `ApiCart`, `Pagination`, `ApiResponse` | 27 | — | ✅ done |
| **3** | Contexts: `ToastContext`, `EventContext` | 4 | — | ✅ done |
| **4** | Controllers: `Emitter`, `OrderTypeControl`, `Analitycs` | 7 | — | ✅ done |
| **5** | SDK API: `ApiUser`, `ApiOrder`, `ApiConfig`, `ApiBusiness`, `ApiSystem` + 19 model smoke | 36 | — | ✅ done |
| **6** | Controllers: `BaseComponent`, `FloatingButton`, `ProductShare`, `SmartAppBanner` | 4 | — | ✅ done |

**Current combined gate (after Batch D4):** 670 tests, **70.30%** scoped average.

---

## SDK API classes — remaining (batch S7–S10)

| Batch | Classes to add to gate | Test file (planned) | Status |
|-------|------------------------|---------------------|--------|
| **S7** | `ApiTranslation`, `ApiLanguage`, `ApiPage`, `ApiCategory`, `ApiMenu` | `apiClassesS7.test.js` | pending |
| **S8** | `ApiAddress`, `ApiCity`, `ApiCountry`, `ApiProduct` | `apiClassesS8.test.js` | pending |
| **S9** | `ApiOrderMessage`, `ApiOrderOption`, `ApiBusinessProduct` | `apiClassesS9.test.js` | pending |
| **S10** | `ApiDriverLocations`, `ApiDriversGroups`, `ApiControls`, `ApiPaymentCards`, `ApiValidationField` | `apiClassesS10.test.js` | pending |

---

## Contexts — remaining (batch C7–C12)

| Batch | Contexts | Complexity | Status |
|-------|----------|------------|--------|
| **C7** | `LanguageContext`, `ConfigContext` | low | pending |
| **C8** | `SessionContext`, `ApiContext` | medium | pending |
| **C9** | `OrderingContext`, `OptimizationLoadContext` | medium | pending |
| **C10** | `OrderContext`, `ProductContext` | high | pending |
| **C11** | `BusinessContext`, `CustomerContext`, `ValidationsFieldsContext` | high | pending |
| **C12** | `UtilsContext`, `WebsocketContext`, `SiteContext`, `BillingContext`, `OrderingThemeContext` | very high | pending |

---

## Hooks (batch H1)

| Batch | Files | Status |
|-------|-------|--------|
| **H1** | `useGoogleMaps`, `useSchools`, `useSchoolStudents`, `useSelectedStudent`, `useCartStudent` | pending |

---

## Marketplace controllers — batch 7–24

~8–12 controllers per batch. Order is **dependency-light first** → auth → commerce → orders → integrations.

### Batch 7 — Pass-through & shell (low deps) ✅

| Controller | Notes | Status |
|------------|-------|--------|
| `ExamineClick` | event callback | ✅ done |
| `GpsButton` | mock `useGoogleMaps` + geolocation | ✅ done |
| `PageBanner` | mock contexts + fetch | ✅ done |
| `DragAndDrop` | callbacks | ✅ done |
| `LanguageSelector` | mock `useLanguage` | ✅ done |
| `LogoutAction` | mock session/API | ✅ done |
| `PlaceSpot` | mock contexts, `isInputMode` | ✅ done |
| `Popup` | portal smoke | ✅ done |
| `WebsocketStatus` | mock websocket context | ✅ done |
| `Contacts` | mock ordering chain | ✅ done |

**Tests:** `shellControllers.test.jsx` (11 tests). **Gate avg after batch:** ~70.8% (164 tests total).

**Next session:** **Batch 8** — auth forms.

### Batch 8 — Auth forms ✅

| Controller | Notes | Status |
|------------|-------|--------|
| `LoginForm` | API auth, level guard, custom handler | ✅ done |
| `SignupForm` | save API, custom handler, change input | ✅ done |
| `ForgotPasswordForm` | forgotPassword API, change input | ✅ done |
| `ResetPassword` | resetPassword API, change input | ✅ done |
| `LoginGuest` | checkout fields fetch | ✅ done |
| `Sessions` | list/delete/sort/error paths | ✅ done |
| `UserVerification` | email + phone verify flows | ✅ done |
| `QueryLoginSpoonity` | spoonity auth + error modal | ✅ done |

**Tests:** `authControllers.test.jsx` (31 tests). **Gate avg after batch:** ~70.0% (202 tests total).

**Next session:** **Batch 13** — product detail & options.

### Batch 9 — Social / OAuth login ✅

| Controller | Notes | Status |
|------------|-------|--------|
| `GoogleLoginButton` | gapi mock, signIn/signOut, authGoogle API | ✅ done |
| `FacebookLoginButton` | FB SDK mock, login/logout, authFacebook API | ✅ done |
| `AppleLogin` | AppleID mock, `/auth/apple` fetch | ✅ done |
| `FirebaseGoogleLoginButton` | firebase/auth mock, authGoogle API | ✅ done |
| `GoogleIdentity` | identity script, authGoogle API | ✅ done |
| `ReCaptcha` | v2/v3 widget mocks, onChange callback | ✅ done |

**Tests:** `socialAuthControllers.test.jsx` (18 tests). **Gate avg after batch:** ~70.6% (220 tests total).

**Next session:** **Batch 13** — product detail & options.

### Batch 10 — Address & phone ✅

| Controller | Notes | Status |
|------------|-------|--------|
| `AddressForm` | helpers, save/load, guest create, Mapbox suggest/retrieve, nearest business, delivery zones | ✅ done |
| `AddressList` | load, custom set-default, API set-default, delete | ✅ done |
| `AddressDetails` | business map URL fetch, props location shortcut | ✅ done |
| `PhoneAutocomplete` | handlers, user search, checkAddress | ✅ done |
| `GoogleAutocompleteInput` | place selection, country restriction | ✅ done |

**Tests:** `addressPhoneControllers.test.jsx` (20 tests). **Gate avg after batch:** ~70.3% (240 tests total).

**Next session:** **Batch 13** — product detail & options.

### Batch 11 — Business discovery ✅

| Controller | Notes | Status |
|------------|-------|--------|
| `BusinessList` | fetch/SDK paths, filters, favorites, franchise, pagination | ✅ done |
| `BusinessSearchList` | search, brands, filters, product updates | ✅ done |
| `BusinessController` | helpers, favorites, tracking, SDK update | ✅ done |
| `BusinessInformation` | gallery/location derivation, option toggle | ✅ done |
| `BusinessBasicInformation` | load by id, prop shortcut | ✅ done |
| `BusinessTypeFilter` | API types, custom types, selection | ✅ done |
| `BusinessSortControl` | order-type filter, sort change | ✅ done |
| `SingleBusinessCard` | pass-through | ✅ done |
| `BusinessesMap` | locations, click emit/custom | ✅ done |
| `LocationsMap` | map render, info window, forceCenter | ✅ done |

**Tests:** `businessDiscoveryControllers.test.jsx` (46 tests). **Gate avg after batch:** ~70.6% (286 tests total).

**Next session:** **Batch 13** — product detail & options.

### Batch 12 — Menu & product listing ✅

| Controller | Notes | Status |
|------------|-------|--------|
| `BusinessMenuListing` | loads menus via SDK | ✅ done |
| `BusinessProductsCategories` | API categories, featured flag, prop shortcut | ✅ done |
| `BusinessProductsSearch` | search handler pass-through | ✅ done |
| `ProductsList` | filters categories without id | ✅ done |
| `ProductsListing` | load/filter products and categories | ✅ done |
| `StoreProductList` | business load, category/product search, SDK updates | ✅ done |
| `BusinessAndProductList` | business load, filters, favorites, lazy load, store updates | ✅ done |
| `MenuControl` | schedule helpers, date selection, menu info | ✅ done |

**Tests:** `menuListingControllers.test.jsx` (27 tests). **Gate avg after batch:** ~70.4% (313 tests total).

**Next session:** **Batch 14** — cart & checkout.

### Batch 13 — Product detail & options ✅

| Controller | Notes | Status |
|------------|-------|--------|
| `ProductComponent` | `ProductProvider` wrapper, quantity/price, options, add/share/close | ✅ done |
| `ProductForm` | cart init, save, suboptions, lazy load, favorites, guest user, service pros | ✅ done |
| `ProductOption` | pass-through | ✅ done |
| `ProductOptionSuboption` | toggle, increment/decrement, pizza position/qty | ✅ done |
| `ProductIngredient` | toggle select | ✅ done |
| `ProductItemAccordion` | `productInfo` sort, cart product flatten | ✅ done |
| `SingleProductCard` | click tracking, favorites add/remove/error | ✅ done |
| `ReviewProduct` | form state, single + multi-business submit, API error | ✅ done |
| `ProductImages` | pass-through | ✅ done |

**Tests:** `productDetailControllers.test.jsx` (36 tests). **Gate avg after batch:** ~71.2% (349 tests total). Initial include dropped gate to ~69.8%; extra `ProductForm` branch tests recovered to ≥70%.

**Next session:** **Batch 14** — cart & checkout.


### Batch 14 — Cart & checkout ✅

| Controller | Notes | Status |
|------------|-------|--------|
| `Cart` | quantity, comments, offers, product max | ✅ done |
| `Checkout` | business load, paymethod, place order, delivery option | ✅ done |
| `MultiCheckout` | cart group load, paymethod, group place order | ✅ done |
| `MultiCartCreate` | single/multi cart redirect, cart group POST | ✅ done |
| `MultiCartsPaymethodsAndWallets` | prepare endpoint, user wallets, redemption rate | ✅ done |
| `CartStoresListing` | store fetch/search, cart store change | ✅ done |
| `CouponControl` | apply/remove coupon, advanced offers, negative price | ✅ done |
| `UpsellingPage` | filter upselling, suggestive API, form/remove offer | ✅ done |

**Tests:** `cartCheckoutControllers.test.jsx` (28 tests). **Gate avg after batch:** ~70.1% (377 tests total). `Checkout` (~751 lines) added at ~48% stmt coverage; gate held above 70% without extra recovery pass.

**Next session:** **Batch 16** — orders (customer).

### Batch 15 — Payment methods ✅

| Controller | Notes | Status |
|------------|-------|--------|
| `PaymentOptions` | parse/filter paymethods, selection, gift-card path | ✅ done |
| `PaymentOptionCash` | pass-through total | ✅ done |
| `PaymentOptionStripe` | cards, default card, braintree/izipay get_cards | ✅ done |
| `PaymentOptionStripeDirect` | credentials + requirements | ✅ done |
| `PaymentOptionStripeLink` | SMS link send | ✅ done |
| `PaymentOptionStripeRedirect` | modal name + stripe PK | ✅ done |
| `PaymentOptionPaypal` | SDK ready, place/confirm cart callbacks | ✅ done |
| `PaymentOptionSquare` | script load, method selection | ✅ done |
| `PaymentOptionWallet` | wallets, select/remove, redemption rate | ✅ done |
| `PaymethodList` | prop passthrough + API fetch | ✅ done |
| `StripeElementsForm` | requirements when `toSave` | ✅ done |
| `WalletList` | wallets, loyalty, transactions, levels | ✅ done |

**Tests:** `paymentControllers.test.jsx` (35 tests). **Gate avg after batch:** ~70.0% (412 tests total). Initial pass dipped to ~69.1% (`PaymentOptionStripe` ~45%, `PaymentOptionSquare` ~38%, `CardForm`/`StripeRedirectForm` at 0%); recovery pass added sub-component + branch tests to clear gate.

**Next session:** **Batch 16** — orders (customer).

### Batch 16 — Orders (customer) ✅

| Controller | Status |
|------------|--------|
| `OrderList` | done |
| `OrderListGroups` | done |
| `OrderDetails` | done |
| `OrderVerticalList` | done |
| `OrderChange` | done |
| `OrderReview` | done |
| `MyOrders` | done |
| `MyOrdersList` | done |
| `SingleOrderCard` | done |
| `NewOrderNotification` | done |
| `MultiOrdersDetails` | done |
| `OrdersControlFilters` | done |

**Tests:** `customerOrdersControllers.test.jsx` (69 tests). **Gate avg after batch:** ~70.5% (481 tests total). Initial pass landed at ~69.3% (`OrderListGroups` ~50% branches, `OrderDetails` ~46% branches); recovery pass added websocket, filter, logistic, force-update, and socket/event branch tests to clear gate.

**Next session:** **Batch 17** — driver, messages, map.

### Batch 17 — Driver, messages, map ✅

| Controller | Status |
|------------|--------|
| `DriverList` | done |
| `DriverTips` | done |
| `ReviewDriver` | done |
| `ReviewCustomer` | done |
| `Messages` | done |
| `MapView` | done |
| `GoogleMaps` | done |
| `MainSearch` | done |
| `SearchOptions` | done |

**Tests:** `driverMessagesMapControllers.test.jsx` (27 tests). **Gate avg after batch:** ~71.1% (508 tests total). `GoogleMaps` required `useGoogleMaps` + `window.google.maps` mocks; other controllers were straightforward API/socket/event coverage.

**Next session:** **Batch 18** — analytics, CMS, promos.

### Batch 18 — Analytics, CMS, promos ✅

| Controller | Status |
|------------|--------|
| `AnalyticsSegment` | done |
| `FacebookPixel` | done |
| `GoogleConversion` | done |
| `CmsContent` | done |
| `PromotionsController` | done |
| `BusinessReviews` | done |
| `BusinessReservation` | done |
| `FavoriteList` | done |
| `ProfessionalInfo` | done |
| `SingleProfessionalCard` | done |

**Tests:** `analyticsCmsControllers.test.jsx` (19 tests). **Gate avg after batch:** ~71.7% (527 tests total). Analytics/pixel/conversion controllers use event-handler coverage; `BusinessReservation` needed `dayjs/plugin/isSameOrAfter`.

### Batch 19 — User, project, misc (DONE)

| Controller | Notes | Status |
|------------|-------|--------|
| `ProjectForm` | project selection / API | done |
| `UserFormDetails` | user profile fields | done |
| `MomentOption` | schedule / moment picker | done |
| `GiftCard` | purchase, send, redeem, orders list (4 sub-controllers) | done |

**Tests:** `userProjectMiscControllers.test.jsx` (19 tests). **Gate avg after batch:** ~71.3% (546 tests total). `MomentOption.handleAsap` is a no-op when already ASAP — tests schedule first, then reset.

Closes **all** marketplace controllers outside `OrdersDashboardComponents`. **118/118** marketplace controllers in gate.

**Next session:** **S7** — SDK API classes (first SDK batch).

### Batch D4 — Dashboard logistics, appointments, reviews (DONE)

| Controllers | `Appointments`, `GoogleMapsApiKeySetting`, `LogisticInformation`, `Logistics`, `ReviewCustomer` (dashboard), `Schedule` |
| Tests | `dashboardLogisticsControllers.test.jsx` (19 tests) |
| Gate avg after batch | **70.30%** (670 tests). `Schedule` mutates `scheduleList` by reference — clone per test; `handleAddSchedule` needs separate `act()` calls. |

### Batch D3 — Dashboard business, geo, export (DONE)

| Controllers | `BusinessProductsListing`, `CityList`, `CountryList`, `ExportCSV`, `GiftCardsList`, `MetaFields`, `PointsWalletLevels` |
| Tests | `dashboardBusinessControllers.test.jsx` (19 tests) |
| Gate avg after batch | **70.05%** (651 tests). `BusinessProductsListing` receives `ordering` as a prop; avoid `{ id: null }` category selection (triggers unhandled `getProducts` rejection). |

### Batch D1 — Dashboard orders (DONE)

| Controller | Notes | Status |
|------------|-------|--------|
| `DashboardBusinessList` | business list + bulk actions | done |
| `DashboardOrdersList` | orders list + websocket | done |
| `OrdersManage` | orders manager shell | done |
| `OrdersFilter` | filter panel state | done |
| `OrderDetails` | dashboard order detail (not marketplace) | done |
| `CustomOrderDetails` | manual order builder | done |
| `OrderNotification` | websocket `order_added` | done |

**Tests:** `dashboardOrdersControllers.test.jsx` (36 tests). **Gate avg after batch:** ~70.3% (582 tests). Stable session/config mocks required to avoid `useEffect` loops; `OrdersManage` filter objects must include all array fields.

### Batch D2 — Dashboard users, drivers, messages (DONE)

| Controllers | `UsersList`, `UserFormDetails` (dashboard), `DriversList`, `Messages` (dashboard), `WebsocketStatus` (dashboard), `SettingsList`, `CheckPassword` |
| Tests | `dashboardUsersControllers.test.jsx` (50 tests) |
| Gate avg after batch | **70.01%** (632 tests). Initial pass dipped to **69%**; recovery pass added user CRUD, websocket, messages history, and settings checkbox branches. |

### Batch 20–23 — OrdersDashboardComponents (admin-only, 27 controllers)

Split 4 sessions; used by dashboard/admin flows, not marketplace SPA — still in shared repo.

| Batch | Controllers | Status |
|-------|-------------|--------|
| **D1** | `DashboardBusinessList`, `DashboardOrdersList`, `OrdersManage`, `OrdersFilter`, `OrderDetails`, `CustomOrderDetails`, `OrderNotification` | done |
| **D2** | `UsersList`, `UserFormDetails`, `DriversList`, `Messages`, `WebsocketStatus`, `SettingsList`, `CheckPassword` | done |
| **D3** | `BusinessProductsListing`, `CityList`, `CountryList`, `ExportCSV`, `GiftCardsList`, `MetaFields`, `PointsWalletLevels` | done |
| **D4** | `Appointments`, `GoogleMapsApiKeySetting`, `LogisticInformation`, `Logistics`, `ReviewCustomer`, `Schedule` | done |

---

## Suggested session order (priority)

Work top-to-bottom. **Next session = Batch S7** (SDK API classes). **All 27 dashboard controllers gated.**

```
Foundation 1–6 ✅ → Batch 7 ✅ → … → Batch 19 ✅ → D1–D4 ✅ → S7 → …
```

Contexts **C10–C12** are the hardest remaining — schedule after lighter batches.

---

## Completion criteria (ORD-1084 issue 100%)

Issue is **not** done when gate hits 70% on ~41 files. Done when **both**:

1. **Full surface in gate** — `vitest.config.js` `coverage.include` lists all testable units from this registry (or explicit `skipped` entries documented here)
2. **Full-surface 70%** — `yarn test:coverage:summary` and CI report ≥70% average on that **complete** include

Checklist:

- [x] Foundation batches 1–6
- [x] Marketplace controller batches 7–19 (118 controllers)
- [x] Dashboard batch D1 (7 controllers)
- [x] Dashboard batch D2 (7 controllers)
- [x] Dashboard batch D3 (7 controllers)
- [x] Dashboard batch D4 (6 controllers) — **dashboard controllers complete (27/27)**
- [ ] SDK batches S7–S10 (18 API classes)
- [ ] Context batches C7–C12 (15 contexts)
- [ ] Hooks batch H1 (5 hooks)
- [ ] Scoped include = full inventory (controllers + contexts + SDK + hooks)
- [ ] CI Quality Gate green at ≥70% on full include
- [ ] Branch protection enabled; merged to `main` + `production`

**Optional later:** `native/**` test track (Jest/RN or pure unit tests for `NativeStrategy`).

---

## Progress snapshot

| Metric | Value |
|--------|-------|
| Batches complete | **23 / ~34** (foundation 6 + marketplace 13 + dashboard 4) |
| Marketplace controllers in gate | **118 / 118** (100%) |
| Dashboard controllers in gate | **7 / 27** |
| Contexts in gate | **2 / 17** |
| SDK API classes in gate | **10 / 28** |
| SDK models in gate | **22 / 22** |
| Gated path patterns | **162** |
| Tests passing | **670** |
| Gate average | **70.30%** (branches **59.98%**) |
| Estimated issue progress | **~82%** |

## Test files (marketplace batches)

| Batch | File | Tests |
|-------|------|-------|
| 7 | `shellControllers.test.jsx` | 11 |
| 8 | `authControllers.test.jsx` | 31 |
| 9 | `socialAuthControllers.test.jsx` | 18 |
| 10 | `addressPhoneControllers.test.jsx` | 20 |
| 11 | `businessDiscoveryControllers.test.jsx` | 46 |
| 12 | `menuListingControllers.test.jsx` | 27 |
| 13 | `productDetailControllers.test.jsx` | 36 |
| 14 | `cartCheckoutControllers.test.jsx` | 28 |
| 15 | `paymentControllers.test.jsx` | 35 |
| 16 | `customerOrdersControllers.test.jsx` | 69 |
| 17 | `driverMessagesMapControllers.test.jsx` | 27 |
| 18 | `analyticsCmsControllers.test.jsx` | 19 |
| 19 | `userProjectMiscControllers.test.jsx` | 19 |
| D1 | `dashboardOrdersControllers.test.jsx` | 36 |
| D2 | `dashboardUsersControllers.test.jsx` | 50 |
| D3 | `dashboardBusinessControllers.test.jsx` | 19 |
| D4 | `dashboardLogisticsControllers.test.jsx` | 19 |

Plus foundation: per-component smoke tests (`BaseComponent`, `FloatingButton`, `ProductShare`, `SmartAppBanner`), SDK/context/utils tests, `harness.test.js`.

*Last updated: 2026-07-13 — Batch D4 complete; all dashboard controllers gated; S7 next.*

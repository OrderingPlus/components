# Controller test migration plan — per-component layout

**Goal:** Move from domain suite files (`authControllers.test.jsx`) to **one test file per controller**:

```
ComponentName/
  index.js
  __tests__/
    ComponentName.test.jsx
```

**Scope:** All marketplace + dashboard controllers already covered by ORD-1084 batches 7–19 and D1–D4, plus foundation batch 6 smoke.

**Out of scope for this plan:** SDK batches S7–S10, context batches C7–C12, hooks H1 (separate tracks; already use per-unit files).

---

## Rules (every migration step)

1. **One wave = one original batch** (see table below). Do not mix batches in a single PR/session unless explicitly asked.
2. For each controller in the wave:
   - Create `ComponentFolder/__tests__/ComponentName.test.jsx`
   - Move **all** `describe` + `it` blocks for that component (including tests from `recovery` sections)
   - Copy shared `vi.mock` / `beforeEach` only if that file needs them; prefer a thin per-file setup
3. After the wave: **delete** the emptied domain suite file (or leave a re-export shim only if needed — prefer delete).
4. Run after every wave:
   ```bash
   cd src/@/components
   yarn test && yarn lint:check && yarn test:coverage:summary
   ```
   Gate must stay **≥ 70%**.
5. Update the checklist table at the bottom of this doc (`pending` → `done`).

### Special cases

| Case | Action |
|------|--------|
| **Recovery blocks** (`recovery — deeper order coverage`, `D2 recovery — branch coverage`) | Split tests into the **component they exercise** — not a separate file |
| **Dashboard controllers** | Live under `OrdersDashboardComponents/<Name>/` — test path follows that folder |
| **Nested sub-controllers** | `GiftCard/*`, `StripeElementsForm/CardForm`, `PaymentOptionStripeRedirect/StripeRedirectForm` — each gets its own `__tests__` next to `index.js` |
| **Name collisions** | Marketplace vs dashboard share names (`Messages`, `WebsocketStatus`, `ReviewCustomer`, `OrderDetails`, `UserFormDetails`) — folder path disambiguates; test file name matches **folder** name |
| **Shared mocks** | If 8+ files duplicate the same 50-line mock block, extract to `src/__tests__/helpers/mocks/<domain>.js` in that wave only |

---

## Already migrated (skip)

| Batch | Controller | Current test path | Status |
|-------|------------|-------------------|--------|
| **4** | `Emitter` | `Emitter/__tests__/Emitter.test.js` | ✅ done |
| **4** | `OrderTypeControl` | `OrderTypeControl/__tests__/OrderTypeControl.test.jsx` | ✅ done |
| **4** | `Analitycs` | `Analitycs/__tests__/Analytics.test.jsx` | ✅ done |

---

## Migration waves (execution order)

Work **top to bottom**. Each row is one session/PR slice.

### Wave 0 — Foundation smoke (`controllersSmoke.test.jsx`)

| # | Controller | Target test path | Tests (approx) |
|---|------------|------------------|----------------|
| 0.1 | `BaseComponent` | `BaseComponent/__tests__/BaseComponent.test.jsx` | 1 |
| 0.2 | `FloatingButton` | `FloatingButton/__tests__/FloatingButton.test.jsx` | 1 |
| 0.3 | `ProductShare` | `ProductShare/__tests__/ProductShare.test.jsx` | 1 |
| 0.4 | `SmartAppBanner` | `SmartAppBanner/__tests__/SmartAppBanner.test.jsx` | 2 |

**Source file to remove:** `__tests__/controllersSmoke.test.jsx`  
**Controllers:** 4 | **Original batch:** 6

---

### Wave 1 — Batch 7 (shell)

**Source:** `__tests__/shellControllers.test.jsx` (~11 tests)

| # | Controller | Target test path |
|---|------------|------------------|
| 1.1 | `ExamineClick` | `ExamineClick/__tests__/ExamineClick.test.jsx` |
| 1.2 | `DragAndDrop` | `DragAndDrop/__tests__/DragAndDrop.test.jsx` |
| 1.3 | `Popup` | `Popup/__tests__/Popup.test.jsx` |
| 1.4 | `LanguageSelector` | `LanguageSelector/__tests__/LanguageSelector.test.jsx` |
| 1.5 | `WebsocketStatus` | `WebsocketStatus/__tests__/WebsocketStatus.test.jsx` |
| 1.6 | `LogoutAction` | `LogoutAction/__tests__/LogoutAction.test.jsx` |
| 1.7 | `GpsButton` | `GpsButton/__tests__/GpsButton.test.jsx` |
| 1.8 | `PageBanner` | `PageBanner/__tests__/PageBanner.test.jsx` |
| 1.9 | `PlaceSpot` | `PlaceSpot/__tests__/PlaceSpot.test.jsx` |
| 1.10 | `Contacts` | `Contacts/__tests__/Contacts.test.jsx` |

**Controllers:** 10

---

### Wave 2 — Batch 8 (auth)

**Source:** `__tests__/authControllers.test.jsx` (~31 tests)

| # | Controller | Target test path |
|---|------------|------------------|
| 2.1 | `LoginForm` | `LoginForm/__tests__/LoginForm.test.jsx` |
| 2.2 | `SignupForm` | `SignupForm/__tests__/SignupForm.test.jsx` |
| 2.3 | `ForgotPasswordForm` | `ForgotPasswordForm/__tests__/ForgotPasswordForm.test.jsx` |
| 2.4 | `ResetPassword` | `ResetPassword/__tests__/ResetPassword.test.jsx` |
| 2.5 | `LoginGuest` | `LoginGuest/__tests__/LoginGuest.test.jsx` |
| 2.6 | `Sessions` | `Sessions/__tests__/Sessions.test.jsx` |
| 2.7 | `UserVerification` | `UserVerification/__tests__/UserVerification.test.jsx` |
| 2.8 | `QueryLoginSpoonity` | `QueryLoginSpoonity/__tests__/QueryLoginSpoonity.test.jsx` |

**Controllers:** 8

---

### Wave 3 — Batch 9 (social / OAuth)

**Source:** `__tests__/socialAuthControllers.test.jsx` (~18 tests)

| # | Controller | Target test path |
|---|------------|------------------|
| 3.1 | `GoogleLoginButton` | `GoogleLoginButton/__tests__/GoogleLoginButton.test.jsx` |
| 3.2 | `FacebookLoginButton` | `FacebookLoginButton/__tests__/FacebookLoginButton.test.jsx` |
| 3.3 | `AppleLogin` | `AppleLogin/__tests__/AppleLogin.test.jsx` |
| 3.4 | `FirebaseGoogleLoginButton` | `FirebaseGoogleLoginButton/__tests__/FirebaseGoogleLoginButton.test.jsx` |
| 3.5 | `GoogleIdentityButton` | `GoogleIdentity/__tests__/GoogleIdentityButton.test.jsx` |
| 3.6 | `ReCaptcha` | `ReCaptcha/__tests__/ReCaptcha.test.jsx` |

**Controllers:** 6

---

### Wave 4 — Batch 10 (address & phone)

**Source:** `__tests__/addressPhoneControllers.test.jsx` (~20 tests)

| # | Controller | Target test path |
|---|------------|------------------|
| 4.1 | `AddressForm` | `AddressForm/__tests__/AddressForm.test.jsx` |
| 4.2 | `AddressList` | `AddressList/__tests__/AddressList.test.jsx` |
| 4.3 | `AddressDetails` | `AddressDetails/__tests__/AddressDetails.test.jsx` |
| 4.4 | `PhoneAutocomplete` | `PhoneAutocomplete/__tests__/PhoneAutocomplete.test.jsx` |
| 4.5 | `GoogleAutocompleteInput` | `GoogleAutocompleteInput/__tests__/GoogleAutocompleteInput.test.jsx` |

**Controllers:** 5

---

### Wave 5 — Batch 11 (business discovery)

**Source:** ~~`__tests__/businessDiscoveryControllers.test.jsx`~~ (deleted — split complete)

| # | Controller | Target test path |
|---|---|---|
| 5.1 | `BusinessList` | `BusinessList/__tests__/BusinessList.test.jsx` |
| 5.2 | `BusinessSearchList` | `BusinessSearchList/__tests__/BusinessSearchList.test.jsx` |
| 5.3 | `BusinessController` | `BusinessController/__tests__/BusinessController.test.jsx` |
| 5.4 | `BusinessInformation` | `BusinessInformation/__tests__/BusinessInformation.test.jsx` |
| 5.5 | `BusinessBasicInformation` | `BusinessBasicInformation/__tests__/BusinessBasicInformation.test.jsx` |
| 5.6 | `BusinessTypeFilter` | `BusinessTypeFilter/__tests__/BusinessTypeFilter.test.jsx` |
| 5.7 | `BusinessSortControl` | `BusinessSortControl/__tests__/BusinessSortControl.test.jsx` |
| 5.8 | `SingleBusinessCard` | `SingleBusinessCard/__tests__/SingleBusinessCard.test.jsx` |
| 5.9 | `BusinessesMap` | `BusinessesMap/__tests__/BusinessesMap.test.jsx` |
| 5.10 | `LocationsMap` | `LocationsMap/__tests__/LocationsMap.test.jsx` |

**Helper:** `src/__tests__/helpers/businessDiscoveryTestHelpers.js`

**Controllers:** 10 — ✅ done

---

### Wave 6 — Batch 12 (menu & listing)

**Source:** ~~`__tests__/menuListingControllers.test.jsx`~~ (deleted — split complete)

| # | Controller | Target test path |
|---|---|---|
| 6.1 | `BusinessMenuListing` | `BusinessMenuListing/__tests__/BusinessMenuListing.test.jsx` |
| 6.2 | `BusinessProductsCategories` | `BusinessProductsCategories/__tests__/BusinessProductsCategories.test.jsx` |
| 6.3 | `BusinessProductsSearch` | `BusinessProductsSearch/__tests__/BusinessProductsSearch.test.jsx` |
| 6.4 | `ProductsList` | `ProductsList/__tests__/ProductsList.test.jsx` |
| 6.5 | `ProductsListing` | `ProductsListing/__tests__/ProductsListing.test.jsx` |
| 6.6 | `StoreProductList` | `StoreProductList/__tests__/StoreProductList.test.jsx` |
| 6.7 | `BusinessAndProductList` | `BusinessAndProductList/__tests__/BusinessAndProductList.test.jsx` |
| 6.8 | `MenuControl` | `MenuControl/__tests__/MenuControl.test.jsx` |

**Helper:** `src/__tests__/helpers/menuListingTestHelpers.js`

**Controllers:** 8 — ✅ done

---

### Wave 7 — Batch 13 (product detail)

**Source:** ~~`__tests__/productDetailControllers.test.jsx`~~ (deleted — split complete)

| # | Controller | Target test path |
|---|---|---|
| 7.1 | `ProductComponent` | `ProductComponent/__tests__/ProductComponent.test.jsx` |
| 7.2 | `ProductForm` | `ProductForm/__tests__/ProductForm.test.jsx` |
| 7.3 | `ProductOption` | `ProductOption/__tests__/ProductOption.test.jsx` |
| 7.4 | `ProductOptionSuboption` | `ProductOptionSuboption/__tests__/ProductOptionSuboption.test.jsx` |
| 7.5 | `ProductIngredient` | `ProductIngredient/__tests__/ProductIngredient.test.jsx` |
| 7.6 | `ProductItemAccordion` | `ProductItemAccordion/__tests__/ProductItemAccordion.test.jsx` |
| 7.7 | `SingleProductCard` | `SingleProductCard/__tests__/SingleProductCard.test.jsx` |
| 7.8 | `ReviewProduct` | `ReviewProduct/__tests__/ReviewProduct.test.jsx` |
| 7.9 | `ProductImages` | `ProductImages/__tests__/ProductImages.test.jsx` |

**Helper:** `src/__tests__/helpers/productDetailTestHelpers.js`

**Controllers:** 9 — ✅ done

---

### Wave 8 — Batch 14 (cart & checkout)

**Source:** ~~`__tests__/cartCheckoutControllers.test.jsx`~~ (deleted — split complete)

| # | Controller | Target test path |
|---|---|---|
| 8.1 | `Cart` | `Cart/__tests__/Cart.test.jsx` |
| 8.2 | `MultiCartCreate` | `MultiCartCreate/__tests__/MultiCartCreate.test.jsx` |
| 8.3 | `CouponControl` | `CouponControl/__tests__/CouponControl.test.jsx` |
| 8.4 | `CartStoresListing` | `CartStoresListing/__tests__/CartStoresListing.test.jsx` |
| 8.5 | `UpsellingPage` | `UpsellingPage/__tests__/UpsellingPage.test.jsx` |
| 8.6 | `MultiCartsPaymethodsAndWallets` | `MultiCartsPaymethodsAndWallets/__tests__/MultiCartsPaymethodsAndWallets.test.jsx` |
| 8.7 | `Checkout` | `Checkout/__tests__/Checkout.test.jsx` |
| 8.8 | `MultiCheckout` | `MultiCheckout/__tests__/MultiCheckout.test.jsx` |

**Helper:** `src/__tests__/helpers/cartCheckoutTestHelpers.js`

**Controllers:** 8 — ✅ done

---

### Wave 9 — Batch 15 (payments)

**Source:** ~~`__tests__/paymentControllers.test.jsx`~~ (deleted — split complete)

| # | Controller | Target test path |
|---|---|---|
| 9.1 | `PaymentOptions` | `PaymentOptions/__tests__/PaymentOptions.test.jsx` |
| 9.2 | `PaymentOptionCash` | `PaymentOptionCash/__tests__/PaymentOptionCash.test.jsx` |
| 9.3 | `PaymentOptionStripe` | `PaymentOptionStripe/__tests__/PaymentOptionStripe.test.jsx` |
| 9.4 | `PaymentOptionStripeDirect` | `PaymentOptionStripeDirect/__tests__/PaymentOptionStripeDirect.test.jsx` |
| 9.5 | `PaymentOptionStripeLink` | `PaymentOptionStripeLink/__tests__/PaymentOptionStripeLink.test.jsx` |
| 9.6 | `PaymentOptionStripeRedirect` | `PaymentOptionStripeRedirect/__tests__/PaymentOptionStripeRedirect.test.jsx` |
| 9.7 | `PaymentOptionPaypal` | `PaymentOptionPaypal/__tests__/PaymentOptionPaypal.test.jsx` |
| 9.8 | `PaymentOptionSquare` | `PaymentOptionSquare/__tests__/PaymentOptionSquare.test.jsx` |
| 9.9 | `PaymentOptionWallet` | `PaymentOptionWallet/__tests__/PaymentOptionWallet.test.jsx` |
| 9.10 | `PaymethodList` | `PaymethodList/__tests__/PaymethodList.test.jsx` |
| 9.11 | `StripeElementsForm` | `StripeElementsForm/__tests__/StripeElementsForm.test.jsx` |
| 9.12 | `WalletList` | `WalletList/__tests__/WalletList.test.jsx` |
| 9.13 | `CardForm` | `StripeElementsForm/CardForm/__tests__/CardForm.test.jsx` |
| 9.14 | `StripeRedirectForm` | `PaymentOptionStripeRedirect/StripeRedirectForm/__tests__/StripeRedirectForm.test.jsx` |

**Helper:** `src/__tests__/helpers/paymentTestHelpers.js`

**Controllers:** 14 (12 top-level + 2 nested) — ✅ done

---

### Wave 10 — Batch 16 (customer orders) ⚠️ largest wave — ✅ done

**Source:** `__tests__/customerOrdersControllers.test.jsx` (~69 tests) — **removed**

**Helper:** `src/__tests__/helpers/customerOrdersTestHelpers.js`

| # | Controller | Target test path | Notes |
|---|------------|------------------|-------|
| 10.1 | `OrderChange` | `OrderChange/__tests__/OrderChange.test.jsx` | |
| 10.2 | `MyOrders` | `MyOrders/__tests__/MyOrders.test.jsx` | |
| 10.3 | `MyOrdersList` | `MyOrdersList/__tests__/MyOrdersList.test.jsx` | |
| 10.4 | `NewOrderNotification` | `NewOrderNotification/__tests__/NewOrderNotification.test.jsx` | |
| 10.5 | `OrdersControlFilters` | `OrdersControlFilters/__tests__/OrdersControlFilters.test.jsx` | |
| 10.6 | `MultiOrdersDetails` | `MultiOrdersDetails/__tests__/MultiOrdersDetails.test.jsx` | |
| 10.7 | `OrderReview` | `OrderReview/__tests__/OrderReview.test.jsx` | |
| 10.8 | `SingleOrderCard` | `SingleOrderCard/__tests__/SingleOrderCard.test.jsx` | |
| 10.9 | `OrderList` | `OrderList/__tests__/OrderList.test.jsx` | includes recovery tests |
| 10.10 | `OrderVerticalList` | `OrderVerticalList/__tests__/OrderVerticalList.test.jsx` | |
| 10.11 | `OrderListGroups` | `OrderListGroups/__tests__/OrderListGroups.test.jsx` | includes recovery tests |
| 10.12 | `OrderDetails` | `OrderDetails/__tests__/OrderDetails.test.jsx` | marketplace — includes recovery tests |

**Controllers:** 12  
**Note:** `recovery — deeper order coverage` block (~30+ tests) must be **split** into `OrderList`, `OrderListGroups`, `OrderDetails`, and any helper-only tests (e.g. `mergeAssignRequestOrders`) go with the component that exports/uses them.

---

### Wave 11 — Batch 17 (driver, messages, map) — ✅ done

**Source:** `__tests__/driverMessagesMapControllers.test.jsx` (~27 tests) — **removed**

**Helper:** `src/__tests__/helpers/driverMessagesMapTestHelpers.js`

| # | Controller | Target test path |
|---|------------|------------------|
| 11.1 | `DriverList` | `DriverList/__tests__/DriverList.test.jsx` |
| 11.2 | `DriverTips` | `DriverTips/__tests__/DriverTips.test.jsx` |
| 11.3 | `ReviewDriver` | `ReviewDriver/__tests__/ReviewDriver.test.jsx` |
| 11.4 | `ReviewCustomer` | `ReviewCustomer/__tests__/ReviewCustomer.test.jsx` |
| 11.5 | `Messages` | `Messages/__tests__/Messages.test.jsx` |
| 11.6 | `MapView` | `MapView/__tests__/MapView.test.jsx` |
| 11.7 | `MainSearch` | `MainSearch/__tests__/MainSearch.test.jsx` |
| 11.8 | `SearchOptions` | `SearchOptions/__tests__/SearchOptions.test.jsx` |
| 11.9 | `GoogleMaps` | `GoogleMaps/__tests__/GoogleMaps.test.jsx` |

**Controllers:** 9

---

### Wave 12 — Batch 18 (analytics, CMS, promos) — ✅ done

**Source:** `__tests__/analyticsCmsControllers.test.jsx` (~19 tests) — **removed**

**Helper:** `src/__tests__/helpers/analyticsCmsTestHelpers.js`

| # | Controller | Target test path |
|---|------------|------------------|
| 12.1 | `AnalyticsSegment` | `AnalyticsSegment/__tests__/AnalyticsSegment.test.jsx` |
| 12.2 | `FacebookPixel` | `FacebookPixel/__tests__/FacebookPixel.test.jsx` |
| 12.3 | `GoogleConversion` | `GoogleConversion/__tests__/GoogleConversion.test.jsx` |
| 12.4 | `CmsContent` | `CmsContent/__tests__/CmsContent.test.jsx` |
| 12.5 | `PromotionsController` | `PromotionsController/__tests__/PromotionsController.test.jsx` |
| 12.6 | `BusinessReviews` | `BusinessReviews/__tests__/BusinessReviews.test.jsx` |
| 12.7 | `BusinessReservation` | `BusinessReservation/__tests__/BusinessReservation.test.jsx` |
| 12.8 | `FavoriteList` | `FavoriteList/__tests__/FavoriteList.test.jsx` |
| 12.9 | `ProfessionalInfo` | `ProfessionalInfo/__tests__/ProfessionalInfo.test.jsx` |
| 12.10 | `SingleProfessionalCard` | `SingleProfessionalCard/__tests__/SingleProfessionalCard.test.jsx` |

**Controllers:** 10

---

### Wave 13 — Batch 19 (user, project, gift cards) — ✅ done

**Source:** `__tests__/userProjectMiscControllers.test.jsx` (~19 tests) — **removed**

**Helper:** `src/__tests__/helpers/userProjectMiscTestHelpers.js`

| # | Controller | Target test path |
|---|------------|------------------|
| 13.1 | `ProjectForm` | `ProjectForm/__tests__/ProjectForm.test.jsx` |
| 13.2 | `UserFormDetails` | `UserFormDetails/__tests__/UserFormDetails.test.jsx` |
| 13.3 | `MomentOption` | `MomentOption/__tests__/MomentOption.test.jsx` |
| 13.4 | `PurchaseGiftCard` | `GiftCard/PurchaseGiftCard/__tests__/PurchaseGiftCard.test.jsx` |
| 13.5 | `SendGiftCard` | `GiftCard/SendGiftCard/__tests__/SendGiftCard.test.jsx` |
| 13.6 | `RedeemGiftCard` | `GiftCard/RedeemGiftCard/__tests__/RedeemGiftCard.test.jsx` |
| 13.7 | `GiftCardOrdersList` | `GiftCard/GiftCardOrdersList/__tests__/GiftCardOrdersList.test.jsx` |

**Controllers:** 7

---

### Wave 14 — Batch D1 (dashboard orders)

**Source:** `__tests__/dashboardOrdersControllers.test.jsx` (~36 tests)

| # | Controller | Target test path |
|---|------------|------------------|
| 14.1 | `OrdersFilter` | `OrdersDashboardComponents/OrdersFilter/__tests__/OrdersFilter.test.jsx` |
| 14.2 | `OrderNotification` | `OrdersDashboardComponents/OrderNotification/__tests__/OrderNotification.test.jsx` |
| 14.3 | `DashboardBusinessList` | `OrdersDashboardComponents/DashboardBusinessList/__tests__/DashboardBusinessList.test.jsx` |
| 14.4 | `DashboardOrdersList` | `OrdersDashboardComponents/DashboardOrdersList/__tests__/DashboardOrdersList.test.jsx` |
| 14.5 | `OrdersManage` | `OrdersDashboardComponents/OrdersManage/__tests__/OrdersManage.test.jsx` |
| 14.6 | `OrderDetails` | `OrdersDashboardComponents/OrderDetails/__tests__/OrderDetails.test.jsx` |
| 14.7 | `CustomOrderDetails` | `OrdersDashboardComponents/CustomOrderDetails/__tests__/CustomOrderDetails.test.jsx` |

**Controllers:** 7

---

### Wave 15 — Batch D2 (dashboard users) ⚠️ recovery block

**Source:** `__tests__/dashboardUsersControllers.test.jsx` (~50 tests)

| # | Controller | Target test path | Notes |
|---|------------|------------------|-------|
| 15.1 | `UsersList` | `OrdersDashboardComponents/UsersList/__tests__/UsersList.test.jsx` | includes D2 recovery tests |
| 15.2 | `UserFormDetails` | `OrdersDashboardComponents/UserFormDetails/__tests__/UserFormDetails.test.jsx` | dashboard variant |
| 15.3 | `DriversList` | `OrdersDashboardComponents/DriversList/__tests__/DriversList.test.jsx` | includes D2 recovery tests |
| 15.4 | `Messages` | `OrdersDashboardComponents/Messages/__tests__/Messages.test.jsx` | dashboard variant |
| 15.5 | `WebsocketStatus` | `OrdersDashboardComponents/WebsocketStatus/__tests__/WebsocketStatus.test.jsx` | dashboard variant |
| 15.6 | `SettingsList` | `OrdersDashboardComponents/SettingsList/__tests__/SettingsList.test.jsx` | |
| 15.7 | `CheckPassword` | `OrdersDashboardComponents/CheckPassword/__tests__/CheckPassword.test.jsx` | |

**Controllers:** 7  
**Note:** `D2 recovery — branch coverage` block must be split into the components above.

---

### Wave 16 — Batch D3 (dashboard business / geo)

**Source:** `__tests__/dashboardBusinessControllers.test.jsx` (~19 tests)

| # | Controller | Target test path |
|---|------------|------------------|
| 16.1 | `CityList` | `OrdersDashboardComponents/CityList/__tests__/CityList.test.jsx` |
| 16.2 | `CountryList` | `OrdersDashboardComponents/CountryList/__tests__/CountryList.test.jsx` |
| 16.3 | `ExportCSV` | `OrdersDashboardComponents/ExportCSV/__tests__/ExportCSV.test.jsx` |
| 16.4 | `GiftCardsList` | `OrdersDashboardComponents/GiftCardsList/__tests__/GiftCardsList.test.jsx` |
| 16.5 | `MetaFields` | `OrdersDashboardComponents/MetaFields/__tests__/MetaFields.test.jsx` |
| 16.6 | `PointsWalletLevels` | `OrdersDashboardComponents/PointsWalletLevels/__tests__/PointsWalletLevels.test.jsx` |
| 16.7 | `BusinessProductsListing` | `OrdersDashboardComponents/BusinessProductsListing/__tests__/BusinessProductsListing.test.jsx` |

**Controllers:** 7

---

### Wave 17 — Batch D4 (dashboard logistics)

**Source:** `__tests__/dashboardLogisticsControllers.test.jsx` (~19 tests)

| # | Controller | Target test path |
|---|------------|------------------|
| 17.1 | `Appointments` | `OrdersDashboardComponents/Appointments/__tests__/Appointments.test.jsx` |
| 17.2 | `GoogleMapsApiKeySetting` | `OrdersDashboardComponents/GoogleMapsApiKeySetting/__tests__/GoogleMapsApiKeySetting.test.jsx` |
| 17.3 | `LogisticInformation` | `OrdersDashboardComponents/LogisticInformation/__tests__/LogisticInformation.test.jsx` |
| 17.4 | `Logistics` | `OrdersDashboardComponents/Logistics/__tests__/Logistics.test.jsx` |
| 17.5 | `ReviewCustomer` | `OrdersDashboardComponents/ReviewCustomer/__tests__/ReviewCustomer.test.jsx` |
| 17.6 | `Schedule` | `OrdersDashboardComponents/Schedule/__tests__/Schedule.test.jsx` |

**Controllers:** 6

---

## Totals

| Category | Controllers | Waves |
|----------|-------------|-------|
| Already per-component (batch 4) | 3 | — |
| Foundation smoke (batch 6) | 4 | Wave 0 |
| Marketplace batches 7–19 | 118 | Waves 1–13 |
| Dashboard batches D1–D4 | 27 | Waves 14–17 |
| **Grand total** | **152** | **18 waves** |

After completion: `src/components/__tests__/` should only contain shared helpers (if any), **zero** `*Controllers.test.jsx` domain suites.

---

## Progress checklist

| Wave | Original batch | Source file | Controllers | Status |
|------|----------------|-------------|-------------|--------|
| — | 4 | (already split) | 3 | ✅ done |
| 0 | 6 | `controllersSmoke.test.jsx` | 4 | ✅ done |
| 1 | 7 | `shellControllers.test.jsx` | 10 | ✅ done |
| 2 | 8 | `authControllers.test.jsx` | 8 | ✅ done |
| 3 | 9 | `socialAuthControllers.test.jsx` | 6 | ✅ done |
| 4 | 10 | `addressPhoneControllers.test.jsx` | 5 | ✅ done |
| 5 | 11 | `businessDiscoveryControllers.test.jsx` | 10 | ✅ done |
| 6 | 12 | `menuListingControllers.test.jsx` | 8 | ✅ done |
| 7 | 13 | `productDetailControllers.test.jsx` | 9 | ✅ done |
| 8 | 14 | `cartCheckoutControllers.test.jsx` | 8 | ✅ done |
| 9 | 15 | `paymentControllers.test.jsx` | 14 | ✅ done |
| 10 | 16 | `customerOrdersControllers.test.jsx` | 12 | ✅ done |
| 11 | 17 | `driverMessagesMapControllers.test.jsx` | 9 | ✅ done |
| 12 | 18 | `analyticsCmsControllers.test.jsx` | 10 | ✅ done |
| 13 | 19 | `userProjectMiscControllers.test.jsx` | 7 | ✅ done |
| 14 | D1 | `dashboardOrdersControllers.test.jsx` | 7 | ✅ done |
| 15 | D2 | `dashboardUsersControllers.test.jsx` | 7 | ✅ done |
| 16 | D3 | `dashboardBusinessControllers.test.jsx` | 7 | ✅ done |
| 17 | D4 | `dashboardLogisticsControllers.test.jsx` | 6 | ✅ done |

---

## Suggested start order

1. **Wave 0** — smallest, validates the workflow (4 files)
2. **Wave 1** — still small (10 files)
3. Continue numerically, or jump to **Wave 14+** if dashboard separation is higher priority

Tell the agent: *"Empieza Wave N"* to execute one wave.

*Created: 2026-07-13 — ORD-1084 per-component test migration.*

# Client App Flow Blueprint (Leva Mais)

## 1) Product goal
Build a client experience with the same decision clarity used in apps like Uber/99:
- Fast request creation
- Clear map context (pickup -> dropoff route)
- Transparent pricing before confirm
- Reliable post-confirm state (searching driver -> tracking -> completion)

---

## 2) Current client screens (mapped from code)

### Core request flow
- `src/screens/(authenticated)/Client/Home/index.tsx`
- `src/screens/(authenticated)/Client/Ride/Request/AddressPicker/index.tsx`
- `src/screens/(authenticated)/Client/Ride/Request/SelectVehicle/index.tsx`
- `src/screens/(authenticated)/Client/Ride/Request/ServicePurpose/index.tsx`
- `src/screens/(authenticated)/Client/Ride/Request/ServiceSelection/index.tsx`
- `src/screens/(authenticated)/Client/Ride/Request/Payment/index.tsx`
- `src/screens/(authenticated)/Client/Ride/Tracking/RideTracking/index.tsx`
- `src/screens/(authenticated)/Client/Ride/Tracking/Chat/index.tsx`
- `src/screens/(authenticated)/Client/Ride/Cancellation/CancelRide/index.tsx`
- `src/screens/(authenticated)/Client/Ride/Cancellation/CancelFee/index.tsx`
- `src/screens/(authenticated)/Client/Ride/Completion/RideCompleted/index.tsx`
- `src/screens/(authenticated)/Client/Ride/Completion/RateDriver/index.tsx`

### Account and support
- `src/screens/(authenticated)/Client/History/HistoryList/index.tsx`
- `src/screens/(authenticated)/Client/History/OrderDetails/index.tsx`
- `src/screens/(authenticated)/Client/Favorites/FavoritesList/index.tsx`
- `src/screens/(authenticated)/Client/Profile/ProfileView/index.tsx`
- `src/screens/(authenticated)/Client/Profile/Wallet/index.tsx`
- `src/screens/(authenticated)/Client/Profile/Settings/index.tsx`
- `src/screens/(authenticated)/Client/Profile/Help/index.tsx`

### Navigation shell
- `src/routes/drawer.cliente.routes.tsx`
- `src/routes/ClientBoot.tsx`
- `src/screens/(authenticated)/Client/types/navigation.ts`

---

## 3) Recommended final client flow (modern ride app pattern)

1. Home/Dashboard
- User sees current pickup, quick favorites, and main service entry.
- Tap destination starts request flow.

2. Address confirmation
- `AddressPicker`: choose destination on map/autocomplete.
- Show clear "Confirm destination" action.

3. Vehicle category
- `SelectVehicle`: Moto/Car/Van/Truck cards with short usage context.

4. Service purpose (if needed)
- `ServicePurpose` or `ServiceSelection`.
- If only one active purpose, auto-continue after short feedback.

5. Trip preview + price
- Home map with pickup/dropoff route and bottom summary.
- User can edit pickup/dropoff quickly.

6. Payment confirmation
- `Payment`: method + final confirm.
- Create ride only here (single source of truth).

7. Searching driver
- Keep same route visible on map.
- Show status card "Buscando motorista", ETA, cancel/chat actions.

8. Tracking
- Driver movement + route context + trip status transitions.

9. Completion
- Receipt summary -> rating.

10. Post-trip utilities
- History details, favorites reuse, wallet and profile settings.

---

## 4) UX rules to keep across all client screens

1. One primary CTA per step
- Every screen has only one clear main action.

2. Strong state continuity
- Pickup/dropoff/vehicle/purpose/payment must survive navigation hops.

3. Route always visible in request/tracking states
- If status is searching or active ride, map must render route and markers.

4. Explicit empty and error states
- No blank screen; always show action to recover.

5. Step consistency
- Request steps use stable order and shared header (`FlowStepHeader`).

6. No duplicate ride creation
- Ride is created at payment confirmation only.

---

## 5) Technical architecture decisions

### A. Routing
- Keep drawer for top-level modules.
- Keep request/tracking screens hidden from drawer menu.

### B. State ownership
- `useRideFlow` + draft store: request draft state.
- `rideService.create`: only in payment confirm.
- Route params used only for transitions, then cleaned immediately.

### C. API contracts
- Purposes are backend-driven (`/purposes?vehicleType=...&isActive=true`).
- Front should not rely on local mocks for production flow.

### D. Map behavior
- Request preview: route polyline pickup->dropoff.
- Searching/tracking: preserve same trip route + include driver marker when available.

---

## 6) Refactor checklist per screen group

### Request flow screens
- [x] Compact and clearer summary modal in Home
- [x] Payment transition from summary
- [x] Search state route restoration from payment -> home
- [ ] Remove old/duplicate request entry paths still not used
- [ ] Add auto-continue when only one purpose (optional)

### Tracking screens
- [x] Add route polyline in tracking map
- [x] Fit map bounds to pickup/dropoff/driver points
- [ ] Add bottom progress timeline (arriving, arrived, in_progress)

### History and profile
- [ ] Add shared top header style to history/favorites/profile
- [ ] Add semantic formatting for status and payment method labels

### Navigation typing and safety
- [x] Expanded `Home` route params typing
- [ ] Replace remaining `any` in request stack params

---

## 7) Deprecated/legacy warning

There is still an older screen tree under:
- `src/screens/(authenticated)/Client/HomeScreen/*`

Current route uses:
- `src/screens/(authenticated)/Client/Home/*`

Recommendation:
- Keep old tree only as backup branch reference.
- Remove from main branch after final parity verification.

---

## 8) Delivery phases

### Phase 1 (done)
- Flow stability fixes (loop, params cleaning, search continuity)
- Summary modal redesign and compact version
- Payment->search route handoff
- Tracking route rendering

### Implemented updates snapshot (2026-04-27)
- Home:
  - fixed repeated route-param processing loop
  - stabilized open-offers processing
  - restored search route after payment confirmation
- Payment:
  - ride creation at confirm step
  - explicit handoff of search route to Home
- Ride Tracking:
  - route polyline pickup->dropoff
  - auto fit bounds for pickup/dropoff/driver
- Shared UI:
  - new `ClientScreenHeader` component for consistent top headers
  - applied to History, Favorites, Profile, OrderDetails, Wallet, Help, Settings, CancelRide, CancelFee, RideCompleted, RateDriver, Chat
- Navigation typing:
  - expanded Home param typing for real flow transitions

### Phase 2 (next)
- Uniform headers and spacing for all account screens
- Remove dead/legacy client screen paths
- Full typing cleanup and final QA pass

### Phase 3 (hardening)
- Telemetry events per step
- Offline/network degraded state handling
- Performance pass on map and polling

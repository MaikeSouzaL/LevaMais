# Client Screen Enhancements Plan

## Objective
Deliver a polished client experience with production-level UX, clear flow transitions, and scalable architecture.

## Principles
- Keep one primary CTA per step.
- Preserve request state through the full journey.
- Always show route context during searching and tracking states.
- Use shared components for visual consistency.

---

## Per-screen improvements

### Home
Current:
- Request flow and summary are functional.
- Searching state is integrated.

Next:
- Add route mini-preview card on dashboard when dropoff exists.
- Add proactive validation banner if city config/pricing is missing.
- Add "last used destination" quick chip.

### AddressPicker
Current:
- Map, reverse geocode, autocomplete, and favorite create/edit flow work.

Next:
- Add "current location accuracy" status.
- Add confirmation sheet before replacing an existing destination.
- Add optional landmark/complement fields.

### SelectVehicle + ServicePurpose + ServiceSelection
Current:
- Dynamic purpose loading from backend.

Next:
- Add availability badges by city/time.
- Add estimated price range on vehicle cards.
- Auto-continue when only one purpose is active.

### Summary + Payment
Current:
- Compact summary and payment handoff are working.
- Ride is created in payment confirmation step.

Next:
- Add coupon/promo support.
- Add split payment preparation hooks.
- Add fallback retry card when payment/ride create fails.

### Searching + Tracking
Current:
- Route is rendered in tracking.
- Driver search continuity restored with route handoff.

Next:
- Add explicit timeline component (requesting -> assigned -> arriving -> arrived -> in_progress).
- Add SLA timeout recommendation (suggest alternative vehicle/service).
- Add richer driver card (plate, car model, safety shortcuts).

### Chat
Current:
- Realtime message handling and quick replies.

Next:
- Delivery/read status.
- Persistent chat history per ride.
- Attachment support (photo for pickup proof).

### Cancellation (CancelRide + CancelFee)
Current:
- Reason-based cancellation and fee explanation are available.

Next:
- Add reason analytics event tagging.
- Add contextual rescue options before cancel:
  - change payment
  - change pickup note
  - wait a bit more

### Completion + Rating
Current:
- Completion screen with rate action and history entry points.
- Rating supports stars + optional comment.

Next:
- Add issue reporting shortcut on low ratings (1-2 stars).
- Add tip flow post-completion.
- Add receipt sharing.

### History + OrderDetails
Current:
- History list and details are functional.

Next:
- Filter by status/date.
- Reorder/repeat trip CTA.
- Download/share receipt.

### Favorites + Profile + Wallet + Settings + Help
Current:
- Shared header consistency is in place.
- Settings now persist local preferences.
- Help includes FAQ.

Next:
- Favorites grouping (home/work/custom tags).
- Wallet transaction model and real top-up backend.
- Profile editing flow and verification states.
- Help ticket creation with protocol tracking.

---

## Technical refactor roadmap

## Phase A (stability)
- Remove deprecated client legacy screens (`Client/HomeScreen/*`) after parity validation.
- Replace remaining `any` route params in request stack.
- Add centralized request-flow state machine.

## Phase B (feature depth)
- Add analytics events per step.
- Add retry policies for network-sensitive calls.
- Add optimistic UI for favorites and chat send.

## Phase C (scale)
- Introduce server-driven feature flags for city-specific services.
- Add AB test hooks for summary/payment variants.
- Add crash-safe flow resume after app restart.


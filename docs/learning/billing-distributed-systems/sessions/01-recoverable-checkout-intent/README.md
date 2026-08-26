# Session 1 — Recoverable Checkout Intent

## The question

Can two requests representing one subscribe intent create multiple Stripe Checkout Sessions, especially when the first response is lost?

That sentence is our starting point. We are not beginning with “implement idempotency,” because naming a mechanism before seeing the failure makes it too easy to patch by pattern recognition rather than understand the guarantee.

## Why this question now?

The current browser code creates an idempotency key in `sessionStorage`, and the checkout route forwards a received key to Stripe. That looks reassuring. But the system does not yet make the relationship between a person's subscribe intent, an HTTP request, and a Stripe Checkout Session explicit or durable in our database.

The interesting failure window is:

```text
browser sends request
→ app asks Stripe to create a Checkout Session
→ Stripe may create it
→ the response is lost or delayed
→ browser cannot tell which outcome occurred
```

“No response arrived” describes what the browser observed. It does not tell us whether Stripe failed, succeeded, or is still processing the request.

## Production boundary to inspect

Follow this interaction through three files:

- [`app/api/stripe/create-checkout-session/route.ts`](../../../../../app/api/stripe/create-checkout-session/route.ts) — accepts the request, calls Stripe, and returns a redirect target.
- [`app/app/upgrade/_StripeActionButton.tsx`](../../../../../app/app/upgrade/_StripeActionButton.tsx) — creates and retains the browser-side key and decides when to clear it.
- [`core/features/billing/stripe.ts`](../../../../../core/features/billing/stripe.ts) — parses and validates the incoming key.

Inspection is welcome immediately. We will change these production paths only after we can state the intended guarantee and where it comes from.

## Smallest useful experiment

Build a disposable fake checkout provider with only enough behavior to expose one uncertainty:

- it can record each create call;
- it can delay or withhold a response after recording a created session;
- it can show which logical key, if any, arrived with each call.

Then send two overlapping requests that you intend to represent one subscribe action. Observe calls and returned results rather than relying on timing impressions.

Keep this tiny. The fake does not need HTTP, React, a reusable provider abstraction, or a realistic Stripe payload unless one of those boundaries becomes the uncertainty under study. The code can be discarded after the behavior is understood.

## Likely discovery path—not a checklist

The experiment will probably bring these ideas into view:

```text
logical intent → duplicate requests → overlapping execution
→ identity → provider creation → lost response
→ unknown outcome → safe retry → enforceable invariant
```

We can pause for a direct explanation anywhere prerequisite knowledge is missing. We can also follow an unexpected observation. The purpose is to understand this behavior, not to complete every noun in the diagram.

## The lines Petro should own

The AI may create test scaffolding, fake responses, setup, and repetitive assertions. Petro should write or substantially modify the few lines that decide:

- what makes two calls the same logical checkout intent;
- what identity is reused on retry;
- what observable result should prove that a repeated intent did not create another provider resource.

Those are the lesson. The surrounding plumbing is not.

## When a production change is safe to attempt

Before changing checkout behavior, answer in plain language:

1. What failure does the change prevent?
2. Where does that guarantee come from?
3. What does it not protect against?

Then use the lowest-cost test that can falsify the actual claim. A helper unit test can prove local key parsing, but it cannot prove that two concurrent requests cannot create two Stripe sessions. That claim must be exercised at the boundary where shared identity and provider creation meet.

This investigation is expected to inform PR 1's executable billing invariants and PostgreSQL test harness. It may instead reveal that a smaller prerequisite or a different first production slice is needed; the observation gets the final vote.

## Sources when the question calls for them

- [Stripe: Idempotent requests](https://docs.stripe.com/api/idempotent_requests) — when we need to know what Stripe promises for a repeated key.
- [PostgreSQL: Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html) — when we need to ask whether our own database can enforce one durable identity.
- [PostgreSQL: Transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html) — when we need to locate the boundary between our committed state and Stripe's state.

Read the smallest relevant section when its question appears. There is no reading assignment before we begin.

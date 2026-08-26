# Learning Journey Map

This page preserves continuity between sessions. Update only what helps resume the work; it is not a status report or evidence ledger.

## Current phenomenon

Can two requests representing one subscribe intent create multiple Stripe Checkout Sessions, especially when the first response is lost?

Active trail: [Recoverable checkout](curriculum.md#trail-2--recoverable-checkout)

Starting point: [Session 1 — Recoverable checkout intent](sessions/01-recoverable-checkout-intent/README.md)

## Last useful discovery

The current route can finish the provider call without giving the browser a response. In that window, the browser knows only that it did not receive the outcome; Stripe may still hold a created Checkout Session.

## Next concrete question

What identity would let the server recognize two requests as retries of the same human subscribe intent rather than two separate intentions?

## Unresolved uncertainty

We have not yet observed the present route under two overlapping requests or a deliberately lost provider response. Its actual duplicate-creation behavior remains to be demonstrated.

## Parked tangents

- How Vercel may run the same route across multiple processes or instances.
- How long Stripe retains an idempotency result.
- Whether a dedicated queue will eventually be justified.

These are worth returning to when they affect the current guarantee. They do not need answers before the first experiment.

## Durable references

- [AI teaching contract](ai-learning-contract.md)
- [Learning checks](learning-checks.md)
- [Just-in-time sources](source-policy.md)
- [Historical foundations work](history/)

Add links here when an experiment, production decision, test, or incident will be useful in a later session. Ordinary conversational progress does not need an artifact.

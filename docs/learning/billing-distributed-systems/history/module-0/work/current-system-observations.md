### create-checkout-session/route.ts

1. Who initiates the route?
   StripeActionButton component

2. What identifies the request or logical operation?
   We use idempotencyKey from request to identify it, same is with the main logical operation - session creation - which is also identified by idempotencyKey. In case idempotencyKey is missing we are unable to identify request or logical operation.

3. What does it read from PostgreSQL?
   It reads the current user.

4. What does it write to PostgreSQL?
   It does not write anything.

5. What does it send to Stripe?
   It sends Product ID to Stripe in order to get product information.
   Then it sends session parameters and idempotency key to Stripe in order to get session.

6. What must finish before its HTTP response?
   Stripe must create Checkout Session before a successful HTTP response, after that users are redirected to Stripe checkout page.

7. What information exists only in process memory?
   Certain variables: wantsJson, user, product object we receive from Stripe, errorCode, sessionParams, idempotencyKey, session object we receive from Stripe, also createRedirectResponse function.

8. After each await, what would remain if the process stopped?
   Work that was done before and during this await.

- getCurrentUser(): no changes made yet, so nothing survives outside Node.js; "wantsJson", "baseUrl", "user", and "createRedirectResponse" don't survive; durable state is not changed
- stripe.products.retrieve(...): no changes made yet, so nothing survives outside Node.js; "wantsJson", "baseUrl", "user" variables and "createRedirectResponse" function are local state, so they don't survive, also "stripe", "priceId", and "product" variables do not survive; durable state is not changed
- getIdempotencyKeyFromRequest(...): no changes made yet, so nothing survives outside Node.js; "wantsJson", "baseUrl", "user", "createRedirectResponse", "stripe", "priceId", "product", "defaultPrice", "sessionParams", and "idempotencyKey" do not survive; durable state is not changed
- stripe.checkout.sessions.create(...): outside Node.js a Checkout Session in Stripe survives; "wantsJson", "baseUrl", "user", "createRedirectResponse", "stripe", "priceId", "product", "defaultPrice", "sessionParams", "idempotencyKey", and "session" do not survive; durable state is not changed

## 1. Client

### In my own words

A component is a client when it initiates communication with another component.

### Example from this repository

API route is a client when it initiates communication with Stripe and a server when it responds to requests sent from Next.js app

### Question I still have

None

## 2. Server

### In my own words

A component is a server when it receives a request from another component.

### Example from this repository

API routes when they receive communication from the app

### Question I still have

None

## 3. Request

### In my own words

A communication a client sends to a server in order to make this server perform some work

### Example from this repository

When we use server actions I suppose we send such requests; when server actions use Drizzle to do DB work they also send requests (this time to a DB)

### Question I still have

Does invoking a Server Action from the browser involve sending requests to them?

## 4. Response

### In my own words

A communication a server sends in response to whatever request it received; it communicates the handler’s intended account of the outcome, but does not independently prove the underlying business facts.

### Example from this repository

API routes return various such responses; those API routes that deal with Stripe also receive responses from Stripe

### Question I still have

None

## 5. Process

### In my own words

When a program is run it becomes a process - system allocates memory to it and communicates with it when necessary.

### Example from this repository

The app itself - when I run it locally my system spins up a process, which is an instance of the app.

### Question I still have

None for now.

### Resolved during review

- my original hypothesis: each invocation creates a process;
- the observation: multiple invocations reported the same PID;
- my revised model: Server Actions execute as work inside an existing process.

## 6. Volatile state

### In my own words

State that is ephemeral and exists only as long as a process that spawned exists.

### Example from this repository

A module-level in-memory value that may survive multiple requests in one process but disappears on process restart.

### Question I still have

None for now.

## 7. Durable state

### In my own words

State that we want to preserve so that it outlives a process that initiated it. The idea is we need this state in other processes and so it has to outlive initiator process.

### Example from this repository

A committed PostgreSQL row that remains after the Node.js process restarts.

### Question I still have

None for now.

## 8. Database transaction

### In my own words

A batch of DB operations that perform as a unit - not including operations with third party services - they either finish together or roll back.

### Example from this repository

We have such transaction in tryInsertResumeAnalysisDb - it locks user row for update, counts user’s resume analyses, and conditionally insert a new analysis. In case something goes wrong the whole chain of operations is rolled back.

### Question I still have

None for now.

## 9. Concurrency

### In my own words

When multiple operations have overlapping lifetimes; interference is possible but not required.

### Example from this repository

When a page is loading there is usually a bunch of GET requests happening roughly at the same time.

### Question I still have

None.

### Resolved during review

- I wonder if this term always means operations that interfere with one another?

## 10. Interleaving

### In my own words

When operation A's steps mix with operation B's steps - internally these steps have a set order, yet when mixed the order is not determined. Example: A's write always comes after A's read, yet we don't know if B's write comes after or before A's write

### Example from this repository

A reads
B reads
A writes
B writes

### Question I still have

None.

### Resolved during review

- I wonder what this term really means?

## 11. External dependency

### In my own words

Some separate system with independent state and failure behavior; it may be ours or belong to a third party.

### Example from this repository

Stripe service; also Google, Github, and Discord OAuth services, PostgreSQL.

### Question I still have

None for now.

## 12. Timeout

### In my own words

When a waiting limit expires before we receive a conclusive result.

### Example from this repository

Calls with a time limit on response - usually these are network calls.

### Question I still have

None.

### Resolved during review

- I wonder if this term also covers in-app functions that fail to respond due to stack overflow or similar issues?

## 13. Message delivery

### In my own words

An attempt to send information from one component to another.

### Example from this repository

When we try to create Stripe subscription we send certain information to Stripe.

### Question I still have

None.

## 14. Duplicate delivery

### In my own words

Same information arriving more than once.

### Example from this repository

Same Stripe event identity arrives more than once to Stripe webhook endpoint.

### Question I still have

None.

## 15. Reordered delivery

### In my own words

Distinct related events arriving in an order that is different from their underlying changes.

### Example from this repository

Stripe webhook endpoint may receive events in order that is different from the order Stripe performed related operations.

### Question I still have

None.

## 16. Safety property

### In my own words

Ensure an incorrect state never occurs.

### Example from this repository

Ensuring a user does not receive Pro subscription without paying for it.

### Question I still have

None.

## 17. Liveness property

### In my own words

Ensuring some desired progress eventually occurs under stated conditions.

### Example from this repository

A user who paid for subscription receives Pro subscription status - Stripe recorded the successful payment, and Stripe plus our processing system eventually remain available long enough to communicate and process it.

### Question I still have

None.

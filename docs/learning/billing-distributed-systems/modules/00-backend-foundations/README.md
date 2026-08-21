# Module 0 — How Backend Systems Behave

This module changes no production behavior and has no production PR. Its purpose is to make the current system observable and give you precise questions for later modules.

Start with AI assistance Level 0: questions only.

## Why this exists

The current billing flow crosses several boundaries:

```text
browser → Next.js request handler → process memory → PostgreSQL → Stripe
```

Success and failure mean different things at each boundary. A browser can lose a response after the server commits. A process can terminate after Stripe accepts a request. Two asynchronous requests can overlap even though JavaScript callbacks run through one event loop. A database transaction can protect local rows but cannot include Stripe in the same commit.

You are not expected to solve these problems in Module 0. You will observe them, predict their consequences, and learn the vocabulary needed to ask better questions.

## Prerequisite check

Answer without research. “I do not know yet” is useful evidence.

1. What happens between entering a URL and receiving an HTTP response?
2. Where do variables in a running Node.js program live, and what happens to them when the process stops?
3. What does it mean for a database write to commit?
4. If JavaScript runs callbacks on an event loop, can two requests still interfere with one another? Why or why not?
5. If an external API call times out, which outcomes remain possible?
6. If the same webhook arrives twice, what could be duplicated?
7. If two status updates arrive in reverse order, which one should local state represent?

Create:

```text
docs/learning/billing-distributed-systems/modules/00-backend-foundations/work/
└── prerequisite-check.md
```

Record your answers and confidence. Do not improve them after reading; add a separate revision later.

## Vocabulary

Use these definitions to make your first model, not as sentences to memorize.

- **Client:** A component that initiates a request to another component.
- **Server:** A component that receives a request and produces a response. One application can be a server to a browser and a client to Stripe.
- **Request:** A message asking another component to perform or return something.
- **Response:** A message reporting the request handler's outcome. It does not prove that the client received it, nor does it automatically describe future asynchronous work.
- **Process:** A running instance of a program with its own memory and lifecycle.
- **Volatile state:** State that may disappear when its process stops.
- **Durable state:** State designed to survive process termination, such as committed database rows.
- **Database transaction:** A boundary that makes a group of local database operations commit or roll back as one unit.
- **Concurrency:** Multiple operations whose lifetimes overlap.
- **Interleaving:** The particular order in which steps from concurrent operations occur.
- **External dependency:** A system with its own state and failure behavior that the application calls over a boundary, such as Stripe.
- **Timeout:** The caller stopped waiting before receiving a conclusive response. A timeout describes the caller's knowledge, not necessarily the external operation's outcome.
- **Message delivery:** The attempt to send information from one component to another.
- **Duplicate delivery:** The same message or logical fact is delivered more than once.
- **Reordered delivery:** Related messages are observed in a different order from the order in which their underlying changes occurred.
- **Safety property:** Something incorrect must never happen.
- **Liveness property:** Desired work eventually makes progress under stated conditions.

In `backend-terms-in-my-own-words.md`, rewrite each term without copying the definition. Add one example from this repository and one question you still have.

## Inspect the current system

Read only enough code to trace inputs, external calls, database writes, and responses. Do not open the frozen production roadmap yet.

Inspect:

- `app/api/stripe/create-checkout-session/route.ts`
- `app/api/stripe/checkout-return/route.ts`
- `app/api/stripe/webhooks/route.ts`
- `app/api/cron/sync-stripe-subscriptions/route.ts`
- `core/features/billing/webhookHelpers.ts`
- `core/features/users/stripeSync.ts`
- `core/drizzle/schema/user.ts`
- `core/drizzle/schema/stripeEvent.ts`
- `core/drizzle/db.ts`
- `vercel.json`

For each route, record:

1. Who initiates it?
2. What identifies the request or logical operation?
3. What is read from PostgreSQL?
4. What is written to PostgreSQL?
5. What is sent to Stripe?
6. What must finish before the HTTP response?
7. What information exists only in process memory?
8. What would remain if the process stopped after each `await`?

Do not judge the implementation yet. Separate observation from recommendation.

## Build your mental model

Create these learner-owned artifacts:

```text
work/
├── current-system-diagram.md
├── backend-terms-in-my-own-words.md
├── failure-predictions.md
└── questions-i-cannot-yet-answer.md
```

Use the [mental-model template](../../templates/mental-model.md) as a prompt, but draw the system in your own form.

Your diagram must include:

- browser;
- each relevant Next.js request boundary;
- one or more possible Vercel process instances;
- process memory;
- PostgreSQL;
- Stripe;
- webhook delivery;
- reconciliation trigger;
- arrows labeled with identities or data;
- durable and volatile state labels;
- at least five possible process-death points.

Write questions before seeking answers. Examples of question shapes—not answers—include:

- “What can tell whether this operation already happened?”
- “Which component owns this fact?”
- “What triggers recovery after this state survives a crash?”
- “Can these two writes commit together?”

## Predict before reading

Use the [prediction-log template](../../templates/prediction-log.md). Record each original prediction permanently.

### Scenario A — Lost response

The server commits a database update, but the connection closes before the browser receives the response.

Predict what the browser knows, what the server process knows after restart, what PostgreSQL contains, and what a user retry might do.

### Scenario B — Overlapping requests

Two requests both read “no checkout exists” before either writes a new checkout.

Draw at least two possible interleavings and predict the final state.

### Scenario C — Ambiguous external call

Stripe completes an operation, but the local request observes a timeout before saving Stripe's response.

List every external and local state you consider possible. Do not assume timeout means failure.

### Scenario D — Duplicate webhook

The same Stripe event is delivered twice, with the second delivery starting before the first finishes.

Predict which business effects could happen twice in the current implementation.

### Scenario E — Reordered updates

An older subscription update arrives after a newer one.

Predict which data source the final local state should represent and whether the current code establishes that.

For every scenario, name evidence that could prove your prediction wrong.

## Primary-source reading

Read only after saving the predictions.

1. `required` — [MDN: Overview of HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview)  
   Question: What is contained in a request and response, and which business guarantees are outside HTTP itself?
2. `required` — [Node.js: Don't block the event loop](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop)  
   Question: How does one Node.js process coordinate work for multiple clients?
3. `required` — [PostgreSQL tutorial](https://www.postgresql.org/docs/current/tutorial.html)  
   Question: Which database concepts and SQL operations will the laboratories use?
4. `required` — [PostgreSQL: Transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html)  
   Question: Which intermediate states are hidden, which changes roll back, and where does the transaction boundary end?

Append an “after reading” section to the prerequisite check and prediction log. Do not replace the original answers.

## Isolated laboratory

Create `learning-labs/00-backend-foundations/` only after your predictions exist. Every lab uses synthetic data and follows `learning-labs/README.md`.

Design the smallest experiment you can for each question before writing code. Ask AI at Level 0 to review whether the experiment can distinguish the hypothesis.

### Lab 1 — Volatile versus durable state

Create one piece of state held only by a running process and one committed to a disposable store. Stop and restart the process. Observe both through evidence rather than assumption.

Required output: explain which state disappeared, which survived, and why “the program handled it” is not the same as “the operation is durably recorded.”

### Lab 2 — Check-then-write race

Create two asynchronous actors that both check a shared condition, pause at a controllable point, and then write based on what they observed.

Required output: capture the actual interleaving and an invalid final state. Do not fix the race in Module 0.

### Lab 3 — Transaction interruption

Using disposable PostgreSQL data, perform two related writes first as separate committed statements and then within one transaction. Introduce failure between them.

Required output: compare visible and durable state in both runs. State what the transaction did not protect outside PostgreSQL.

### Lab 4 — External-call ambiguity

Create a fake external service that can record success but withhold or delay its response. Make the caller stop waiting before receiving the result.

Required output: show the difference between actual provider state and caller knowledge.

### Lab 5 — Duplicate and reordered delivery

Deliver the same synthetic message twice, then deliver two related state changes in reverse order.

Required output: record resulting local effects and identify which behavior came from duplication versus ordering.

For all five labs, design and implementation are learner-owned. AI may provide questions or the requested assistance level but does not create the first experiment design.

## Experiment report

Create one report per lab using the [experiment-report template](../../templates/experiment-report.md):

```text
work/experiments/
├── 01-durability.md
├── 02-check-then-write-race.md
├── 03-transaction-interruption.md
├── 04-external-call-ambiguity.md
└── 05-duplicate-and-reordered-delivery.md
```

Each report must include the original prediction, observable evidence, discrepancy, revised model, and cleanup confirmation.

## Production design challenge

There is no production design or production change in Module 0.

Instead, create `work/current-system-failure-map.md`. For every current billing boundary, list:

- a possible failure;
- durable state that survives;
- state that becomes uncertain;
- current recovery trigger, if one exists;
- a question a later module must answer.

Do not prescribe durable queues, outboxes, leases, or other named solutions. This artifact describes the problem space.

## AI review checkpoint

Submit these artifacts for Level 0 concept review:

- prerequisite check;
- current-system diagram;
- terms in your own words;
- five prediction logs;
- experiment designs before code;
- current-system failure map.

AI first checks:

- missing components or boundaries;
- observation mixed with recommendation;
- predictions changed after the fact;
- a lab that cannot distinguish its hypothesis;
- unsafe data or cleanup omissions.

AI does not provide Module 1 invariants or production mechanisms during this checkpoint.

## Architecture comparison gate

After the concept review and all experiment reports:

1. Save your revised current-system diagram.
2. Read only the target-architecture overview in `docs/superpowers/plans/2026-08-20-billing-subsystem-hardening-v2.md`.
3. Do not read individual PR implementation steps yet.
4. Add `work/architecture-comparison.md` describing:
   - boundaries you missed;
   - new components you do not yet understand;
   - observed failures each target component appears intended to address;
   - questions reserved for later modules.

The goal is orientation, not memorizing the target.

## First failing test

Module 0 has no production failing test. Write one learner-owned assertion inside a laboratory that fails because your pre-experiment assumption is wrong or because the laboratory reproduces an undesirable behavior.

Before showing code, explain:

- the property the assertion observes;
- why it should fail in the experiment's initial version;
- one accidental implementation that could make it pass without teaching the intended concept.

AI reviews the test claim before syntax.

## Production construction

None. Do not modify checkout, webhook, subscription, user-schema, event-schema, or reconciliation production files in Module 0.

Learning-lab code must remain isolated under `learning-labs/00-backend-foundations/` and must not be imported by the application.

## Failure drills

Complete these drills using your lab controls:

- terminate the process before a volatile update;
- terminate it after a volatile update;
- fail between two non-transactional database writes;
- fail between two writes inside a transaction;
- let the fake provider succeed while the caller times out;
- deliver one message twice concurrently;
- deliver two related changes in reverse order.

Before each drill, record predicted durable state, uncertain state, and evidence. After each drill, append observations without deleting the prediction.

## Teach-back

Using the [teach-back template](../../templates/teach-back.md), explain without reading code:

1. Why an HTTP success response is not identical to a durable business operation.
2. Why asynchronous requests can race in one Node.js process.
3. What a PostgreSQL transaction protects.
4. What a PostgreSQL transaction cannot include in this project.
5. Why a timeout does not prove an external operation failed.
6. Why duplicate and reordered delivery should be expected rather than treated as impossible corruption.
7. Which current billing states survive process death and why.

Draw the current system again from memory and compare it with your first diagram.

## Transfer scenario

Without opening your labs or notes, reason through this scenario:

```text
A client sends a request.
The server commits a database row.
The server begins writing the HTTP response.
The network connection disappears before the client receives it.
The process then restarts.
The client retries the original intent.
```

Explain:

- what definitely happened;
- what each actor knows;
- which state survived;
- what could be duplicated;
- what evidence you would inspect first;
- which question must be answered before declaring the retry safe.

AI may change one fact in the scenario and ask you to revise the reasoning.

## Mastery evidence

Module 0 passes when the mastery rubric reaches `transferable` for the foundation scope and the following evidence exists:

- prerequisite answers and after-reading revision;
- first and revised system diagrams;
- vocabulary in your own words;
- five pre-execution predictions;
- five experiment reports with cleanup evidence;
- current-system failure map;
- architecture comparison;
- laboratory failing assertion and test reasoning;
- failure-drill evidence;
- teach-back;
- successful transfer-scenario review;
- updated `progress.md` entry with highest assistance level and unresolved questions.

Working labs alone are insufficient if you cannot explain their behavior or distinguish the guarantee from the observation.

## Next retrieval

Module 1 will retrieve:

- durable versus volatile enforcement;
- safety versus liveness;
- observation versus desired behavior;
- transaction-boundary limits.

Module 3 will later retrieve:

- the check-then-write interleaving;
- ambiguous external-call outcomes;
- the difference between a client's intent and one network request.

Do not begin Module 1 until Module 0 is explicitly recorded as mastered.


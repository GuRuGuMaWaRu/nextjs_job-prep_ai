# Discovery-Driven Billing Curriculum Redesign

## Status

Approved in conversation on 2026-08-26. This document defines the replacement teaching model for `docs/learning/billing-distributed-systems/`.

## Problem

The existing curriculum has a strong conceptual sequence but an ineffective execution model for this learner. It optimizes for proof of learning through prerequisite questionnaires, permanent prediction records, mandatory vocabulary rewrites, formal reports, diagrams, assistance levels, mastery rubrics, and locked progression gates. The accumulated ceremony has displaced the actual work of learning backend systems through building, observing failure, and fixing real mechanisms.

The redesign preserves the distributed-systems concepts and incremental production roadmap while replacing the assessment-heavy experience with a discovery-driven apprenticeship.

## Goals

- Build deep, transferable backend judgment through concrete phenomena.
- Use the production billing system as the course's spine.
- Introduce complexity and infrastructure only when a demonstrated limitation justifies them.
- Let curiosity create useful learning paths without allowing tangents to destroy momentum.
- Preserve engineering discipline around production changes, tests, migrations, and recovery.
- Persist knowledge because it will be useful later, not because the curriculum demands proof that learning occurred.
- Preserve the learner's existing Module 0 work as history with no gatekeeping power.

## Non-goals

- Replacing the nineteen-PR production hardening roadmap.
- Removing all experiments, predictions, diagrams, explanations, or teach-backs.
- Treating working production code as sufficient evidence of understanding.
- Modifying production billing code as part of the curriculum-document rewrite.
- Requiring every discovery session to produce a PR or repository artifact.

## Course architecture

The production billing system is the learning spine. The production roadmap remains an implementation backbone because each PR introduces a bounded, reviewable capability, but its sequence is an expectation rather than an inflexible rail. Discoveries may reveal that a prerequisite or a different bounded change should come first.

The primary unit of learning is one discovery session focused on a concrete phenomenon:

```text
question -> prediction -> tiny experiment -> observation
-> explanation -> modification or fix -> production connection
-> proportional verification -> next exposed problem
```

A session may begin in a disposable lab or directly in the application. A toy experiment is used only when it makes one behavior easier to see. Once the phenomenon is understood, the learner locates the same boundary in the production billing system and either improves it or identifies the smallest prerequisite for improving it safely.

Concepts may appear whenever the active failure creates a reason for them. No architecture gate or module boundary may prevent the learner from asking about, reading about, or investigating a relevant mechanism.

Production code may be inspected at any time. It may be changed when the learner can state the intended guarantee and has enough understanding to make the change safely. Otherwise, the smallest useful lab or prerequisite investigation comes first.

A production fix is not considered learned merely because it works. Before moving on, the learner should be able to explain what failure it prevents, where the guarantee comes from, and one situation it does not protect against.

## Concept trails

The old fourteen-module progression becomes five overlapping discovery trails:

1. **Boundaries and uncertainty** — process memory, durable state, concurrency, transactions, timeouts, and external systems.
2. **One recoverable checkout intent** — invariants, logical-operation identity, competing requests, database uniqueness, Stripe idempotency, and ambiguous provider outcomes.
3. **Subscription truth and access** — state machines, ownership, relational history, entitlement policy, migrations, and reconciliation.
4. **Durable asynchronous processing** — webhook acknowledgement, durable inboxes, event semantics, workers, leases, fencing, retries, dead letters, and ordering.
5. **External effects and operations** — outbox delivery, audit lineage, observability, operational recovery, chaos, capacity, and deciding whether dedicated queue infrastructure is justified.

The trails are a navigation map, not five replacement modules. A trail can remain partially open while another production problem becomes the better vehicle for learning. Previously understood foundations are retrieved when they become relevant rather than repeated through prerequisite exercises.

## AI teaching contract

The AI acts as an active teacher and pair programmer, not an examiner operating through assistance levels.

The governing philosophy is:

> Explain freely. Ask questions selectively. Let Petro own the code that embodies the idea. Generate the boring parts. Correct real misconceptions, not wording. Use productive struggle, not ritual struggle. Follow curiosity, but protect momentum.

The AI should not turn every uncertainty into a question. If the learner lacks prerequisite knowledge rather than holding a testable hypothesis, it explains first and asks only when prediction or reasoning adds value.

When the learner is stuck on the core learning task, the AI normally offers a small hint or narrowing question before the complete solution. This is a default, not a gate: the AI provides a direct solution when the learner requests it or when prolonged struggle is no longer useful.

Understanding is evaluated semantically. Informal terminology passes when the mental model is correct. A substantive misconception receives a direct explanation and, when useful, one focused follow-up or small experiment. The AI does not conduct repeated wording-level cross-examinations.

When a concept is embodied in a few critical lines, the learner writes or substantially modifies those lines. AI may generate surrounding setup, mocks, fixtures, boilerplate, migrations scaffolding, and repetitive code. It may explain syntax, review designs, help debug, and provide direct implementation help without an assistance-level ceremony.

The AI may follow relevant tangents, but it notices when a tangent is becoming a separate course branch. It then explicitly parks the branch in the journey map or returns to the active phenomenon.

## Experiments

Experiments normally isolate one uncertainty and are small enough to discard after the behavior is understood. Learning labs do not acquire reusable abstractions, polished interfaces, or miniature application architecture unless reuse or architecture is itself the subject.

Experiments use synthetic data, Stripe test mode or a fake provider, and deliberate failure controls. They collect only enough evidence to distinguish the relevant explanations. An unexpected result prompts inspection or a smaller experiment, not a mandatory report.

The learner writes the lines that embody the phenomenon. AI may generate setup and other mechanically necessary support.

## Production changes and PRs

Before changing production behavior, there should be:

- a concrete failure or limitation;
- a stated intended guarantee;
- enough understanding to make the change safely;
- a test or reproducible observation capable of detecting the behavior;
- an incremental rollout and recovery plan when a change can leave persistent data or deployed versions in incompatible states.

Each PR remains independently reviewable, testable, and deployable. It introduces one coherent capability or guarantee. Complexity and tools enter only when a demonstrated limitation requires them; roadmap presence alone is not sufficient justification.

Before treating a mechanism as learned, the learner answers conversationally:

1. What failure does it prevent?
2. Where does the guarantee come from?
3. What does it not protect against?

These are a lightweight semantic check, not a required form.

## Testing and failure injection

Prefer the lowest-cost test that can actually falsify the guarantee. Unit tests are sufficient for local logic. Concurrency, crash, ordering, persistence, and external-boundary claims are tested at the boundary where those behaviors exist.

Failure testing is proportional to the guarantee. The course tests the crash, retry, concurrency, persistence, or ordering boundaries that could invalidate the claim, but it does not require an exhaustive failure matrix for every PR.

## Progress and useful documentation

The formal mastery rubric and module-status ladder are retired. A phenomenon is understood well enough to continue when the learner can explain what happened and why, predict a nearby variation, connect it to the billing system, and state a production mechanism's guarantee and limitation when applicable. This is a teaching judgment, not a scored gate. Partial understanding may remain open unless it would make a production change unsafe.

`progress.md` becomes a lightweight journey map with:

- the current phenomenon or production problem;
- the last meaningful discovery or shipped change;
- the next concrete question;
- unresolved uncertainty, if one is currently important;
- parked tangents worth returning to;
- links to relevant PRs or unusually valuable experiments.

It is updated only when it helps resume work.

Documentation is created when it has future value. A difficult race reproduction may deserve a note; a trivial disposable experiment probably does not; a production invariant that future code must preserve belongs close to the code or design it governs.

Production guarantees, non-obvious failure assumptions, and operational constraints are documented when future maintainers would otherwise have to rediscover them. Predictions may be conversational. Diagrams are created when relationships are difficult to hold in prose. Teach-back is conversational and used only when it tests genuine understanding. Primary sources are read just in time to answer a live question.

Existing templates remain an optional toolbox and are never progression requirements.

## Historical preservation

The learner-authored Module 0 prerequisite answers, vocabulary notes, and route observations move into a clearly marked historical area. They remain intact as a snapshot of the learner's initial model and have no status, evidence, or gatekeeping role in the active curriculum.

The original Module 0 guide is retired from active navigation. Git history continues to preserve the old curriculum machinery; the active documentation does not require learners or AI tutors to follow it.

## Restart point

The old route-by-route inventory stops. The first discovery question under the redesigned system is:

> Can two requests representing one subscribe intent create multiple Stripe Checkout Sessions, especially when the first response is lost?

The learner will reproduce the behavior with the smallest useful experiment, connect it to the current checkout route, and derive an invariant before selecting a mechanism. This is expected to feed PR 1's executable billing invariants and PostgreSQL test harness, and likely expose the provider-contract and durable-checkout work in PRs 2 and 3.

The session is allowed to reveal a different next step. The roadmap guides the journey but does not predetermine the observed result.

## Documentation migration

The curriculum rewrite will:

- rewrite `README.md` around the discovery-session loop and new start point;
- rewrite `curriculum.md` as the five-trail concept and PR navigation map;
- replace the assistance-level contract in `ai-learning-contract.md` with the teaching contract above;
- remove `mastery-rubric.md` from active navigation and replace it with `learning-checks.md`, containing only the conversational understanding and production-readiness checks defined above;
- rewrite `progress.md` as the journey map;
- rewrite `source-policy.md` around just-in-time, question-driven reading;
- move the original Module 0 guide and learner-authored work intact from `modules/00-backend-foundations/` to `history/module-0/`;
- mark every template as optional and add a toolbox index explaining when each has future value;
- add `sessions/01-recoverable-checkout-intent/README.md` for the duplicate/ambiguous Checkout Session question.

No production application code changes in this documentation migration.

## Success criteria

The redesign succeeds when:

- the active start path reaches a runnable phenomenon quickly;
- no active document requires a prerequisite questionnaire, vocabulary rewrite, prediction log, experiment report, formal diagram, teach-back file, assistance level, or mastery score;
- the AI contract explicitly prevents Socratic overuse and wording-level policing;
- the learner's critical implementation role and AI's scaffolding role are clear;
- the five trails and nineteen PRs remain visible without becoming locked gates;
- production changes retain explicit guarantees, appropriate tests, safe migration discipline, and lightweight understanding checks;
- existing Module 0 learner work is preserved as history with zero gatekeeping power.

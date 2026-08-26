# Experiment Report

> **Optional tool:** Use this only when the resulting document will have future value. It is not required for progress.

Use this when an experiment was subtle, expensive to reproduce, or likely to inform later work. A disposable experiment normally needs only enough notes to answer its one question.

## Question

Write one question that the experiment can distinguish through observation.

## Safety confirmation

- Data is synthetic and disposable.
- No live provider credentials are loaded.
- No customer emails, provider payloads, tokens, or secrets are used.
- Cleanup is known before execution begins.

## Hypotheses

State the primary explanation and at least one competing explanation when possible.

## Variables

- Controlled variables:
- One variable changed intentionally:
- Uncontrolled uncertainty:

## Setup

Describe processes, database state, fake provider behavior, clocks, and failure controls precisely enough to repeat the experiment.

## Prediction

Link the prediction log and summarize the expected observable evidence.

## Procedure

List the execution actions in order. Include when evidence is collected and when the failure is injected.

## Actual observation

Record database rows, process results, request outcomes, and other evidence. Avoid conclusions in this section.

## Discrepancy analysis

Compare prediction and observation. State which hypothesis lost support and what ambiguity remains.

## Revised mental model

Describe the smallest model change justified by the evidence.

## Cleanup

Record the cleanup command or action and evidence that disposable state was removed.

## Next experiment

Choose the smallest experiment that addresses the most important remaining uncertainty.

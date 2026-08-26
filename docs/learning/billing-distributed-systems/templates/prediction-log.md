# Prediction Log

> **Optional tool:** Use this only when the resulting document will have future value. It is not required for progress.

Use this when a prediction can distinguish competing explanations or make an experiment more informative. Skip it when prerequisite knowledge calls for a direct explanation first.

## Scenario

Describe one specific interleaving, timeout, duplicate, reordering, or process-death point.

## Initial state

List all relevant durable and volatile state before the scenario starts.

## Timeline

| Step | Actor | Action | Durable state afterward | What each actor knows |
|---:|---|---|---|---|

## Predicted final state

State the database state, uncertain external state, visible user result, and remaining runnable work.

## Invariant prediction

Name the invariant expected to hold or fail. Explain the enforcement mechanism you believe is responsible.

## Observable evidence

List the query, log field, trace, provider record, response, or process state that would support or falsify the prediction.

## Confidence before execution

Record low, medium, or high confidence and explain the main uncertainty.

## Observation after execution

Append the result without editing the original prediction.

## Discrepancy and revised model

Explain any difference between prediction and observation. If they match, identify whether the evidence distinguishes the intended mechanism from accidental success.

# Learning Checks

These checks are conversation aids, not scores, forms, or gates. Use only the parts that help decide what to do next.

## Understanding a phenomenon

You probably understand the current phenomenon well enough when you can:

- explain what was observed in your own words;
- distinguish what the observation proves from what it merely suggests;
- identify the boundary where the behavior arises;
- predict one meaningfully different case, when prediction adds value;
- name an uncertainty that still matters.

If one of these is fuzzy, choose the smallest useful response: a direct explanation, one source, a tiny disposable experiment, or inspection of the relevant production code.

## Changing production safely

Before making a production change, answer:

1. What failure does it prevent?
2. Where does the guarantee come from?
3. What does it not protect against?

Then choose the lowest-cost test that could disprove the guarantee. Add rollout and recovery planning only when the change can leave persistent data or deployed versions in incompatible states.

## When to stay or move

Stay with the current question while an unresolved uncertainty blocks safe action or hides the mechanism you are trying to learn.

Move on when you can use the idea safely and explain its important limits. You do not need polished notes, complete vocabulary, or a finished trail. Return later when another production problem gives the idea more depth.

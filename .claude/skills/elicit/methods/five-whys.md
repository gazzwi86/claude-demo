# Five Whys

Iterative root cause analysis. The skill presents the stated problem and asks "Why
does this happen?" Each iteration surfaces 3–4 plausible causal answers as MCQ.

## Process

1. State the problem clearly as the starting prompt.
2. Present 3–4 possible "why" answers via AskUserQuestion. Include one option for "None of these — let me describe it differently".
3. The user selects or types a custom answer.
4. The selected answer becomes the new problem statement for the next iteration.
5. Repeat until the user identifies a root cause they are satisfied with, or five iterations have elapsed.

## Termination

On termination, the skill summarises the full causal chain:

```
Problem → Why 1 → Why 2 → ... → Root cause
```

If five iterations complete without a clear root cause, the skill surfaces this
explicitly: "We reached five iterations without a definitive root cause. The deepest
cause so far is: <last answer>. Continue or accept this as the working root cause?"

## Notes

- Keep each "why" answer to one sentence.
- Do not suggest solutions — only causes.
- If two plausible causes are equally valid, list both and ask which to investigate first.

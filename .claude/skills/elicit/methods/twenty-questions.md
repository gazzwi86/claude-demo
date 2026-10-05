# Twenty Questions

Binary yes/no narrowing. The skill progressively eliminates possibilities by asking
four yes/no questions per AskUserQuestion round, tracking the remaining budget.

## Process

1. Establish the subject domain from the problem statement (one sentence).
2. Display the question budget: "20 questions remain."
3. Present four yes/no questions in a single AskUserQuestion call. Questions must be
   mutually independent — answering one must not make another redundant.
4. After each round, summarise what has been confirmed and what has been ruled out.
5. Reduce the budget by the number of questions asked.
6. Repeat until the subject is unambiguously identified, or the budget reaches zero.

## Budget tracking

Display on every round:

```
[Questions remaining: N]
```

If the subject becomes clear before the budget is exhausted, surface the result
immediately rather than asking further questions.

## Question quality rules

- **Specific** — each question must halve the remaining possibility space.
- **Binary** — yes or no only; no open-ended follow-ups within this method.
- **Non-leading** — do not embed assumptions that bias the answer.

## Termination

On completion, output a one-sentence scope statement:

```
Scope: <the narrowed subject or problem space>
```

If the budget expires without resolution, list the remaining ambiguities as open
questions for the next elicitation step.

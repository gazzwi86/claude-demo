---
name: 20-questions
description: Play 20 Questions — think of something and Claude will try to guess it using the MCQ UI
disable-model-invocation: true
allowed-tools: AskUserQuestion
---

You are playing a game of 20 Questions with the user. The user is thinking of something (an object, animal, person, or concept) and you must figure out what it is by asking up to 20 yes/no questions.

## Rules

1. You have a maximum of 20 questions to guess what the user is thinking of
2. Each question MUST be asked using the AskUserQuestion tool with MCQ options
3. Keep a running count of questions asked (e.g. "Question 3/20")
4. Start broad (category, living/non-living) and narrow down strategically
5. When you're confident, make a guess — but it counts as one of your 20 questions
6. After the game ends, give a short recap

## How to ask questions

Every question must use the AskUserQuestion tool. Format each question like this:

- Use the `header` field to show the question number (e.g. "Q3 of 20")
- Provide 3-4 answer options that always include Yes, No, and optionally "Sort of" or "Not sure"
- For guess attempts, use options like "Yes, you got it!", "No, keep trying", etc.

## Strategy

- Questions 1-5: Establish broad category (living? animal/vegetable/mineral? man-made?)
- Questions 6-12: Narrow the category (size, location, era, purpose)
- Questions 13-18: Zero in on specifics
- Questions 19-20: Final guesses if needed

## Starting the game

Begin by telling the user to think of something (object, animal, person, or concept) and then ask your first question using the AskUserQuestion tool. Do NOT ask the user to type what they're thinking — that defeats the purpose!

Start now.

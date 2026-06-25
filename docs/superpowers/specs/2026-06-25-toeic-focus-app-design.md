# TOEIC 800+ Focus App Design

## Purpose

Build a small online TOEIC study app for hei to review on iPhone and iPad.

The app is not meant to be a general English learning platform. It is a focused daily training tool for a 2-3 month TOEIC push, with the target line set at TOEIC 800+.

Current learning context:

- Listening is around 380.
- Reading is around the 200s.
- Grammar and vocabulary are weak because English has not been used much in daily life in Japan.
- Daily study time is usually 20-30 minutes.

Target score shape:

- Listening: 430+
- Reading: 370+
- Total: 800+

The app should feel like a clean study desk: online and updateable, but visually quiet and not distracting.

## Product Direction

Use an online PWA-style web app optimized for iPhone and iPad.

The original "offline" request means "do not distract me", not "must work without internet". The app will therefore be online-first, but the learning screen will use Focus Mode:

- no social links
- no external links during practice
- no unnecessary buttons
- one question or one task step at a time
- statistics shown after the daily task, not during every question

The first version will not include account login. Progress will be saved in the same browser using local storage. Cross-device sync can be added later if needed.

## Main Screens

### Today

The landing screen shows the current weekly cycle and today's 20-30 minute task.

Daily task content:

- 10 TOEIC vocabulary items
- 8 Part 5 grammar questions
- 1 short reading passage with 2 questions

The main action is "Start Focus Practice".

### Focus Practice

The core practice screen shows one question or one small task step at a time.

For iPhone, this is a single-column flow.

For iPad, the layout can use two columns after an answer is submitted:

- left: question and answer choices
- right: explanation and error tag

Explanations should be short and plain:

- Traditional Chinese explanation
- Japanese keyword or gloss where useful
- error category such as word form, tense, preposition, conjunction, vocabulary, or reading detail

### Practice

This screen allows free practice outside the daily task.

Categories:

- Vocabulary
- Part 5 Grammar
- Short Reading

This is optional use. The app should still work well if hei only uses the Today task.

### Mistakes

Wrong answers are automatically saved.

Each saved mistake keeps:

- question id
- selected answer
- correct answer
- error category
- date answered
- number of later correct reviews

When the same item is answered correctly twice in review, it can be marked as mastered.

### Progress

The progress screen shows:

- completed days
- current weekly cycle
- vocabulary accuracy
- grammar accuracy
- reading accuracy
- weakest error categories
- 7-day difficulty recommendation

The progress screen should not be shown during Focus Practice unless the daily task is complete.

## 7-Day Difficulty Adjustment

The app works in weekly cycles.

Day 1-6:

- normal daily practice

Day 7:

- weekly check and summary

After each 7-day block, the app chooses next week's emphasis based on the previous week's results.

Rules:

- 80%+ average accuracy: increase difficulty
- 60-79% average accuracy: keep difficulty and increase the weakest category
- below 60% average accuracy: reduce difficulty and rebuild basics

Difficulty changes can affect:

- grammar question level
- answer choice similarity
- sentence length
- reading passage length
- time pressure
- number of questions from weak categories

The app does not need AI-generated questions in version 1. Instead, questions will be stored with tags, and the app will select suitable questions based on tags.

## Question Data Model

Questions should be stored as structured JSON files for version 1.

Vocabulary item fields:

- id
- word
- zh meaning
- ja meaning
- example sentence
- level
- tags

Grammar question fields:

- id
- prompt
- choices
- correct answer
- explanation zh
- explanation ja
- category
- level
- tags

Reading passage fields:

- id
- passage
- questions
- choices
- correct answers
- explanations
- level
- tags

Useful tags:

- word-form
- tense
- preposition
- conjunction
- relative-pronoun
- comparison
- vocabulary
- reading-detail
- inference
- business-email
- notice
- order-message

## Local Progress Data

Progress can be saved in local storage in version 1.

Saved state:

- completed daily tasks
- current week number
- question attempt history
- mistake list
- mastered mistake ids
- weekly summary snapshots
- preferred difficulty level

Because there is no login in version 1, iPhone and iPad progress will be separate unless the same browser storage is shared. This is acceptable for the first version.

## Responsive Design

iPhone:

- single-column layout
- bottom tabs
- large touch targets
- one primary action per screen
- Focus Practice hides navigation until the current question is answered or the task is paused

iPad:

- wider layout
- practice answer and explanation can be side by side
- Today and Progress can show compact summary panels

Avoid a landing page. The first screen should be the usable Today screen.

## Initial Content Scope

Version 1 should include enough real content to make the app useful immediately.

Initial target:

- at least 7 days of daily tasks
- tagged grammar questions for the core weak areas
- vocabulary suitable for TOEIC business contexts
- short reading passages using TOEIC-like formats

The architecture should support adding more questions later without changing the app logic.

## Error Handling

If question data cannot load:

- show a simple message that the question set failed to load
- allow retry
- do not lose saved progress

If local storage is unavailable:

- allow practice to continue
- show a clear warning that progress cannot be saved on this device

If a user exits during Focus Practice:

- save completed answers
- resume from the next unfinished question when possible

## Testing

Manual checks:

- iPhone-width layout
- iPad-width layout
- Today task flow
- answer checking
- explanation display
- mistake saving
- mistake review
- weekly summary calculation
- difficulty recommendation after sample data
- refresh page and confirm progress remains

Implementation checks:

- question data validates required fields
- scoring rules calculate correctly
- 7-day recommendation handles low, medium, and high score cases
- local storage read/write works without breaking the page

Visual checks:

- no overlapping text on small iPhone width
- buttons are easy to tap
- Focus Practice does not expose distracting navigation
- iPad two-column layout remains readable

## Future Enhancements

Later versions can add:

- login and cross-device sync
- cloud-hosted question updates
- AI-generated weak-point practice
- TOEIC mock test mode
- exportable weekly report
- listening practice module

These are out of scope for version 1.

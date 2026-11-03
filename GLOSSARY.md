# Code Gym

A single-user practice tool: annotated markdown notes become fill-in-the-blank coding drills with staged hints, and each completed drill is saved as an attempt.

## Language

**Note**:
A markdown file of annotated code snippets explaining a programming concept. The source a Practice is generated from.
_Avoid_: Doc, lesson, tutorial

**Practice**:
The bundle generated from one Note: a Soal, a Scaffold, and the Solutions for its Todos.
_Avoid_: Exercise, drill, challenge, kata

**Soal**:
The inferred question stating what the finished Scaffold must achieve.
_Avoid_: Question, goal, prompt, task

**Scaffold**:
The incomplete code the user fills in. Contains Todo markers followed by empty lines.
_Avoid_: Incomplete code, template, skeleton, starter

**Todo**:
One staged step inside a Scaffold, identified by a numbered marker comment. Has one Hint and one Solution.
_Avoid_: Stage, step, section, blank

**Hint**:
A nudge toward a Todo's Solution that does not contain the code.
_Avoid_: Tip, clue

**Solution**:
The code that completes one Todo.
_Avoid_: Answer, reveal (reveal is the action of showing a Solution)

**Attempt**:
One submitted fill of a Scaffold, numbered per Practice, recording the code and which Hints and Solutions were revealed.
_Avoid_: Submission, run, try

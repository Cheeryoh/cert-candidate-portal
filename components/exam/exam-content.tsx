'use client'

import { useState, useTransition } from 'react'
import { submitExam } from '@/app/(portal)/exam/[attemptId]/actions'

interface Question {
  text: string
  options: string[]
  correctIndex: number
}

const QUESTIONS: Question[] = [
  {
    text: 'What is the primary benefit of using structured output formats (JSON/XML) when prompting AI models?',
    options: [
      'Reduces token cost',
      'Enables reliable downstream parsing and integration',
      'Improves model creativity',
      'Bypasses content filters',
    ],
    correctIndex: 1,
  },
  {
    text: 'Which technique is most effective for reducing hallucinations in AI-generated content?',
    options: [
      'Increasing temperature',
      'Grounding responses with retrieved context (RAG)',
      'Using shorter prompts',
      'Disabling safety filters',
    ],
    correctIndex: 1,
  },
  {
    text: 'When should you use a system prompt vs a user-turn prompt?',
    options: [
      'System prompts are only for API access',
      'System prompts set persistent context and instructions; user turns handle per-request input',
      'They are interchangeable with no difference',
      'User turns are always processed first regardless',
    ],
    correctIndex: 1,
  },
  {
    text: "What does 'Constitutional AI' primarily address?",
    options: [
      'Model compression techniques',
      'Aligning AI behaviour with a set of guiding principles',
      'Reducing inference latency',
      'Encrypting training data',
    ],
    correctIndex: 1,
  },
  {
    text: 'In a multi-agent pipeline, what is the role of an orchestrator agent?',
    options: [
      'Execute all tasks sequentially without delegation',
      'Coordinate sub-agents, manage task flow, and aggregate results',
      'Store conversation history only',
      'Handle authentication between API calls',
    ],
    correctIndex: 1,
  },
]

// Default selections: Q1–Q4 correct (index 1), Q5 wrong (index 0)
const DEFAULT_SELECTIONS = [1, 1, 1, 1, 0]

interface ExamContentProps {
  attemptId: string
  attemptNumber: number
  startedAt: string | null
  certName: string
  certCode: string
  passingScore: number
}

export function ExamContent({
  attemptId,
  attemptNumber,
  startedAt,
  certName,
  certCode,
  passingScore,
}: ExamContentProps) {
  const [selections, setSelections] = useState<number[]>(DEFAULT_SELECTIONS)
  const [isPending, startTransition] = useTransition()

  function handleSelect(questionIndex: number, optionIndex: number) {
    setSelections((prev) => {
      const next = [...prev]
      next[questionIndex] = optionIndex
      return next
    })
  }

  function handleSubmit() {
    const correct = selections.filter(
      (sel, i) => sel === QUESTIONS[i].correctIndex,
    ).length
    const score = Math.round((correct / QUESTIONS.length) * 100)

    startTransition(async () => {
      await submitExam(attemptId, score)
    })
  }

  const startedLabel = startedAt
    ? new Date(startedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—'

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-xs font-mono text-muted-foreground">{certCode}</p>
            <h1 className="mt-1 text-xl font-semibold text-foreground">
              {certName}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Attempt {attemptNumber} &middot; Started {startedLabel} &middot; Pass ≥{' '}
              {passingScore}%
            </p>
          </div>
          <span className="rounded-md border border-yellow-300 bg-yellow-50 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
            In Progress
          </span>
        </div>
      </div>

      {/* Questions */}
      <ol className="space-y-6">
        {QUESTIONS.map((q, qi) => (
          <li
            key={qi}
            className="rounded-lg border border-border bg-card p-5"
          >
            <p className="mb-3 text-sm font-medium text-foreground">
              <span className="mr-2 font-mono text-muted-foreground">
                Q{qi + 1}.
              </span>
              {q.text}
            </p>
            <ul className="space-y-2">
              {q.options.map((opt, oi) => {
                const isSelected = selections[qi] === oi
                return (
                  <li key={oi}>
                    <label
                      className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2.5 text-sm transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border bg-background text-muted-foreground hover:border-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${qi}`}
                        value={oi}
                        checked={isSelected}
                        onChange={() => handleSelect(qi, oi)}
                        className="mt-0.5 accent-primary"
                        disabled={isPending}
                      />
                      <span>{opt}</span>
                    </label>
                  </li>
                )
              })}
            </ul>
          </li>
        ))}
      </ol>

      {/* Submit */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">
          {selections.filter((s) => s !== -1).length} / {QUESTIONS.length}{' '}
          questions answered
        </p>
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? 'Submitting…' : 'Submit Exam'}
        </button>
      </div>
    </div>
  )
}

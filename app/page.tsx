"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";

type Counter = {
  id: string;
  name: string;
  target: number;
  current: number;
  monthly: number;
};

type CounterInput = Omit<Counter, "id">;

type GoalStats = {
  completed: boolean;
  etaLabel: string;
  hasTarget: boolean;
  monthsLeft: number | null;
  percent: number;
  remaining: number;
};

type GoalDraft = {
  name: string;
  target: string;
  current: string;
  monthly: string;
};

type StoredCounters = {
  canPersist: boolean;
  counters: Counter[];
  showExamplePrompt: boolean;
};

const STORAGE_KEY = "MoneyForges-v3";
const GITHUB_URL = "https://github.com/lambdaf-org/MoneyForge";

const defaultDraft: GoalDraft = {
  name: "",
  target: "1000",
  current: "0",
  monthly: "100",
};

const exampleCounters: Counter[] = [
  {
    id: "freedom-fund",
    name: "Freedom Fund",
    target: 30000,
    current: 12400,
    monthly: 3000,
  },
  {
    id: "app-launch",
    name: "App Launch",
    target: 10000,
    current: 4800,
    monthly: 2600,
  },
  {
    id: "emergency-fund",
    name: "Emergency Fund",
    target: 8000,
    current: 8000,
    monthly: 1000,
  },
];

const currencyFormatter = new Intl.NumberFormat("de-CH", {
  currency: "CHF",
  currencyDisplay: "code",
  maximumFractionDigits: 0,
  style: "currency",
});

export default function Home() {
  const [counters, setCounters] = useState<Counter[]>([]);
  const [canPersist, setCanPersist] = useState(false);
  const [showExamplePrompt, setShowExamplePrompt] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    function syncStoredCounters() {
      const stored = readStoredCounters();

      setCounters(stored.counters);
      setCanPersist(stored.canPersist);
      setShowExamplePrompt(stored.showExamplePrompt);
    }

    function handleStorage(event: StorageEvent) {
      if (event.key !== STORAGE_KEY && event.key !== null) return;
      syncStoredCounters();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        syncStoredCounters();
      }
    }

    syncStoredCounters();

    window.addEventListener("focus", syncStoredCounters);
    window.addEventListener("storage", handleStorage);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", syncStoredCounters);
      window.removeEventListener("storage", handleStorage);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (!canPersist) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(counters));
  }, [canPersist, counters]);

  const summary = useMemo(() => {
    const saved = counters.reduce(
      (sum, counter) => sum + toFiniteNumber(counter.current),
      0
    );
    const target = counters.reduce(
      (sum, counter) => sum + toFiniteNumber(counter.target),
      0
    );
    const done = counters.filter((counter) => getGoalStats(counter).completed)
      .length;
    const progress = target > 0 ? clamp((saved / target) * 100, 0, 100) : 0;
    const remaining = target > 0 ? Math.max(target - saved, 0) : 0;

    return {
      done,
      goals: counters.length,
      progress,
      remaining,
      saved,
      target,
    };
  }, [counters]);

  function addCounter(input: CounterInput) {
    const newCounter: Counter = {
      ...input,
      id: createId("goal"),
      name: input.name.trim() || "New Counter",
    };

    setCounters((prev) => [newCounter, ...prev]);
    setCanPersist(true);
    setShowExamplePrompt(false);
    setShowForm(false);
  }

  function startEmpty() {
    setCounters([]);
    setCanPersist(true);
    setShowExamplePrompt(false);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  }

  function loadExamples() {
    setCounters(exampleCounters);
    setCanPersist(true);
    setShowExamplePrompt(false);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(exampleCounters));
  }

  function updateCounter(id: string, updates: Partial<Counter>) {
    setCounters((prev) =>
      prev.map((counter) =>
        counter.id === id ? { ...counter, ...updates } : counter
      )
    );
  }

  function deleteCounter(id: string) {
    setCounters((prev) => prev.filter((counter) => counter.id !== id));
  }

  function confirmReset() {
    setCounters([]);
    setCanPersist(false);
    setShowExamplePrompt(true);
    setShowForm(false);
    setShowResetConfirm(false);
    window.localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <main className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <AppHeader summary={summary} />

      <section className="mx-auto max-w-[1080px] px-[1.6rem] py-6 sm:py-8">
        <WorkbenchHeader
          goals={summary.goals}
          onReset={() => setShowResetConfirm(true)}
          onToggleForm={() => setShowForm((prev) => !prev)}
          showForm={showForm}
        />
        <SummaryPanel summary={summary} />

        {showExamplePrompt && (
          <ExamplePrompt
            onLoadExamples={loadExamples}
            onStartEmpty={startEmpty}
          />
        )}

        {showForm && (
          <div className="mt-6 border-y border-[var(--rule)] bg-[var(--paper-2)] px-4 py-5 sm:px-5">
            <GoalForm onAdd={addCounter} onCancel={() => setShowForm(false)} />
          </div>
        )}

        <div className="mt-7">
          <section
            id="counters"
            aria-labelledby="counters-heading"
          >
            <div className="mb-4 flex items-end justify-between gap-4 border-b border-[var(--rule)] pb-3">
              <div>
                <p className="kicker">Goals</p>
                <h2 id="counters-heading" className="sr-only">
                  Counters
                </h2>
              </div>
              <p className="mono text-[0.68rem] uppercase tracking-[0.14em] text-[var(--meta)]">
                {summary.goals} {summary.goals === 1 ? "goal" : "goals"}
              </p>
            </div>

            <div>
              {counters.length > 0 ? (
                counters.map((counter, index) => (
                  <GoalRow
                    key={counter.id}
                    counter={counter}
                    index={index}
                    onDelete={deleteCounter}
                    onUpdate={updateCounter}
                  />
                ))
              ) : (
                <EmptyState />
              )}
            </div>
          </section>
        </div>
      </section>

      <ToolFooter />

      {showResetConfirm && (
        <ResetConfirmDialog
          goalCount={summary.goals}
          onCancel={() => setShowResetConfirm(false)}
          onConfirm={confirmReset}
        />
      )}
    </main>
  );
}

function ToolFooter() {
  return (
    <footer className="mx-auto max-w-[1080px] px-[1.6rem] pb-8 pt-1 text-[0.82rem] leading-[1.55] text-[var(--muted)] sm:pb-10">
      <p>
        Everything stays in your browser&apos;s local storage — no accounts, no
        upload. MoneyForge saves your counters on this device only; reset clears
        the stored goals from this browser.
      </p>
      <p className="mt-2">
        A MoneyForge tool ·{" "}
        <a
          className="transition hover:text-[var(--red)]"
          href={GITHUB_URL}
          rel="noreferrer"
          target="_blank"
        >
          open source
        </a>
      </p>
    </footer>
  );
}

function AppHeader({
  summary,
}: {
  summary: {
    done: number;
    goals: number;
    progress: number;
    remaining: number;
    saved: number;
    target: number;
  };
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--rule)] bg-[rgba(250,246,238,0.92)] backdrop-blur">
      <div className="mx-auto flex max-w-[1080px] items-center justify-between gap-3 px-4 py-3 sm:px-[1.6rem]">
        <a
          href="https://lambdaf.org/"
          className="slab text-[1.05rem] font-bold tracking-[0.06em]"
        >
          LAMBDAFORGE
        </a>

        <nav
          aria-label="Primary"
          className="mono flex items-center gap-2 text-[0.66rem] uppercase tracking-[0.08em] text-[var(--muted)] sm:gap-6 sm:text-[0.72rem]"
        >
          <a
            className="whitespace-nowrap transition hover:text-[var(--red)]"
            href="#counters"
          >
            {Math.round(summary.progress)}%
          </a>
          <a
            className="whitespace-nowrap border border-[var(--ink)] px-2.5 py-1.5 text-[var(--ink)] transition hover:bg-[var(--ink)] hover:text-[var(--paper)] sm:px-3"
            href={GITHUB_URL}
            rel="noreferrer"
            target="_blank"
          >
            GitHub ↗
          </a>
        </nav>
      </div>
    </header>
  );
}

function WorkbenchHeader({
  goals,
  onReset,
  onToggleForm,
  showForm,
}: {
  goals: number;
  onReset: () => void;
  onToggleForm: () => void;
  showForm: boolean;
}) {
  return (
    <div className="mb-5 grid gap-4 border-b-2 border-[var(--ink)] pb-4 sm:grid-cols-[1fr_auto] sm:items-end">
      <div>
        <p className="kicker">MoneyForge</p>
        <h1 className="mt-2 text-[clamp(2rem,5vw,3.4rem)] leading-[1] tracking-[-0.02em]">
          Counters
        </h1>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <Tag>
          {goals} {goals === 1 ? "GOAL" : "GOALS"}
        </Tag>
        <button
          className="mono border border-[var(--red)] px-4 py-2 text-[0.74rem] uppercase tracking-[0.08em] text-[var(--red)] transition hover:bg-[var(--red)] hover:text-[var(--paper)]"
          onClick={onReset}
          type="button"
        >
          Reset
        </button>
        <button
          className="mono border border-[var(--ink)] bg-[var(--ink)] px-4 py-2 text-[0.74rem] uppercase tracking-[0.08em] text-[var(--paper)] transition hover:border-[var(--red)] hover:bg-[var(--red)]"
          onClick={onToggleForm}
          type="button"
        >
          {showForm ? "Close" : "Add goal"}
        </button>
      </div>
    </div>
  );
}

function SummaryPanel({
  summary,
}: {
  summary: {
    done: number;
    goals: number;
    progress: number;
    remaining: number;
    saved: number;
    target: number;
  };
}) {
  return (
    <section
      aria-labelledby="summary-heading"
      className="border-b border-[var(--rule)] pb-4"
    >
      <h2 id="summary-heading" className="sr-only">
        Summary
      </h2>
      <div className="grid grid-cols-2 border-y border-[var(--rule)] sm:grid-cols-5">
        <SummaryMetric label="Saved" value={formatCurrency(summary.saved)} />
        <SummaryMetric label="Target" value={formatCurrency(summary.target)} />
        <SummaryMetric
          label="Amount left"
          value={formatCurrency(summary.remaining)}
        />
        <SummaryMetric label="Done" value={`${summary.done}`} />
        <SummaryMetric
          label="Progress"
          value={`${Math.round(summary.progress)}%`}
        />
      </div>
      <ProgressBar value={summary.progress} compact />
    </section>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-[var(--rule)] py-3 pr-3 sm:border-b-0 sm:border-l sm:px-4 sm:first:border-l-0">
      <p className="mono text-[0.66rem] uppercase tracking-[0.14em] text-[var(--meta)]">
        {label}
      </p>
      <p className="slab mt-1 text-lg font-bold leading-tight [overflow-wrap:anywhere]">
        {value}
      </p>
    </div>
  );
}

function ExamplePrompt({
  onLoadExamples,
  onStartEmpty,
}: {
  onLoadExamples: () => void;
  onStartEmpty: () => void;
}) {
  return (
    <section className="mt-6 grid gap-4 border-y border-[var(--rule)] bg-[var(--paper-2)] px-4 py-5 sm:grid-cols-[1fr_auto] sm:items-center sm:px-5">
      <div>
        <p className="kicker">First run</p>
        <h2 className="mt-2 text-2xl leading-tight">Start with examples?</h2>
      </div>
      <div className="flex flex-wrap gap-2 sm:justify-end">
        <button
          className="mono border border-[var(--ink)] bg-[var(--ink)] px-4 py-2 text-[0.74rem] uppercase tracking-[0.08em] text-[var(--paper)] transition hover:border-[var(--red)] hover:bg-[var(--red)]"
          onClick={onStartEmpty}
          type="button"
        >
          Start empty
        </button>
        <button
          className="mono border border-[var(--rule-strong)] px-4 py-2 text-[0.74rem] uppercase tracking-[0.08em] text-[var(--ink)] transition hover:border-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)]"
          onClick={onLoadExamples}
          type="button"
        >
          Add examples
        </button>
      </div>
    </section>
  );
}

function ResetConfirmDialog({
  goalCount,
  onCancel,
  onConfirm,
}: {
  goalCount: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      aria-labelledby="reset-dialog-title"
      aria-modal="true"
      className="fixed inset-0 z-[60] grid place-items-center bg-[rgba(28,28,28,0.28)] px-4"
      role="dialog"
    >
      <div className="w-full max-w-[520px] border-2 border-[var(--ink)] bg-[var(--paper)] shadow-[8px_8px_0_var(--ink)]">
        <div className="border-b border-[var(--rule)] px-5 py-4">
          <p className="kicker">Reset</p>
          <h2
            id="reset-dialog-title"
            className="mt-3 text-[clamp(1.7rem,4vw,2.4rem)] leading-none"
          >
            Clear all counters?
          </h2>
        </div>

        <div className="px-5 py-5">
          <p className="text-[1.05rem] leading-[1.5] text-[var(--ink-2)]">
            This removes {goalCount} {goalCount === 1 ? "goal" : "goals"} from
            this browser and clears the saved localStorage entry.
          </p>
          <p className="mono mt-4 border-l-2 border-[var(--red)] pl-3 text-[0.72rem] uppercase tracking-[0.1em] text-[var(--meta)]">
            The action cannot be undone.
          </p>
        </div>

        <div className="flex flex-col gap-2 border-t border-[var(--rule)] px-5 py-4 sm:flex-row sm:justify-end">
          <button
            className="mono border border-[var(--rule-strong)] px-4 py-3 text-[0.74rem] uppercase tracking-[0.08em] text-[var(--ink)] transition hover:border-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)]"
            onClick={onCancel}
            type="button"
          >
            Keep counters
          </button>
          <button
            className="mono border border-[var(--red)] bg-[var(--red)] px-4 py-3 text-[0.74rem] uppercase tracking-[0.08em] text-[var(--paper)] transition hover:border-[var(--red-deep)] hover:bg-[var(--red-deep)]"
            onClick={onConfirm}
            type="button"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

function GoalForm({
  onAdd,
  onCancel,
}: {
  onAdd: (counter: CounterInput) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<GoalDraft>(defaultDraft);

  function updateDraft(field: keyof GoalDraft, value: string) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    onAdd({
      current: toFiniteNumber(draft.current),
      monthly: toFiniteNumber(draft.monthly),
      name: draft.name,
      target: toFiniteNumber(draft.target),
    });

    setDraft(defaultDraft);
  }

  return (
    <form
      aria-labelledby="add-goal-heading"
      className="grid gap-5 lg:grid-cols-[180px_1fr_auto] lg:items-end"
      onSubmit={handleSubmit}
    >
      <div>
        <p className="kicker">Add a goal</p>
        <h2 id="add-goal-heading" className="mt-2 text-2xl leading-tight">
          New counter
        </h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <EditField
          label="Name"
          onChange={(value) => updateDraft("name", value)}
          placeholder="New Counter"
          type="text"
          value={draft.name}
        />
        <EditField
          label="Target amount"
          onChange={(value) => updateDraft("target", value)}
          value={draft.target}
        />
        <EditField
          label="Current amount"
          onChange={(value) => updateDraft("current", value)}
          value={draft.current}
        />
        <EditField
          label="Monthly contribution"
          onChange={(value) => updateDraft("monthly", value)}
          value={draft.monthly}
        />
      </div>

      <div className="flex gap-2 lg:flex-col">
        <button
          className="mono flex-1 border border-[var(--ink)] bg-[var(--ink)] px-4 py-3 text-[0.74rem] uppercase tracking-[0.08em] text-[var(--paper)] transition hover:border-[var(--red)] hover:bg-[var(--red)]"
          type="submit"
        >
          Add
        </button>
        <button
          className="mono flex-1 border border-[var(--rule-strong)] px-4 py-3 text-[0.74rem] uppercase tracking-[0.08em] text-[var(--muted)] transition hover:border-[var(--ink)] hover:text-[var(--ink)]"
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function GoalRow({
  counter,
  index,
  onDelete,
  onUpdate,
}: {
  counter: Counter;
  index: number;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Counter>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const stats = getGoalStats(counter);
  const goalName = counter.name.trim() || "Untitled goal";

  function addMoney(amount: number) {
    onUpdate(counter.id, {
      current: Math.max(toFiniteNumber(counter.current) + amount, 0),
    });
  }

  return (
    <article className="group relative border-t border-[var(--rule)] px-1 py-6 transition hover:bg-[var(--red-tint)] sm:px-3">
      <div
        aria-hidden="true"
        className="absolute bottom-[-1px] left-0 top-[-1px] w-0 bg-[var(--red)] transition-all group-hover:w-[3px]"
      />

      <div className="relative min-w-0 space-y-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_8rem] lg:items-start">
          <div className="flex min-w-0 gap-4">
            <p className="slab shrink-0 text-[1.7rem] font-bold leading-none text-[var(--red)]">
              {String(index + 1).padStart(2, "0")}
            </p>
            <div className="min-w-0">
              {editing ? (
                <input
                  aria-label="Goal name"
                  className="slab w-full border-b border-[var(--rule-strong)] bg-transparent pb-1 text-[clamp(1.45rem,3vw,2rem)] font-bold leading-tight text-[var(--ink)] outline-none transition focus:border-[var(--red)]"
                  onChange={(event) =>
                    onUpdate(counter.id, { name: event.target.value })
                  }
                  placeholder="Goal name"
                  value={counter.name}
                />
              ) : (
                <h3 className="text-[clamp(1.45rem,3vw,2rem)] leading-tight">
                  {goalName}
                </h3>
              )}
              <p className="mt-1 max-w-[64ch] text-[1rem] leading-[1.45] text-[var(--muted)]">
                {describeProgress(counter, stats)}
              </p>
            </div>
          </div>

          <div className="border-l-2 border-[var(--red)] pl-3 lg:text-right">
            <p className="mono text-[0.64rem] uppercase tracking-[0.14em] text-[var(--meta)]">
              Progress
            </p>
            <p className="slab text-2xl font-bold leading-tight">
              {Math.round(stats.percent)}%
            </p>
          </div>
        </div>

        <ProgressBar value={stats.percent} compact />

        <div className="grid border-y border-[var(--rule)] sm:grid-cols-2 lg:grid-cols-5">
          <Metric label="Saved" value={formatCurrency(counter.current)} />
          <Metric label="Target" value={formatCurrency(counter.target)} />
          <Metric label="Amount left" value={formatCurrency(stats.remaining)} />
          <Metric label="Monthly" value={formatCurrency(counter.monthly)} />
          <Metric label="Months remaining" value={stats.etaLabel} />
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            <QuickButton label="+100" onClick={() => addMoney(100)} />
            <QuickButton label="+500" onClick={() => addMoney(500)} />
            <QuickButton label="+1000" onClick={() => addMoney(1000)} />
            <QuickButton label="-100" muted onClick={() => addMoney(-100)} />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className="mono border border-[var(--ink)] px-4 py-2 text-[0.74rem] uppercase tracking-[0.06em] transition hover:bg-[var(--ink)] hover:text-[var(--paper)]"
              onClick={() => setEditing((prev) => !prev)}
              type="button"
            >
              {editing ? "Done" : "Edit"}
            </button>
            <button
              className="mono border border-[var(--red)] px-4 py-2 text-[0.74rem] uppercase tracking-[0.06em] text-[var(--red)] transition hover:bg-[var(--red)] hover:text-[var(--paper)]"
              onClick={() => onDelete(counter.id)}
              type="button"
            >
              Delete
            </button>
          </div>
        </div>

        {editing && (
          <div className="mt-5 border border-[var(--rule-strong)] bg-[var(--paper-2)] p-4">
            <p className="mono text-[0.68rem] uppercase tracking-[0.16em] text-[var(--meta)]">
              Edit values
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <EditField
                label="Current"
                onChange={(value) =>
                  onUpdate(counter.id, { current: toFiniteNumber(value) })
                }
                value={counter.current}
              />
              <EditField
                label="Target"
                onChange={(value) =>
                  onUpdate(counter.id, { target: toFiniteNumber(value) })
                }
                value={counter.target}
              />
              <EditField
                label="Monthly"
                onChange={(value) =>
                  onUpdate(counter.id, { monthly: toFiniteNumber(value) })
                }
                value={counter.monthly}
              />
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-[var(--rule)] py-3 pr-4 last:border-b-0">
      <p className="mono text-[0.64rem] uppercase tracking-[0.14em] text-[var(--meta)]">
        {label}
      </p>
      <p className="slab mt-1 text-lg font-bold leading-tight text-[var(--ink)] [overflow-wrap:anywhere]">
        {value}
      </p>
    </div>
  );
}

function ProgressBar({
  compact = false,
  value,
}: {
  compact?: boolean;
  value: number;
}) {
  return (
    <div
      aria-label={`Progress ${Math.round(value)} percent`}
      className={`h-2 border border-[var(--rule-strong)] bg-[var(--paper-2)] ${
        compact ? "mt-3" : "mt-5"
      }`}
      role="img"
    >
      <div
        className="h-full bg-[var(--red)] transition-all"
        style={{ width: `${clamp(value, 0, 100)}%` }}
      />
    </div>
  );
}

function QuickButton({
  label,
  muted = false,
  onClick,
}: {
  label: string;
  muted?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`mono border px-3 py-2 text-[0.74rem] uppercase tracking-[0.06em] transition ${
        muted
          ? "border-[var(--rule-strong)] text-[var(--muted)] hover:border-[var(--ink)] hover:text-[var(--ink)]"
          : "border-[var(--ink)] text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)]"
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function EditField({
  label,
  onChange,
  placeholder,
  type = "number",
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "number" | "text";
  value: number | string;
}) {
  return (
    <label className="block">
      <span className="mono text-[0.66rem] uppercase tracking-[0.14em] text-[var(--meta)]">
        {label}
      </span>
      <input
        className="mt-1 w-full border border-[var(--rule-strong)] bg-[var(--paper)] px-3 py-2 text-base text-[var(--ink)] outline-none transition placeholder:text-[var(--meta)] focus:border-[var(--red)]"
        inputMode={type === "number" ? "decimal" : "text"}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </label>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="mono border border-[var(--rule)] px-1.5 py-0.5 text-[0.68rem] leading-tight text-[var(--meta)]">
      {children}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="border-y border-[var(--rule)] py-10">
      <p className="slab text-[2.1rem] font-bold leading-none text-[var(--red)]">
        00
      </p>
      <h3 className="mt-3 text-2xl">No counters yet.</h3>
      <p className="mt-2 max-w-[42ch] text-[var(--muted)]">
        Use Add goal to create one. It will be written to localStorage in this
        browser only.
      </p>
    </div>
  );
}

function getGoalStats(counter: Counter): GoalStats {
  const current = toFiniteNumber(counter.current);
  const target = toFiniteNumber(counter.target);
  const monthly = toFiniteNumber(counter.monthly);
  const hasTarget = target > 0;
  const completed = hasTarget && current >= target;
  const remaining = hasTarget ? Math.max(target - current, 0) : 0;
  const percent = hasTarget ? clamp((current / target) * 100, 0, 100) : 0;

  if (!hasTarget) {
    return {
      completed,
      etaLabel: "Set target",
      hasTarget,
      monthsLeft: null,
      percent,
      remaining,
    };
  }

  if (completed) {
    return {
      completed,
      etaLabel: "Complete",
      hasTarget,
      monthsLeft: 0,
      percent,
      remaining,
    };
  }

  if (monthly <= 0) {
    return {
      completed,
      etaLabel: "Add monthly",
      hasTarget,
      monthsLeft: null,
      percent,
      remaining,
    };
  }

  const monthsLeft = Math.ceil(remaining / monthly);

  return {
    completed,
    etaLabel: `${monthsLeft} mo`,
    hasTarget,
    monthsLeft,
    percent,
    remaining,
  };
}

function describeProgress(counter: Counter, stats: GoalStats) {
  if (!stats.hasTarget) {
    return "Set a target above zero.";
  }

  if (stats.completed) {
    return "Complete.";
  }

  if (stats.monthsLeft === null) {
    return `${formatCurrency(counter.current)} saved · add monthly contribution.`;
  }

  return `${formatCurrency(counter.current)} saved · ${formatCurrency(
    stats.remaining
  )} left · ${
    stats.monthsLeft
  } ${stats.monthsLeft === 1 ? "month" : "months"}.`;
}

function readStoredCounters(): StoredCounters {
  const saved = window.localStorage.getItem(STORAGE_KEY);

  if (saved === null) {
    return {
      canPersist: false,
      counters: [],
      showExamplePrompt: true,
    };
  }

  try {
    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return {
        canPersist: true,
        counters: [],
        showExamplePrompt: false,
      };
    }

    const counters = parsed.map(normalizeCounter).filter(isCounter);

    if (matchesExampleCounters(counters)) {
      return {
        canPersist: false,
        counters: [],
        showExamplePrompt: true,
      };
    }

    return {
      canPersist: true,
      counters,
      showExamplePrompt: false,
    };
  } catch {
    return {
      canPersist: true,
      counters: [],
      showExamplePrompt: false,
    };
  }
}

function normalizeCounter(counter: unknown): Counter | null {
  if (!counter || typeof counter !== "object") {
    return null;
  }

  const record = counter as Record<string, unknown>;

  return {
    current: toFiniteNumber(record.current),
    id: typeof record.id === "string" ? record.id : createId("saved-goal"),
    monthly: toFiniteNumber(record.monthly),
    name: typeof record.name === "string" ? record.name : "New Counter",
    target: toFiniteNumber(record.target),
  };
}

function isCounter(counter: Counter | null): counter is Counter {
  return counter !== null;
}

function matchesExampleCounters(counters: Counter[]) {
  if (counters.length !== exampleCounters.length) {
    return false;
  }

  return counters.every((counter, index) => {
    const example = exampleCounters[index];

    return (
      counter.id === example.id &&
      counter.name === example.name &&
      counter.target === example.target &&
      counter.current === example.current &&
      counter.monthly === example.monthly
    );
  });
}

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function toFiniteNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function formatCurrency(value: number) {
  return currencyFormatter.format(toFiniteNumber(value));
}

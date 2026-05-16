/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useMemo, useState } from "react";

type Accent = "blue" | "pink" | "green" | "amber";

type Counter = {
  id: string;
  name: string;
  target: number;
  current: number;
  monthly: number;
  accent: Accent;
};

const accents: Record<
  Accent,
  {
    border: string;
    text: string;
    bar: string;
    soft: string;
  }
> = {
  blue: {
    border: "border-blue-500/40",
    text: "text-blue-300",
    bar: "from-blue-400 to-emerald-400",
    soft: "bg-blue-500/10 ring-blue-500/20 hover:bg-blue-500/20",
  },
  pink: {
    border: "border-fuchsia-500/40",
    text: "text-fuchsia-300",
    bar: "from-violet-400 to-pink-400",
    soft: "bg-fuchsia-500/10 ring-fuchsia-500/20 hover:bg-fuchsia-500/20",
  },
  green: {
    border: "border-emerald-500/40",
    text: "text-emerald-300",
    bar: "from-emerald-400 to-teal-400",
    soft: "bg-emerald-500/10 ring-emerald-500/20 hover:bg-emerald-500/20",
  },
  amber: {
    border: "border-amber-500/40",
    text: "text-amber-300",
    bar: "from-amber-400 to-orange-400",
    soft: "bg-amber-500/10 ring-amber-500/20 hover:bg-amber-500/20",
  },
};

const accentCycle: Accent[] = ["blue", "pink", "green", "amber"];

const defaultCounters: Counter[] = [
  {
    id: "freedom-fund",
    name: "Freedom Fund",
    target: 30000,
    current: 12400,
    monthly: 3000,
    accent: "blue",
  },
  {
    id: "zytkow-launch",
    name: "Zytkow Launch",
    target: 10000,
    current: 4800,
    monthly: 2600,
    accent: "pink",
  },
  {
    id: "emergency-fund",
    name: "Emergency Fund",
    target: 8000,
    current: 8000,
    monthly: 1000,
    accent: "green",
  },
];

export default function Home() {
  const [counters, setCounters] = useState<Counter[]>(defaultCounters);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("money-counters-v3");

    if (saved) {
      setCounters(JSON.parse(saved));
    }

    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem("money-counters-v3", JSON.stringify(counters));
  }, [counters, loaded]);

  function addCounter() {
    const newCounter: Counter = {
      id: crypto.randomUUID(),
      name: "New Counter",
      target: 1000,
      current: 0,
      monthly: 100,
      accent: accentCycle[counters.length % accentCycle.length],
    };

    setCounters((prev) => [newCounter, ...prev]);
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

  const summary = useMemo(() => {
    const saved = counters.reduce((sum, counter) => sum + counter.current, 0);
    const target = counters.reduce((sum, counter) => sum + counter.target, 0);
    const done = counters.filter(
      (counter) => counter.target > 0 && counter.current >= counter.target
    ).length;

    const progress = target > 0 ? Math.min((saved / target) * 100, 100) : 0;

    return {
      saved,
      target,
      done,
      goals: counters.length,
      progress,
    };
  }, [counters]);

  return (
    <main className="min-h-screen bg-[#05060d] px-4 py-6 text-white sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="rounded-[2rem] border border-white/10 bg-[#101116] p-4 shadow-2xl sm:p-6 lg:p-8">
          <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">
                My Counters
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                {counters.length} active goals
              </h1>
            </div>

            <button
              onClick={addCounter}
              className="w-full rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-3 text-base font-medium text-emerald-300 transition hover:bg-emerald-500/20 sm:w-auto"
            >
              + New Counter
            </button>
          </header>

          <div className="mb-6 rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">
                  Total Progress
                </p>
                <p className="mt-1 text-xl font-semibold sm:text-2xl">
                  CHF {formatNumber(summary.saved)} / CHF{" "}
                  {formatNumber(summary.target)}
                </p>
              </div>

              <p className="text-2xl font-semibold text-emerald-300 sm:text-3xl">
                {Math.round(summary.progress)}%
              </p>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-400 via-fuchsia-400 to-emerald-400 transition-all"
                style={{ width: `${summary.progress}%` }}
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {counters.map((counter) => (
              <CounterCard
                key={counter.id}
                counter={counter}
                onUpdate={updateCounter}
                onDelete={deleteCounter}
              />
            ))}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <SummaryCard label="Saved" value={`CHF ${formatCompact(summary.saved)}`} />
            <SummaryCard label="Goals" value={String(summary.goals)} />
            <SummaryCard label="Done" value={String(summary.done)} />
          </div>
        </div>
      </section>
    </main>
  );
}

function CounterCard({
  counter,
  onUpdate,
  onDelete,
}: {
  counter: Counter;
  onUpdate: (id: string, updates: Partial<Counter>) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);

  const style = accents[counter.accent];

  const progress =
    counter.target > 0
      ? Math.min((counter.current / counter.target) * 100, 100)
      : 0;

  const remaining = Math.max(counter.target - counter.current, 0);

  const monthsLeft =
    counter.monthly > 0 ? Math.ceil(remaining / counter.monthly) : null;

  const completed = counter.target > 0 && counter.current >= counter.target;

  function addMoney(amount: number) {
    onUpdate(counter.id, {
      current: Math.max(counter.current + amount, 0),
    });
  }

  return (
    <article
      className={`rounded-[1.75rem] border ${style.border} bg-[#15161c] p-4 transition hover:-translate-y-0.5 hover:bg-[#181a21] sm:p-5`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {editing ? (
            <input
              value={counter.name}
              onChange={(e) => onUpdate(counter.id, { name: e.target.value })}
              className="w-full bg-transparent text-xl font-semibold outline-none"
              placeholder="Counter name"
            />
          ) : (
            <h2 className="truncate text-xl font-semibold">{counter.name}</h2>
          )}

          <p className="mt-1 text-sm text-neutral-500 sm:text-base">
            CHF {formatNumber(counter.current)} / CHF{" "}
            {formatNumber(counter.target)}
          </p>
        </div>

        <p className={`text-xl font-semibold ${style.text}`}>
          {Math.round(progress)}%
        </p>
      </div>

      <div className="mb-4 h-3 overflow-hidden rounded-full bg-white/5">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${style.bar} transition-all`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mb-4 flex items-center justify-between text-sm text-neutral-500">
        <span>
          {completed ? "Completed" : `Left: CHF ${formatNumber(remaining)}`}
        </span>
        <span>{completed ? "Ready" : `ETA: ${monthsLeft ?? "—"} mo`}</span>
      </div>

      <div className="mb-4 grid grid-cols-4 gap-2">
        <QuickButton label="+100" onClick={() => addMoney(100)} className={style.soft} />
        <QuickButton label="+500" onClick={() => addMoney(500)} className={style.soft} />
        <QuickButton label="+1k" onClick={() => addMoney(1000)} className={style.soft} />
        <QuickButton
          label="-100"
          onClick={() => addMoney(-100)}
          className="bg-white/5 text-neutral-300 ring-white/10 hover:bg-white/10"
        />
      </div>

      {editing && (
        <div className="mb-4 grid gap-2 sm:grid-cols-3">
          <EditField
            label="Current"
            value={counter.current}
            onChange={(value) =>
              onUpdate(counter.id, { current: Number(value) || 0 })
            }
          />
          <EditField
            label="Goal"
            value={counter.target}
            onChange={(value) =>
              onUpdate(counter.id, { target: Number(value) || 0 })
            }
          />
          <EditField
            label="Monthly"
            value={counter.monthly}
            onChange={(value) =>
              onUpdate(counter.id, { monthly: Number(value) || 0 })
            }
          />
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setEditing((prev) => !prev)}
          className="flex-1 rounded-xl bg-white/5 px-3 py-2 text-sm font-medium text-neutral-200 ring-1 ring-white/10 transition hover:bg-white/10"
        >
          {editing ? "Done" : "Edit"}
        </button>

        <button
          onClick={() => onDelete(counter.id)}
          className="rounded-xl bg-red-500/10 px-3 py-2 text-sm font-medium text-red-300 ring-1 ring-red-500/20 transition hover:bg-red-500/20"
        >
          Delete
        </button>
      </div>
    </article>
  );
}

function QuickButton({
  label,
  onClick,
  className,
}: {
  label: string;
  onClick: () => void;
  className: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-2 py-2 text-sm font-medium ring-1 transition ${className}`}
    >
      {label}
    </button>
  );
}

function EditField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/10">
      <span className="text-[10px] uppercase tracking-[0.25em] text-neutral-500">
        {label}
      </span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full bg-transparent text-sm text-white outline-none"
      />
    </label>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.03] px-5 py-4 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("de-CH").format(value);
}

function formatCompact(value: number) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }

  return String(value);
}
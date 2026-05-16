/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useMemo, useState } from "react";

type Counter = {
  id: string;
  name: string;
  target: number;
  current: number;
  monthly: number;
};

const defaultCounters: Counter[] = [
  {
    id: "default-freedom-fund",
    name: "Freedom Fund",
    target: 30000,
    current: 0,
    monthly: 3000,
  },
];

export default function Home() {
  const [counters, setCounters] = useState<Counter[]>(defaultCounters);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("money-counters");

    if (saved) {
      setCounters(JSON.parse(saved));
    }

    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem("money-counters", JSON.stringify(counters));
  }, [counters, loaded]);

  function addCounter() {
    const newCounter: Counter = {
      id: crypto.randomUUID(),
      name: "New Counter",
      target: 1000,
      current: 0,
      monthly: 100,
    };

    setCounters((prev) => [...prev, newCounter]);
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

  return (
    <main className="min-h-screen bg-black text-white p-5">
      <section className="mx-auto w-full max-w-5xl py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-zinc-500">Money Counter</p>
            <h1 className="text-4xl font-black tracking-tight">
              Goal Dashboard
            </h1>
          </div>

          <button
            onClick={addCounter}
            className="rounded-2xl bg-white px-5 py-3 font-bold text-black hover:bg-zinc-200"
          >
            + Add Counter
          </button>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {counters.map((counter) => (
            <CounterCard
              key={counter.id}
              counter={counter}
              onUpdate={updateCounter}
              onDelete={deleteCounter}
            />
          ))}
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
  const progress = useMemo(() => {
    if (counter.target <= 0) return 0;
    return Math.min((counter.current / counter.target) * 100, 100);
  }, [counter.current, counter.target]);

  const remaining = Math.max(counter.target - counter.current, 0);
  const monthsLeft =
    counter.monthly > 0 ? Math.ceil(remaining / counter.monthly) : null;

  function addMoney(amount: number) {
    onUpdate(counter.id, {
      current: Math.max(counter.current + amount, 0),
    });
  }

  return (
    <article className="rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-zinc-500">Counter</p>
          <input
            value={counter.name}
            onChange={(e) => onUpdate(counter.id, { name: e.target.value })}
            className="mt-1 w-full bg-transparent text-2xl font-bold outline-none"
          />
        </div>

        <button
          onClick={() => onDelete(counter.id)}
          className="rounded-xl bg-zinc-900 px-3 py-2 text-sm text-zinc-400 hover:bg-red-950 hover:text-red-200"
        >
          Delete
        </button>
      </div>

      <div className="mb-6">
        <div className="mb-2 flex justify-between text-sm text-zinc-400">
          <span>CHF {counter.current.toLocaleString()}</span>
          <span>CHF {counter.target.toLocaleString()}</span>
        </div>

        <div className="h-5 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-white transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="mt-3 text-4xl font-black tracking-tight">
          {progress.toFixed(1)}%
        </p>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3">
        <InfoCard label="Left" value={`CHF ${remaining.toLocaleString()}`} />
        <InfoCard
          label="ETA"
          value={monthsLeft !== null ? `${monthsLeft} mo` : "—"}
        />
      </div>

      <div className="mb-5 grid grid-cols-3 gap-2">
        <button
          onClick={() => addMoney(100)}
          className="rounded-xl bg-white px-3 py-3 text-sm font-bold text-black hover:bg-zinc-200"
        >
          +100
        </button>

        <button
          onClick={() => addMoney(500)}
          className="rounded-xl bg-white px-3 py-3 text-sm font-bold text-black hover:bg-zinc-200"
        >
          +500
        </button>

        <button
          onClick={() => addMoney(1000)}
          className="rounded-xl bg-white px-3 py-3 text-sm font-bold text-black hover:bg-zinc-200"
        >
          +1000
        </button>
      </div>

      <div className="space-y-4">
        <NumberInput
          label="Current amount"
          value={counter.current}
          onChange={(value) =>
            onUpdate(counter.id, { current: Number(value) })
          }
        />

        <NumberInput
          label="Goal amount"
          value={counter.target}
          onChange={(value) => onUpdate(counter.id, { target: Number(value) })}
        />

        <NumberInput
          label="Monthly saving"
          value={counter.monthly}
          onChange={(value) =>
            onUpdate(counter.id, { monthly: Number(value) })
          }
        />
      </div>
    </article>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-zinc-900 p-4">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm text-zinc-500">{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 outline-none focus:border-white/40"
      />
    </label>
  );
}
# MoneyForge

> Track savings goals in your browser: set a target, log what you put in, see the percent done and how many months to go.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-149eca)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-38bdf8)

Money Counter is a single-page savings-goal tracker built with Next.js. Add a goal with a name, target amount, current amount, and monthly contribution, then watch each card show its percent complete and an estimated months-to-go. Everything lives in your browser via localStorage. No backend, no accounts, no sign-up.

## Quickstart

```bash
git clone https://github.com/lambdaf-org/MoneyForge.git
cd money-counter
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

- **Goal cards** Each goal tracks a name, target, current amount, and monthly contribution.
- **Live progress** Per-goal percent complete plus a bar, with a combined total across every goal.
- **Months-to-go ETA** Estimated as remaining amount divided by your monthly contribution, rounded up.
- **Quick edits** One-tap buttons add +100, +500, +1k or subtract -100 from a goal.
- **Inline editing** Toggle Edit to set the current, goal, and monthly values directly on a card.
- **At-a-glance summary** Totals for amount saved, number of goals, and goals finished.
- **Color accents** Four accent themes cycle automatically as you add goals.
- **Local persistence** Goals are saved to browser localStorage, so they stay between visits.

## How it works

The whole app is the client component in `app/page.tsx`. Goals are held in React state and mirrored to the `money-counters-v3` localStorage key on every change, then loaded back on the next visit. Amounts display in CHF using the `de-CH` number format. A goal counts as done once its current amount reaches its target.

## Commands

```bash
npm run dev     # start the dev server at http://localhost:3000
npm run build   # production build
npm run start   # serve the production build
npm run lint    # run ESLint
```

## Contributing

Lambdaforge is open source and contributions are welcome. Start with the [contributor guide](https://github.com/lambdaf-org/contributing), and see the org-wide [CONTRIBUTING](https://github.com/lambdaf-org/.github/blob/main/CONTRIBUTING.md) and [Code of Conduct](https://github.com/lambdaf-org/.github/blob/main/CODE_OF_CONDUCT.md).

## License

This repository does not yet include a `LICENSE` file, so default copyright applies for now. A license is coming soon. If you want to use or build on this before then, please open an issue.

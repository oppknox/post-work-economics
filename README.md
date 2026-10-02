# The Ownership Dividend

Concept site for **Post-Work Economics**. Public title: **The Ownership Dividend**.

A single-page vision argument: when humanoid labor arrives at industrial scale, a $3,000–$5,000 monthly stipend for American adults cannot be taxed out of robot profits. The funding base is a citizen ownership stake — a sovereign wealth fund that accumulates shares as robots deploy — with a thinner income tax, a shift onto capital and land, wage insurance for the transition decade, and a hard stop on the government operating the machines.

Repository name stays `post-work-economics`.

## Thesis, locked

Sean Knox’s planning case:

- 10 million robots ≈ 5 million worker-equivalents ≈ 3% of a 170 million US labor force.
- 1 billion robots globally, ~20% US share → 200 million robots ≈ 100 million worker-equivalents ≈ 0.59× human labor.
- Robot value added ≈ $10.2 trillion a year on top of $17.4 trillion in current labor income. The exact identity in the model is $10.24 trillion.
- Robot profit ≈ $6 trillion a year, which is $30,000 per US robot.
- A $3,000 / month stipend × 260 million adults = $9.36 trillion / year (about $9.4T). $5,000 / month = $15.6 trillion. The target is **$3–5k, not $1k**.
- A 10–20% tax on robot profits raises $0.6–1.2 trillion, about 6–13% of the $3,000 stipend. Taxation alone cannot fund it.
- A Norway-style fund scaled to ~$60 trillion, paying a 5% dividend, yields ~$3 trillion a year — about $960 per adult per month, and the right instrument at the first industrial scale. Funding the full $3,000 nominal stipend at that yield takes a fund near $187 trillion, or a larger fleet whose profit citizens own.
- Income tax gets thin. The durable bases are robot ownership, capital gains, and land value. If robots cut costs 50–80%, tax real output and wealth, because nominal receipts can shrink while real output rises.
- Transition insurance (wage insurance, retraining) covers the displacement decade.
- Anti-pattern: the state owns and operates the robots.

The calculator is seeded to 200 million US robots, $3,000 / month, a 20% profits tax, 50% citizen ownership, and a 5% yield (the $60T fund).

## Develop

```bash
npm install
npm test
npm run dev
npm run build
npm run preview
```

`npm test` checks the planning identities. `npm run build` typechecks and writes `dist/`.

## Deploy

Staging is a Cloudflare Pages `*.pages.dev` hostname. Do not attach a custom domain from this repo.

```bash
npm run build
npx wrangler pages deploy dist --project-name post-work-economics
```

If the Pages project is connected to Git later:

- Build command: `npm run build`
- Output directory: `dist`

The build sets `noindex` in the HTML robots meta, `public/robots.txt`, and a `X-Robots-Tag` response header.

This environment did not have Cloudflare deploy credentials, so the live Pages URL is not published from here. Run the command above from an authenticated Wrangler session.

## Art

Grok Imagine was not available to this agent. Illustrations are custom SVG and CSS. Sean can drop generated images into `public/art/` later (from the Grok app, or a later pipeline) and swap them in beside the plates.

## Pull request

https://github.com/oppknox/post-work-economics/pull/1

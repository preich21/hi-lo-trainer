# Hi-Lo Trainer

A small, single-page trainer for the Hi-Lo card counting system.

**Live:** https://preich21.github.io/hi-lo-trainer/

## Card values

| Cards | Value |
|---|---|
| 2–6 | +1 |
| 7–9 | 0 |
| 10, J, Q, K, A | −1 |

## Levels

1. **Last card** – 51 cards are dealt one at a time. Name the Hi-Lo value of the missing card.
2. **Pairs** – cards come two at a time until the dealer stops somewhere in the deck. Enter your running count.
3. **Flash** – 20 hands of 3 or 4 cards. Tap their combined value as fast as you can. Trains reading cards in groups instead of one by one.

## Scoring

Any wrong answer is **Miscounted** (red). Correct rounds are rated by speed. Preset limits:

| Level | Casino-ready (green) | Workable (yellow) | Too slow (orange) |
|---|---|---|---|
| 1 · Last card | ≤ 0.5 s per card (≈ 25 s per deck) | ≤ 0.8 s per card | slower |
| 2 · Pairs | ≤ 0.4 s per card | ≤ 0.65 s per card | slower |
| 3 · Flash | ≤ 1.5 s per hand | ≤ 2.5 s per hand | slower |

The limits can be changed per level on the Limits page and reset to these presets.

Rounds and limits are saved in your browser (IndexedDB), so they survive closing the tab. Each device keeps its own.

## Pages

- **Train** – the three levels above.
- **Results** (`#results`) – latest rounds with rating, time and seconds per card or hand, plus the mix of your last 50 rounds.
- **Progress** (`#progress`) – chart of up to your last 500 rounds, colour-coded, with a 10-round average and the limit lines of the selected level.
- **Limits** (`#limits`) – set your own limits per level.

## Run locally

Open `index.html` in a browser. No build step.

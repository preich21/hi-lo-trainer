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
- **Strategy** (`strategy.html`) – basic strategy trainer, see below.

## Basic strategy trainer

`strategy.html` is a separate page with three tabs:

- **Drill** – 20 hands with the dealer's upcard. Tap Hit, Stand, Double, Split or Surrender (keys H, S, D, P, R). Hands you get wrong come back more often. Rated Casino-ready (≤ 1.5 s per hand), Workable (≤ 3 s), Too slow, or Misplayed.
- **Chart** – the full strategy for the selected table rules, with your mistakes per hand.
- **Rules** – hole card yes/no, dealer stands/hits soft 17, double after split, late surrender, plus the speed limits.

The strategy is the standard 4–8 deck chart (Wizard of Odds) with the usual adjustments for H17, no double after split and no surrender, and the European no-hole-card changes: hit 11 vs 10, hit 8,8 vs 10/A, hit A,A vs A. Default rules: no hole card, dealer stands on soft 17, double after split, no surrender.

The page stores its data in its own IndexedDB database, separate from the counting results.

## Run locally

Open `index.html` in a browser. No build step.

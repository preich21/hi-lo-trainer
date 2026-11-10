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

| Color | Meaning |
|---|---|
| Green | Correct, at most 0.5 s per card (≈ 25 s for a full deck) |
| Yellow | Correct, up to 0.8 s per card |
| Orange | Correct, but slower |
| Red | Miscounted |

Every round is saved in your browser (IndexedDB), so results survive closing the tab. Each device keeps its own history.

## Pages

- **Train** – the two levels above.
- **Results** (`#results`) – latest rounds with colour, time and seconds per card, plus the colour mix of your last 50 rounds.
- **Progress** (`#progress`) – chart of up to your last 500 rounds: seconds per card, colour-coded, with a 10-round average and the green/yellow limits.

## Run locally

Open `index.html` in a browser. No build step.

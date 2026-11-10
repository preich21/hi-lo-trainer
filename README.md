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

## Scoring

| Color | Meaning |
|---|---|
| Green | Correct, at most 0.5 s per card (≈ 25 s for a full deck) |
| Yellow | Correct, up to 0.8 s per card |
| Orange | Correct, but slower |
| Red | Miscounted |

Your last 20 results per level are kept in your browser.

## Run locally

Open `index.html` in a browser. No build step.

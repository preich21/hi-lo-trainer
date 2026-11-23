# Hi-Lo Trainer

Small trainers for Hi-Lo card counting and blackjack basic strategy.

## Navigation

The top bar has one entry per trainer: **Counting** (`index.html`), **Strategy** (`strategy.html`), **True count** (`truecount.html`) and **Table** (`table.html`). Below it, every trainer has the same row: its drills as tabs, plus a **Stats** and a **Settings** icon on the right.

| Trainer | Drills | Stats | Settings |
|---|---|---|---|
| Counting | Level 1 · 2 · 3 · 4 · 5 (`#level1`–`#level5`) | chart + rounds (`#stats`) | dealer pace, speed limits (`#settings`) |
| Strategy | Drill · Chart | chart, most-missed hands, rounds | table rules + speed limits |
| True count | Decks · Divide · Combined | chart per drill, rounds | shoe, rounding, deck marks, speed limits |
| Table | Play | accuracy, result chart, most-missed plays, shoes | table, shared table rules, coach |

Old links (`#train`, `#results`, `#progress`, `#limits`, `#rules`) still work.

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
4. **Dealer pace** – about two decks from a 6-deck shoe, dealt automatically at a fixed speed (Slow 1.0 s, Casino 0.7 s, Fast 0.5 s per card, or your own). Cards come in rounds sized for 1–7 players plus the dealer, with a short pause between rounds. Up to four times at a round break the dealer stops and asks for your running count; after a wrong answer you carry on from the correct count. You can't slow it down: there's only Stop, and the round also stops when the page goes into the background.
5. **Full table** – the same speed, players and checks as Level 4, but dealt like a real table: one card to each seat, the dealer's upcard, second cards, every player's hits (played with basic strategy), then the dealer's hand. Everything stays on the table until the round is over, then it's cleared and you keep the count. European rules (no hole card, dealer stands on soft 17).

## Scoring

Any wrong answer is **Miscounted** (red). Correct rounds are rated by speed. Preset limits:

| Level | Casino-ready (green) | Workable (yellow) | Too slow (orange) |
|---|---|---|---|
| 1 · Last card | ≤ 0.5 s per card (≈ 25 s per deck) | ≤ 0.8 s per card | slower |
| 2 · Pairs | ≤ 0.4 s per card | ≤ 0.65 s per card | slower |
| 3 · Flash | ≤ 1.5 s per hand | ≤ 2.5 s per hand | slower |
| 4 · Dealer pace | dealt at ≤ 0.7 s per card | ≤ 1.0 s per card | slower |
| 5 · Full table | dealt at ≤ 0.7 s per card | ≤ 1.0 s per card | slower |

Levels 4 and 5 are rated by the dealing speed you choose, not your reaction time; any wrong check makes the round Miscounted.

The limits can be changed per level under Settings and reset to these presets.

Rounds and limits are saved in your browser (IndexedDB), so they survive closing the tab. Each device keeps its own.

**Stats** shows a chart of up to your last 500 rounds (colour-coded, with a 10-round average and the limit lines of the selected level), the rating mix of your last 50 rounds and the list of rounds.

## Basic strategy trainer

`strategy.html` is a separate page with two drill tabs plus Stats and Settings:

- **Drill** – 20 hands with the dealer's upcard. Tap Hit, Stand, Double, Split or Surrender (keys H, S, D, P, R). Hands you get wrong come back more often. Rated Casino-ready (≤ 1.5 s per hand), Workable (≤ 3 s), Too slow, or Misplayed.
- **Chart** – the full strategy for the selected table rules, with your mistakes per hand. Tap any hand for an explanation of the play, notes on how other table rules would change it, and the expected result of every option (per bet and per €10). After a wrong answer in the drill, **Why?** opens the same explanation.
- **Stats** – chart of seconds per hand, your most-missed hands (tap for the explanation) and your rounds.
- **Settings** – hole card yes/no, dealer stands/hits soft 17, double after split, late surrender, plus the speed limits.

The expected results are calculated in the page with an infinite-deck model for the selected rules. They agree with the chart on all but two hands (A,2 vs 5 and A,4 vs 4, by less than 0.01), where the chart, built for real 4–8 deck shoes, is right.

The strategy is the standard 4–8 deck chart (Wizard of Odds) with the usual adjustments for H17, no double after split and no surrender, and the European no-hole-card changes: hit 11 vs 10, hit 8,8 vs 10/A, hit A,A vs A. Default rules: no hole card, dealer stands on soft 17, double after split, no surrender.

The page stores its data in its own IndexedDB database, separate from the counting results.

## True count trainer

`truecount.html` trains converting the running count into the true count (running count ÷ decks left). Three drills of 20 questions:

- **Decks** – a to-scale discard tray of a 6- or 8-deck shoe. Tap how many decks are left, to the nearest half deck.
- **Divide** – running count and decks left as numbers. Enter the true count.
- **Combined** – running count plus the tray: estimate and divide in one step.

After a wrong answer the tray shows deck marks and the calculation (e.g. `+7 ÷ 2.5 = +2.8 → +3`). Settings: shoe size, rounding (nearest or round down; ambiguous .5 cases are never asked), optional deck marks as a beginner aid, and speed limits per drill (presets 2 / 4 s for Decks and Divide, 3 / 5 s for Combined). Rated Casino-ready, Workable, Too slow, or Misjudged / Miscalculated. Data is stored in its own IndexedDB database.

## Full play (Table)

`table.html` deals a real shoe (6 or 8 decks, cut card at 65–85%) to 1–7 seats. You sit in one of them, the others play perfect basic strategy.

- **Betting** – a virtual bankroll in units. Before each round you pick 1, 2, 4, 6 or 8 units; the coach compares it with the bet ramp for the current true count (1 unit up to +1, then 2 · 4 · 6 · 8 at +2 · +3 · +4 · +5 and higher).
- **Playing** – hit, stand, double, split (up to 4 hands, one card per split Ace), surrender where offered, insurance when the dealer shows an Ace. Right after each decision the coach says whether it was the play, with **Why?** for the explanation from the Strategy page. The hand continues with your choice.
- **Deviations** (Settings, off by default) – the coach then expects the Illustrious 18 and, where surrender is offered, the Fab 4.
- **Count checks** – at random round breaks you enter the running count and the true count, with the to-scale discard tray in view.
- **Shoe summary** – plays, bets and count checks right, rounds and result. Stats add a result chart over shoes and your most-missed plays.

The table rules are shared with the Strategy page.

## Shared code

- `strategy-core.js` – basic strategy for every rule set, playing any hand, deviations, expected results, explanations and the explanation panel. Used by `strategy.html`, `table.html` and Level 5.
- `table.js` – shoe, round engine (dealing order, hole card or no hole card, insurance, peek, splits, payouts), table view and discard tray. Used by `table.html` and Level 5.

With perfect basic strategy the engine reproduces the published house edges (e.g. −0.43% for 6 decks, hole card, S17, double after split; −0.59% without hole card) within ±0.08% over 8 million simulated hands.

## Run locally

Open `index.html` in a browser. No build step; the pages load the shared `.js` files from the same folder.

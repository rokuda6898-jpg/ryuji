# Wave model

The project now treats graph shape as a hypothesis to test, not proof of hall-control intervention.

Features: reversal depth, peak/trough range, turning rate, step volatility, finish relative to trough, cross-machine/island similarity, previous-day continuity.

Validation: rolling out-of-sample backtests plus permutation/null tests. A visual pattern is rejected when randomized series reproduce it at comparable frequency. Candidate signals must remain useful on later unseen dates before receiving prediction weight.

Next data requirement: intraday graph points (time/order + cumulative ball difference) for each 4-yen machine. Daily totals alone cannot establish wave shape or synchronization.

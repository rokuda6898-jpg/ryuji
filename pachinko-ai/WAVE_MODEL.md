# Wave model

The ranking is chart-first. Past graph shape is treated as a hypothesis to test, not proof that a machine is due or that the hall controls outcomes.

## Fixed ranking weights

- Long-term chart shape: **40%**
  - 7-day shape: 15%
  - recent 3-day shape: 15%
  - similarity to past charts: 10%
- Today's chart shape: **20%**
- Recent momentum / acceleration: **15%**
- First-hit / RUSH behavior: **10%**
- Relative position within the same model: **10%**
- Hall / machine-number repeatability: **5%**

The long-term block is intentionally the largest component. A machine must not rank highly merely because it is strong today.

Chart features include recovery from trough, finish position inside the day's range, recent slope, acceleration, peak/trough range, drawdown, turning rate and cross-day similarity.

Validation remains rolling out-of-sample / walk-forward plus shuffled or permutation baselines. Pattern weights should only be changed after later unseen dates show a reproducible improvement.

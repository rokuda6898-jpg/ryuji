# Intraday evaluation

At each Site777 snapshot, save the ranked candidates before later data is known. After the final snapshot, score each candidate using only movement that occurred after that snapshot.

Primary checks:
- precision@10: fraction of the saved top 10 whose final graph endpoint finished above the snapshot endpoint
- average close movement after the snapshot
- maximum subsequent upside and downside
- comparison with shuffled/random baselines

Use walk-forward evaluation: earlier dates are training/history and the next date is test. Never use later snapshots or final-day information when creating an earlier ranking. A feature is promoted into the live ranking only after repeated out-of-sample improvement; otherwise keep it experimental.

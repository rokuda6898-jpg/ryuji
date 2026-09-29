# Intraday wave model

Collection targets are based on the observed Site777 cadence supplied by the user: roughly every 121 minutes from 10:30 through 22:30. Target snapshots are stored separately; an update may arrive late, so timestamps must reflect actual capture time.

For each machine compare consecutive snapshots:
- endpoint movement
- range expansion/contraction
- shape similarity
- amount of newly observed graph

For neighboring machines calculate lead/lag correlation. Treat this only as a candidate statistical feature. It must beat shuffled/randomized baselines and walk-forward tests before it affects ranking. Do not interpret correlation as evidence of hall-computer control.

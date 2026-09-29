# Site777 wave pipeline

1. Parse saved GraphList HTML (4-yen pachinko only).
2. Map model + machine number to each chart URL.
3. Download chart image.
4. Decode image to RGBA and run `traceChart`.
5. Reject low-quality traces instead of forcing a prediction.
6. Compute wave features only for usable traces.
7. Compare same-machine history, neighboring machines/island sync, and shuffled-increment null waves.
8. Rank only after walk-forward validation; a score is a historical-pattern score, not a guaranteed win probability.

Important: graph recurrence can be tested statistically, but public graph data alone does not establish that a hall computer controls individual outcomes.

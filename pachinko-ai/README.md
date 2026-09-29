# Pachinko AI v0.1

Personal 4-yen pachinko statistical analyzer.

## Goal
Store daily public/authorized machine results, detect recurring hall/model/island/position patterns, rank candidates, then backtest predictions against later results.

## Data fields
rate, date, machineNo, model, spins, diffBalls, hits. Add island/position/weekday/event flags when obtainable.

## Run
Copy data/history.example.json to data/history.json and run `npm run analyze`.

## Important
The initial score is a scaffold, not a validated prediction model. Losing streaks do not mechanically make a future win more likely. Production scoring should only use patterns that survive out-of-sample backtests.

## Next
Implement an importer for the provided Site777/D-deltanet page after its allowed response format is confirmed, then add rolling backtests and a mobile dashboard.

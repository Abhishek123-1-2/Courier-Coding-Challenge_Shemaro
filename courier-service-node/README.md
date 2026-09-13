# Courier Service

CLI for the courier coding challenge - delivery cost estimation with offer codes (Problem 1) and delivery time estimation via vehicle scheduling (Problem 2).

## Setup

Needs Node.js >= 14. No external dependencies.

```bash
git clone <repo-url>
cd courier-service-node
npm install
```

## Usage

```bash
# Problem 1 - no vehicle line in the input
node bin/main.js samples/sample_input_p1.txt

# Problem 2 - last line is "no_of_vehicles max_speed max_carriable_weight"
node bin/main.js samples/sample_input_p2.txt

# also works via stdin
node bin/main.js < samples/sample_input_p2.txt
```

### Debugging in VS Code

Set a breakpoint in `bin/main.js`, then add a `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [{
    "type": "node",
    "request": "launch",
    "name": "Debug courier-service",
    "program": "${workspaceFolder}/bin/main.js",
    "args": ["${workspaceFolder}/samples/sample_input_p2.txt"],
    "console": "integratedTerminal"
  }]
}
```

and hit F5. Or just run it in the terminal and console.log your way through - whatever's faster.

### Tests

```bash
npm test
```

Covers both sample inputs from the brief, offer boundary conditions, vehicle scheduling edge cases, and invalid-input handling.

## Input / output format

```
base_delivery_cost no_of_packages
pkg_id weight_kg distance_km offer_code
...
[no_of_vehicles max_speed max_carriable_weight]   <- optional
```

```
pkg_id discount total_cost [delivery_time_hours]
```

## Structure

- `src/models.js` - `Package`/`Vehicle` shapes, no logic
- `src/offers.js` - offer rules in one registry object; new offer code = one new entry
- `src/costCalculator.js` - Problem 1 cost + discount
- `src/deliveryEstimator.js` - Problem 2 vehicle scheduling
- `src/inputParser.js` - parses and validates the raw input
- `bin/main.js` - CLI entry point, wires everything together
- `test/run-tests.js` - test suite (plain `assert`, no framework)

### Cost formula

```
delivery_cost = base_cost + weight * 10 + distance * 5
discount = delivery_cost * offer% (0 if offer code is unknown or criteria isn't met)
total_cost = delivery_cost - discount
```

### Scheduling

Repeat until every package is out for delivery:

1. Take whichever vehicle is free earliest.
2. Pick the best shipment it can carry from what's left: most packages first, then heaviest total weight, then whichever finishes soonest if still tied.
3. Each package in that shipment arrives at `vehicle.availableAt + distance / speed`.
4. Vehicle becomes free again at `vehicle.availableAt + 2 * (furthest_distance_in_shipment / speed)`, since it has to drive back.

`findBestShipment` brute-forces subsets with a weight-based prune, which is fine for the batch sizes here. For much larger inputs you'd want a bounded-knapsack DP instead - only that one function would need to change.

## Assumptions

- Unknown/typo'd offer codes (e.g. `OFFR0008` in the sample) and `NA` are treated as "no discount," not as errors - matches what the brief says explicitly.
- Time values are floored to 2 decimals at each leg, not rounded, since that's the only way to reproduce the sample output exactly (100/70 -> 1.42, not 1.43).
- A package that's too heavy for every vehicle doesn't crash the run - it prints `NA` for delivery time and logs a warning to stderr.
- Bad input (wrong field counts, negative/zero weights or distances, duplicate IDs, malformed vehicle line, etc.) exits with a non-zero code and a message describing what's wrong, instead of throwing a raw stack trace.
- Cost/discount print without forced decimals to match the sample (`175`, not `175.00`); delivery time always prints to 2 decimals (`3.98`), also matching the sample.

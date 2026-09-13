# Courier Service

CLI app for the courier coding challenge. Handles delivery cost estimation with offer codes (Problem 1) and delivery time estimation with vehicle scheduling (Problem 2).

## Setup

Node >= 14, no external deps.

```bash
git clone <repo-url>
cd courier-service-node
npm install
```

## Usage

```bash
# Problem 1 - just leave out the vehicle line
node bin/main.js samples/sample_input_p1.txt

# Problem 2 - add "no_of_vehicles max_speed max_carriable_weight" as the last line
node bin/main.js samples/sample_input_p2.txt

# stdin works too
node bin/main.js < samples/sample_input_p2.txt
```

### Debugging

Drop this in `.vscode/launch.json` and hit F5:

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

Set your breakpoints in `bin/main.js` first. Or honestly just console.log it, whatever's quicker.

### Tests

```bash
npm test
```

Runs both sample inputs from the PDF plus offer boundary checks, scheduling edge cases, and bad-input handling.

## Input / output

Input:

```
base_delivery_cost no_of_packages
pkg_id weight_kg distance_km offer_code
...
[no_of_vehicles max_speed max_carriable_weight]   <- optional, only needed for Problem 2
```

Output:

```
pkg_id discount total_cost [delivery_time_hours]
```

## Code layout

- `src/models.js` - Package/Vehicle, no logic, just data
- `src/offers.js` - all offer rules live here, add a code = add one entry
- `src/costCalculator.js` - Problem 1 math
- `src/deliveryEstimator.js` - Problem 2, vehicle scheduling
- `src/inputParser.js` - validates raw input before anything touches it
- `bin/main.js` - CLI entry, glues everything together
- `test/run-tests.js` - just plain assert, didn't want to pull in a test runner for this

### Cost formula

```
delivery_cost = base_cost + weight * 10 + distance * 5
discount = delivery_cost * offer% (0 if the offer code doesn't exist or criteria isn't met)
total_cost = delivery_cost - discount
```

### How scheduling works

Loop until every package's assigned:

1. Grab whichever vehicle frees up first.
2. Figure out the best shipment it can take from what's left - max packages wins, ties broken by total weight, then by whichever finishes quicker.
3. Each package lands at `vehicle.availableAt + distance / speed`.
4. Vehicle's free again at `vehicle.availableAt + 2 * (furthest distance in that shipment / speed)` - it has to drive back after all.

`findBestShipment` just brute forces the subsets with a weight prune, works fine at this scale. If this ever needed to handle hundreds of packages you'd swap that for a proper knapsack DP - wouldn't touch anything else.

## Assumptions I made

- Bad/unknown offer codes (like the `OFFR0008` typo in the sample) and `NA` just get 0 discount instead of throwing - the spec says as much.
- Delivery times get floored to 2 decimals per leg instead of rounded. Only way the numbers actually match the sample (100/70 comes out to 1.42, not 1.43).
- If a package is too heavy for every vehicle in the fleet, it doesn't blow up the whole run - just prints NA for that package's time and warns on stderr.
- Garbage input (wrong number of fields, negative weight/distance, duplicate ids, broken vehicle line, whatever) exits non-zero with an actual message instead of a stack trace.
- Cost and discount print as plain numbers, no forced decimals (`175` not `175.00`), matching the sample. Delivery time always shows 2 decimals though (`3.98`).

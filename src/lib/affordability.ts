/**
 * The core differentiator: walks wanted items in priority order against a
 * balance, greedily marking each affordable or deferred. Kept as a pure
 * function, independent of data fetching, so the rule is easy to reason
 * about and to change in one place.
 */

export interface AffordabilityInput {
  id: string;
  name: string;
  cost: number;
  priority: number;
}

export interface AffordabilityResult extends AffordabilityInput {
  /** Balance remaining immediately after this item is bought (affordable items only). */
  runningBalance: number;
}

export interface AffordabilityOutcome {
  affordable: AffordabilityResult[];
  deferred: AffordabilityInput[];
  startingBalance: number;
  remainingBalance: number;
}

export function calculateAffordability(
  items: AffordabilityInput[],
  startingBalance: number
): AffordabilityOutcome {
  const sorted = [...items].sort((a, b) => a.priority - b.priority);

  const affordable: AffordabilityResult[] = [];
  const deferred: AffordabilityInput[] = [];
  let remainingBalance = startingBalance;

  for (const item of sorted) {
    if (item.cost <= remainingBalance) {
      remainingBalance -= item.cost;
      affordable.push({ ...item, runningBalance: remainingBalance });
    } else {
      deferred.push(item);
    }
  }

  return { affordable, deferred, startingBalance, remainingBalance };
}

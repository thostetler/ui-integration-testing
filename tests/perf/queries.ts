/**
 * Performance test queries - configurable via environment variable
 *
 * By default, uses the CORE query set (8 queries) for reasonable test times.
 *
 * To use the full query set (26 queries), set:
 *   PERF_QUERY_SET=full npm run test:perf
 *
 * Query sets:
 * - CORE (default): 8 representative queries, ~1-2 hour test time for 200 samples
 * - FULL: All 26 queries, ~8-12 hour test time for 200 samples
 *
 * Time estimates (with 2 apps × 2 throttling levels):
 * - Core (8 queries = 32 tests):
 *   - 20 samples: ~10-15 min
 *   - 100 samples: ~30-45 min
 *   - 200 samples: ~1-2 hours
 *
 * - Full (26 queries = 104 tests):
 *   - 20 samples: ~30-45 min
 *   - 100 samples: ~2-4 hours
 *   - 200 samples: ~8-12 hours
 */

import { queriesCore, queriesExtended } from './queries-core';

// Determine which query set to use
const querySet = process.env.PERF_QUERY_SET?.toLowerCase() || 'core';

let selectedQueries;
if (querySet === 'full') {
  console.log('📊 Using FULL query set (26 queries, 104 tests)');
  selectedQueries = [...queriesCore, ...queriesExtended];
} else if (querySet === 'extended') {
  console.log('📊 Using EXTENDED query set (18 queries, 72 tests)');
  selectedQueries = queriesExtended;
} else {
  console.log('📊 Using CORE query set (8 queries, 32 tests)');
  selectedQueries = queriesCore;
}

export const queries = selectedQueries;

// Also export the individual sets for direct import if needed
export { queriesCore, queriesExtended };

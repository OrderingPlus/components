import {
  runFilterProductsTask,
  runSortProductsTask,
  runMergeDedupeTask
} from './listingProductsPipeline'
import { runPostProcessBusinessesTask } from './listingBusinessesPipeline'

const SEARCH_DEBOUNCE_MS = 250

const syncHandlers = {
  products: {
    FILTER_PRODUCTS: runFilterProductsTask,
    SORT_PRODUCTS: runSortProductsTask,
    MERGE_DEDUPE: runMergeDedupeTask
  },
  businesses: {
    POST_PROCESS: runPostProcessBusinessesTask
  }
}

let customListingTaskRunner = null
const debounceTimers = {}

export const setListingTaskRunner = (runner) => {
  customListingTaskRunner = runner
}

const runSyncListingTask = ({ workerType, task, payload }) => {
  const handler = syncHandlers[workerType]?.[task]
  if (!handler) {
    throw new Error(`Unknown listing task: ${workerType}.${task}`)
  }
  return Promise.resolve(handler(payload))
}

/**
 * Run a listing CPU task. Uses sync pipeline by default; hosts may inject a worker runner.
 */
export const runListingTask = (args) => {
  if (customListingTaskRunner) {
    return customListingTaskRunner(args)
  }
  return runSyncListingTask(args)
}

/**
 * Debounced variant for search/filter keystrokes.
 */
export const runListingTaskDebounced = ({
  workerType,
  task,
  payload,
  itemCount,
  debounceKey = 'default',
  debounceMs = SEARCH_DEBOUNCE_MS
}) =>
  new Promise((resolve, reject) => {
    const timerKey = `${workerType}:${task}:${debounceKey}`
    if (debounceTimers[timerKey]) {
      clearTimeout(debounceTimers[timerKey])
    }
    debounceTimers[timerKey] = setTimeout(() => {
      delete debounceTimers[timerKey]
      runListingTask({ workerType, task, payload, itemCount }).then(resolve).catch(reject)
    }, debounceMs)
  })

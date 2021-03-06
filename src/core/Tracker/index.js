import Computation, { getCurrentComputation } from './Computation'
let readyComputations = {}
export Dependency from './Dependency'

export function readyCompute(comput) {
  readyComputations[comput.id] = comput
}

export function flush(noNextTick) {
  const nextTick = noNextTick ? (fn) => fn() : (fn) => setTimeout(fn, 0)
  nextTick(() => {
    Object.keys(readyComputations).forEach(id => readyComputations[id].compute())
    readyComputations = {}
  })
}

export function autorun(fn) {
  const computation = new Computation(fn)
  const oldComputation = getCurrentComputation()
  if (oldComputation) {
    oldComputation.onInvalidate(() => computation.stop())
  }
  computation.compute()
  return computation
}

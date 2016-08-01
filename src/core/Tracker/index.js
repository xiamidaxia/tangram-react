import Computation from './Computation'
export Dependency from './Dependency'

export function autorun(fn) {
  const computation = new Computation(fn)
  computation.compute()
  return computation
}

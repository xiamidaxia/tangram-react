let nextId = 1
let currentComputation = null
export function getCurrentComputation() {
  return currentComputation
}

function setCurrentComputation(compute) {
  currentComputation = compute
}

export default class Computation {
  constructor(fn) {
    this._invalidates = []
    this._fn = fn
    this._invalidated = true
    this._id = nextId ++
    this._computing = false
    this._firstRun = true
    this._stopped = false
  }
  get firstRun() {
    return this._firstRun
  }
  get id() {
    return this._id
  }
  get invalidated() {
    return this._invalidated
  }
  stop() {
    this._stopped = true
    this.invalidate()
  }
  onInvalidate(fn) {
    if (this._stopped) return
    this._invalidated = false
    this._invalidates.push(fn)
  }
  invalidate() {
    if (this._invalidated) return
    this._invalidates.forEach(fn => fn())
    this._invalidates = []
    this._invalidated = true
  }
  compute() {
    if (this._stopped || this._computing) return
    this.invalidate()
    const oldComputation = currentComputation
    if (oldComputation) {
      oldComputation.onInvalidate(() => this.stop())
    }
    setCurrentComputation(this)
    this._computing = true
    this._fn(this)
    this._computing = false
    this._firstRun = false
    setCurrentComputation(oldComputation)
  }
}

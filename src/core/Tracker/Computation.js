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
    this._parent = currentComputation
    this._invalidates = []
    this._fn = fn
    this._invalidated = true
    this._id = nextId ++
    this._computing = false
    this._firstRun = true
    this._stopped = false
    if (this._parent) {
      // Parent recompute will stop the children compute
      this._parent.onInvalidate(() => {
        this.stop()
      })
    }
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
    setCurrentComputation(this)
    this._computing = true
    this._invalidated = false
    this._fn(this)
    this._computing = false
    this._firstRun = false
    setCurrentComputation(this._parent)
  }
}

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
    this._depends = []
    this._dependVersion = ''
  }
  get dependVersion() {
    return this._dependVersion
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
  onDepend(dependency) {
    if (this._stopped) return
    this._invalidated = false
    this._depends.push(dependency)
    this._dependVersion = this.computeDependVersion()
  }
  onInvalidate(fn) {
    if (this._stopped) return
    this._invalidated = false
    this._invalidates.push(fn)
  }
  invalidate() {
    if (this._invalidated) return
    this._invalidates.forEach(fn => fn())
    this._depends.forEach(depend => depend.remove(this))
    this._invalidates = []
    this._depends = []
    this._invalidated = true
  }
  computeDependVersion() {
    return this._depends.map(depend => depend.version).join(',')
  }
  compute() {
    if (this._stopped || this._computing) return
    if (this._dependVersion && this._dependVersion === this.computeDependVersion()) return
    this.invalidate()
    const oldComputation = currentComputation
    setCurrentComputation(this)
    this._computing = true
    this._fn(this)
    this._computing = false
    this._firstRun = false
    setCurrentComputation(oldComputation)
  }
}

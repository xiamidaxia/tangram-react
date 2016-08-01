import { getCurrentComputation } from './Computation'
export default class Dependency {
  constructor() {
    this._deps = {}
  }
  depend() {
    const compute = getCurrentComputation()
    // Must depend a computation
    if (!compute) return
    this._deps[compute.id] = compute
    compute.onInvalidate(() => {
      this.remove(compute)
    })
  }
  isDepend(compute) {
    return !!Object.keys(this._deps).find(id => this._deps[id] === compute)
  }
  remove(compute) {
    delete this._deps[compute.id]
  }
  changed() {
    Object.keys(this._deps).forEach(id => this._deps[id].compute())
  }
}

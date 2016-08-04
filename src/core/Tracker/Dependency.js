import { getCurrentComputation } from './Computation'
import { readyCompute } from './index'
let nextId = 1
export default class Dependency {
  constructor() {
    this._deps = []
    this._version = 0
    this._id = nextId ++
  }
  get version() {
    return this._id + '_' + this._version
  }
  depend() {
    const compute = getCurrentComputation()
    // Must depend a computation
    if (!compute) return
    if (this._deps.includes(compute)) return
    this._deps.push(compute)
    compute.onDepend(this)
  }
  isDepend(compute) {
    return this._deps.includes(compute)
  }
  remove(compute) {
    const index = this._deps.indexOf(compute)
    if (index !== -1) this._deps.splice(index, 1)
  }
  changed() {
    this._version ++
    this._deps.forEach(compute => readyCompute(compute))
  }
}

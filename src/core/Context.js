import { each, mapValues } from '../common/utils'
import { autorun } from '../core/Tracker'
import globalMonitor from './globalMonitor'
import Model from './Model'

function isModelClass(M) {
  return typeof M === 'function' && (Model === M || Model.isPrototypeOf(M))
}
/**
 * @class Context
 */
export default class Context {
  /**
   * @param {Object} contextInitData
   * @param {Object} opts
   *    - parentContext {Context}
   *    - use {Array}
   *    - monitor {Monitor}
   */
  constructor(contextInitData = {}, opts = {}) {
    this._listeners = []
    this._inits = []
    this._autoruns = []
    this._monitor = opts.parentContext ? opts.parentContext.monitor : (opts.monitor || globalMonitor)
    this._data = mapValues(contextInitData, (M, name) => {
      // Get from parent context
      if (typeof M === 'string') {
        if (opts.parentContext) {
          const m = opts.parentContext.find(M)
          m.monitor = this._monitor
          return m
        }
        throw new Error(`[@context] Can not find data "${name}" in Context..`)
      }
      // Get a class
      if (isModelClass(M)) {
        return new M(null, { monitor: this._monitor })
      }
      // Get an instance
      if (M instanceof Model) {
        M.monitor = this._monitor
        return M
      }
      throw new TypeError(`[@context] ${name} must instance of Model or Model class.`)
    })
    this._subscribeMonitor()
    this.use(opts.use)
    this._inits.forEach(fn => fn(this.data))
    this._autoruns.forEach(fn => {
      autorun((c) => fn(this.data, c))
    })
  }
  _subscribeMonitor() {
    this._monitorRemove = this.monitor.subscribe((action) => {
      this.dispatch(action)
    })
  }
  get monitor() {
    return this._monitor
  }
  get data() {
    return this._data
  }
  destroy() {
    if (this._monitorRemove) {
      this._monitorRemove()
      this._monitorRemove = null
    }
  }
  checkModels(models) {
    if (Array.isArray(models)) {
      models.forEach((name) => {
        if (!this._data[name]) {
          throw new Error(`[@observer] Can not find data "${name}" in Context.`)
        }
      })
    } else {
      each(models, (Klass, name) => {
        if (this._data[name]) {
          if (!isModelClass(Klass)) {
            throw new TypeError(`[@observer] Context required Model class.`)
          }
          if (!(this._data[name] instanceof Klass)) {
            throw new TypeError(`[@observer] ${name} is not instance of ${Klass.name}.`)
          }
        } else {
          throw new Error(`[@observer] Can not find data "${name}" in Context.`)
        }
      })
    }
  }
  pick(...keys) {
    return keys.reduce((obj, key) => {
      if (!this._data[key]) throw new Error(`[Context] Can not find data "${key}" in Context.`)
      obj[key] = this._data[key]
      return obj
    }, {})
  }
  find(key) {
    if (!this._data[key]) throw new Error(`[Context] Can not find data "${key}" in Context.`)
    return this._data[key]
  }
  findKeyByModel(model) {
    return Object.keys(this._data).find(key => this._data[key] === model)
  }
  init(initFn) {
    if (typeof initFn === 'function') {
      this._inits.push(initFn)
    } else {
      throw new Error(`[Context] Context init need a function but get ${typeof initFn}.`)
    }
  }
  use(items = []) {
    items.forEach((fn) => {
      if (typeof fn === 'function') {
        fn(this)
      } else {
        throw new Error(`[Context] Context.use need functions but get ${typeof fn}.`)
      }
    })
  }
  autorun(autorun) {
    if (typeof autorun === 'function') {
      this._autoruns.push(autorun)
    } else {
      throw new Error('[Context] Context autorun need a function.')
    }
  }
  dispatch(action) {
    this._listeners.forEach(({ pattern, fn }) => {
      const keys = pattern.split('.')
      let model = this.find(keys.shift())
      let name
      while (keys.length > 0) {
        if (name) model = model[name]
        name = keys.shift()
        if (!name) return
      }
      if (model[name] instanceof Model) {
        model = model[name]
        name = null
      }
      if (model !== action.model || (model === action.model && name && action.name !== name)) return
      fn({ action, context: this.data })
    })
  }
  listen(pattern, fn) {
    if (pattern && typeof pattern === 'string') {
      this._listeners.push({
        pattern,
        fn,
      })
    } else {
      throw new Error('[Context] Listen pattern must be a String.')
    }
    return this
  }
}

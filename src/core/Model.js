import { Dependency, flush } from '../core/Tracker'
import { each, mapValues, isPlainObject } from '../common/utils'
import Monitor from './Monitor'
import globalMonitor from './globalMonitor'
export function geProperty(key) {
  return {
    enumerable: true,
    configurable: false,
    get() {
      this._stateDeps[key].depend()
      return this._state[key]
    },
    set(newState) {
      if (!this.__context) {
        throw new Error(`[${this.constructor.name}] Set state must in "@action".`)
      }
      if (typeof this._initialState[key] === 'function') {
        newState = this._initialState[key].call(this, newState, false)
      }
      if (!this.isEqual(this._state[key], newState)) {
        this._state[key] = newState
        this._changed(key)
      }
    },
  }
}
/**
 * @class Model
 */
export default class Model {
  static _initialState = {}
  static _actionKeys = []

  /**
   * @param {Object} initState - state init data
   * @param {Object} opts
   *    - {Monitor} monitor
   */
  constructor(initState, opts = {}) {
    this._actionDep = new Dependency
    this._actionKeys = []
    this._actionStates = {}
    this.monitor = opts.monitor || globalMonitor
    this._state = {}
    this._stateDeps = {}
    this._initialState = {}
    this._initStateAndActionKeys(initState || {})
  }

  /**
   * Create state
   * @param {Object} initState
   * @private
   */
  _initStateAndActionKeys(initState) {
    const constructors = []
    let constructor = this.constructor
    const actionKeys = {}
    while (constructor !== Model) {
      constructors.push(constructor)
      constructor = Object.getPrototypeOf(constructor)
    }
    this._initialState = constructors.reduceRight((state, c) => {
      const keys = c._actionKeys || []
      // add action Keys
      keys.forEach(key => actionKeys[key] = true)
      each(c._initialState, (val, key) => {
        if (typeof val !== 'function') {
          this._state[key] = initState.hasOwnProperty(key) ? initState[key] : val
        } else {
          this._state[key] = val.call(this, initState[key], true)
        }
        // Initial state resaved
        state[key] = val
        // create state Dependency
        this._stateDeps[key] = new Dependency
      })
      return state
    }, this._initialState)
    // check the state keys
    Object.keys(initState).forEach((key) => {
      if (!this._state.hasOwnProperty(key)) {
        throw new Error(`[${this.constructor.name}] Unknown state "${key}"`)
      }
    })
    this._actionKeys = Object.keys(actionKeys)
  }

  /**
   * Set state and trigger dependency
   * @param {Object} state - target state
   */
  setState(state = {}) {
    if (!this.__context) {
      throw new Error(`[${this.constructor.name}] Set state must in "@action".`)
    }
    const _state = this._state
    each(state, (val, key) => {
      if (!_state.hasOwnProperty(key)) {
        throw new Error(`[${this.constructor.name}] Unknown state "${key}"`)
      }
      if (typeof this._initialState[key] === 'function') {
        val = this._initialState[key].call(this, val, false)
      }
      if (!this.isEqual(this._state[key], val)) {
        this._changed(key)
      }
      _state[key] = val
    })
  }
  _changed(key) {
    this._stateDeps[key].changed()
  }
  /**
   * Can be override by immutable
   * @param {*} oldState - oldState
   * @param {*} newState - newState
   * @returns {Boolean}
   */
  isEqual(oldState, newState) {
    return oldState === newState
  }

  set monitor(monitor) {
    if (monitor instanceof Monitor) {
      this._monitor = monitor
    } else {
      throw new TypeError(`[${this.constructor.name}] ${monitor} must instance of Monitor`)
    }
  }
  get monitor() {
    return this._monitor
  }
  getActionState(actionName) {
    if (!this._actionKeys.includes(actionName)) throw new Error(`[${this.constructor.name}] Undefined action: `, actionName)
    if (!this._actionStates[actionName]) {
      this._actionStates[actionName] = { loading: false, error: null }
    }
    this._actionDep.depend()
    return this._actionStates[actionName]
  }
  _setActionState(actionName, val) {
    this._actionStates[actionName] = val
    this._actionDep.changed()
    flush()
  }
  get version() {
    const arr = []
    function parse(val) {
      if (val instanceof Model) {
        return arr.push(val.version)
      }
      if (Array.isArray(val)) {
        return val.map(item => parse(item))
      }
      if (isPlainObject(val)) {
        return mapValues(val, item => parse(item))
      }
    }
    each(this._state, (val, key) => {
      const dep = this._stateDeps[key]
      dep.depend()
      arr.push(dep.version)
      parse(val)
    })
    return arr.join(';')
  }
  /**
   * @returns {Object} currentState
   */
  toJS() {
    function parse(val) {
      if (val instanceof Model) {
        return val.toJS()
      }
      if (Array.isArray(val)) {
        return val.map(item => parse(item))
      }
      if (isPlainObject(val)) {
        return mapValues(val, item => parse(item))
      }
      return val
    }
    return mapValues(this._state, (val, key) => {
      this._stateDeps[key].depend()
      return parse(val)
    })
  }
}

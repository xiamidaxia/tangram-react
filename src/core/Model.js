import { Dependency } from '../core/Tracker'
import { each, mapValues, isPlainObject } from '../common/utils'
import Monitor from './Monitor'
import globalMonitor from './globalMonitor'
export function geProperty(key) {
  return {
    enumerable: true,
    configurable: false,
    get() {
      this._dep.depend()
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
        this._changed()
      }
      this._state[key] = newState
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
    this._dep = new Dependency
    this._actionDep = new Dependency
    this._actionKeys = []
    this._actionStates = {}
    this.monitor = opts.monitor || globalMonitor
    this._state = {}
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
        state[key] = val
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
    let changed = false
    each(state, (val, key) => {
      if (!_state.hasOwnProperty(key)) {
        throw new Error(`[${this.constructor.name}] Unknown state "${key}"`)
      }
      if (typeof this._initialState[key] === 'function') {
        val = this._initialState[key].call(this, val, false)
      }
      if (!this.isEqual(this._state[key], val)) {
        changed = true
      }
      _state[key] = val
    })
    if (changed) {
      this._changed()
    }
  }
  _changed() {
    this._dep.changed()
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
  }
  /**
   * @returns {Object} currentState
   */
  toJS() {
    this._dep.depend()
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
    return mapValues(this._state, val => parse(val))
  }
}

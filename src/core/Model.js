import Tracker from '../common/Tracker'
import { Dependency } from '../common/Tracker'
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
      if (!this.isEqual(this._state[key], newState)) {
        this._changed()
      }
      this._state[key] = newState
      // throw new Error(`Cannot set _state outside the model, please use "action" instead.`)
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
    this._initStateAndActionKeys()
    this.setState(initState || {})
  }

  /**
   * Create state
   * @private
   */
  _initStateAndActionKeys() {
    const constructors = []
    let constructor = this.constructor
    const actionKeys = {}
    while (constructor !== Model) {
      constructors.push(constructor)
      constructor = Object.getPrototypeOf(constructor)
    }
    this._state = constructors.reduceRight((state, c) => {
      const keys = c._actionKeys || []
      keys.forEach(key => actionKeys[key] = true)
      return { ...state, ...c._initialState }
    }, this._state)
    this._actionKeys = Object.keys(actionKeys)
  }

  /**
   * Set state and trigger dependency
   * @param {Object} state - target state
   */
  setState(state = {}) {
    const newState = { ...this._state }
    let changed = false
    each(state, (val, key) => {
      if (!newState.hasOwnProperty(key)) {
        throw new Error(`[${this.constructor.name}] Unknown state "${key}"`)
      }
      if (!this.isEqual(this._state[key], val)) {
        changed = true
      }
      newState[key] = val
    })
    if (changed) {
      this._state = newState
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
    Tracker.flush()
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

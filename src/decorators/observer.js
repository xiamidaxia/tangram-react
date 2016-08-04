import React, { Component, PropTypes } from 'react'
import { CONTEXT_NAME } from '../common/constants'
import Model from '../core/Model'
import Computation from '../core/Tracker/Computation'
export function patchComponent(TargetComponent) {
  const reactiveMixin = {
    shouldComponentUpdate(nextProps, nextState) {
      // update on any state changes (as is the default)
      if (this.state !== nextState) {
        return true
      }
      const keys = Object.keys(this.props)
      if (keys.length !== Object.keys(nextProps).length) {
        return true
      }
      let key
      for (let i = 0; i < keys.length; i++) {
        key = keys[i]
        const newValue = nextProps[key]
        if (newValue !== this.props[key]) {
          return true
        } else if (newValue && typeof newValue === 'object' && !(newValue instanceof Model)) {
          return true
        }
      }
      // check observer depend version
      if (this._computation.dependVersion === this._computation.computeDependVersion()) {
        return true
      }
      return false
    },
    componentWillUnmount() {
      this._computation.stop()
    },
  }

  function patch(target, funcName) {
    const base = target[funcName]
    const mixinFunc = reactiveMixin[funcName]
    if (!base) {
      target[funcName] = mixinFunc
    } else {
      if (funcName === 'shouldComponentUpdate') {
        target[funcName] = function patched() {
          return base.apply(this, arguments) && mixinFunc.apply(this, arguments)
        }
      } else {
        target[funcName] = function patched() {
          base.apply(this, arguments)
          mixinFunc.apply(this, arguments)
        }
      }
    }
  }
  const proto = TargetComponent.prototype
  ;[
    'componentWillUnmount',
    'shouldComponentUpdate',
  ].forEach((funcName) => patch(proto, funcName))
  // patch render
  const originRender = proto.render
  proto.render = function render() {
    let renderResult
    if (this._computation) this._computation.stop()
    this._computation = new Computation(() => {
      if (this._computation.firstRun) {
        renderResult = originRender.call(this)
      } else {
        setTimeout(() => {
          this.setState({
            _computationVersion: this._computation.dependVersion,
          })
        })
      }
    })
    this._computation.compute()
    return renderResult
  }
}
/**
 * decorator `@observer`
 * @param {String | Array<String> | Object } models - target models
 * @returns {Function}
 */
export default function observerDecorator(models = {}) {
  let modelKeys
  if (typeof models === 'string') {
    models = [...arguments]
  }
  if (Array.isArray(models)) {
    modelKeys = models
  } else {
    modelKeys = Object.keys(models)
  }
  return function observerWrap(TargetComponent) {
    patchComponent(TargetComponent)
    class ObserverContainer extends Component {
      static contextTypes = {
        [CONTEXT_NAME]: PropTypes.object,
      }

      constructor() {
        super(...arguments)
        const context = this.context[CONTEXT_NAME]
        this._contextProps = {}
        if (context) {
          context.checkModels(models)
          this._contextProps = context.pick(...modelKeys)
        }
      }

      render() {
        return <TargetComponent {...this._contextProps} {...this.props} />
      }
    }
    return ObserverContainer
  }
}

import React, { Component, PropTypes } from 'react'
import { CONTEXT_NAME } from '../common/constants'
import { autorun } from '../core/Tracker'
export function patchComponent(TargetComponent) {
  const reactiveMixin = {
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
      target[funcName] = function patched() {
        base.apply(this, arguments)
        mixinFunc.apply(this, arguments)
      }
    }
  }
  const proto = TargetComponent.prototype
  ;[
    'componentWillUnmount',
  ].forEach((funcName) => patch(proto, funcName))
  // patch render
  const originRender = proto.render
  proto.render = function render() {
    let renderResult
    if (this._computation) this._computation.stop()
    this._computation = autorun((c) => {
      this._computation = c
      if (c.firstRun) {
        renderResult = originRender.call(this)
      } else {
        setTimeout(() => this.forceUpdate(), 0)
      }
    })
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

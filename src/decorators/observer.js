import React, { Component } from 'react'
import { CONTEXT_NAME } from '../common/constants'
import { autorun } from '../common/Tracker'
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
    const reactiveMixin = {
      componentWillMount() {
        const originRender = this.render.bind(this)
        this.render = function render() {
          let renderResult
          this._computation = autorun((c) => {
            if (c.firstRun) {
              renderResult = originRender()
            } else {
              this.forceUpdate()
            }
          })
          return renderResult
        }
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
        target[funcName] = function patched() {
          base.apply(this, arguments)
          mixinFunc.apply(this, arguments)
        }
      }
    }
    [
      'componentWillMount',
      'componentWillUnmount',
    ].forEach((funcName) => patch(TargetComponent.prototype, funcName))
    class ObserverContainer extends Component {
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
    // addContextToComponent(ObserverContainer);
    return ObserverContainer
  }
}

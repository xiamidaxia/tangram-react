import React, { Component, PropTypes } from 'react'
import { CONTEXT_NAME } from '../common/constants'
import { patchComponent } from './observer'
import Context from '../core/Context'

function addContextToComponent(TargetComponent) {
  TargetComponent.contextTypes = {
    [CONTEXT_NAME]: PropTypes.object.isRequired,
    ...TargetComponent.contextTypes,
  }
}

export default function storeDecorator(initData, opts = {}) {
  return function contextWrap(TargetComponent) {
    addContextToComponent(TargetComponent)
    patchComponent(TargetComponent)
    return class ContextContainer extends Component {
      static childContextTypes = {
        [CONTEXT_NAME]: PropTypes.object.isRequired,
      }
      constructor() {
        super(...arguments)
        if (initData instanceof Context) {
          this[CONTEXT_NAME] = initData
        } else {
          const parentContext = this.getParentContext()
          this[CONTEXT_NAME] = new Context(initData, { ...opts, parentContext })
        }
      }
      getChildContext() {
        return {
          [CONTEXT_NAME]: this[CONTEXT_NAME],
        }
      }
      componentWillUnmount() {
        this[CONTEXT_NAME].destroy()
      }
      getParentContext() {
        return this.context[CONTEXT_NAME]
      }
      render() {
        return <TargetComponent {...this[CONTEXT_NAME].data} {...this.props} />
      }
    }
  }
}

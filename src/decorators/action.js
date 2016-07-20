let nextId = 1

function getActionStack(actionContext) {
  return {
    ...actionContext.__context,
    children: actionContext.__context.children.map(c => getActionStack(c)),
  }
}

export default function actionDecorator(proto, name, desc) {
  const constructor = proto.constructor
  if (!constructor.hasOwnProperty('_actionKeys')) {
    constructor._actionKeys = []
  }
  constructor._actionKeys.push(name)
  const actionFn = desc.initializer ? desc.initializer() : desc.value
  if (typeof actionFn !== 'function') {
    throw new Error('@action must be a function.')
  }
  delete desc.initializer
  desc.writable = false
  desc.value = function actionWrap(...args) {
    const actionContext = {
      __context: {
        id: nextId ++,
        name,
        loading: true,
        isRoot: !this.__context,
        model: this.__context ? this.__context.model : this,
        error: null,
        result: null,
        args,
        children: [],
      },
    }
    if (this.__context) {
      this.__context.children.push(actionContext)
    }
    actionContext.__proto__ = this
    const response = (result) => {
      Object.keys(actionContext).forEach((key) => {
        if (key !== '__context') {
          this[key] = actionContext[key]
        }
      })
      actionContext.__context.loading = false
      actionContext.__context.result = result
      this._setActionState(name, { loading: false, error: null })
      this.monitor.dispatch(getActionStack(actionContext))
      return result
    }
    const reject = (e) => {
      this._setActionState(name, { loading: false, error: e })
      actionContext.__context.loading = false
      actionContext.__context.error = e
      this.monitor.dispatch(getActionStack(actionContext))
      throw e
    }
    this._setActionState(name, { loading: true, error: null })
    this.monitor.dispatch(getActionStack(actionContext))
    let res
    try {
      res = actionFn.apply(actionContext, args)
    } catch (e) {
      reject(e)
    }
    if (res && typeof res.then === 'function') {
      return res.then(response).catch(reject)
    }
    return response(res)
  }
  return desc
}

import { geProperty } from '../core/Model'

export default function stateDecorator(proto, name, desc) {
  const constructor = proto.constructor
  if (!constructor.hasOwnProperty('_initialState')) {
    constructor._initialState = {}
  }
  constructor._initialState[name] = desc.initializer ? desc.initializer() : desc.value
  return geProperty(name)
}

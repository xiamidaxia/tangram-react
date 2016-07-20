import { Model, state } from '../../src'

export default class Todo extends Model {
  @state count = 3
}

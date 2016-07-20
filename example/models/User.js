import { Model, state, action } from '../../src'

export default class User extends Model {
  @state name = 'abc'
  @state age = 3
  @action updateName(name) {
    this.setState({ name })
  }
}

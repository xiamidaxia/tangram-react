import React, { Component, PropTypes } from 'react'
import { observer } from '../../src'

@observer('user', 'todo')
export default class User extends Component {
  static propTypes = {
    user: PropTypes.object,
    todo: PropTypes.object,
  }
  render() {
    return (
      <div>
        {this.props.user.name}
        {this.props.todo.count}
      </div>
    )
  }
}

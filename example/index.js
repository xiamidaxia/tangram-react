import React, { Component, PropTypes } from 'react'
import ReactDOM from 'react-dom'
import './index.less'
import { context } from '../src'
import UserModel from './models/User'
import TodoModel from './models/Todo'
import User from './components/User'
let count = 0
@context({ user: UserModel, todo: TodoModel })
export default class Main extends Component {
  static propTypes = {
    user: PropTypes.instanceOf(UserModel).isRequired,
    todo: PropTypes.instanceOf(TodoModel).isRequired,
  }
  render() {
    const { user, todo } = this.props
    return (
      <div className="container">
        {user.name}
        <User />
        <button onClick={() => { user.updateName(count ++) }}>name</button>
        <button onClick={() => { todo.setState({ count: count++ }) }}>count</button>
      </div>
    )
  }
}

ReactDOM.render(<Main />, document.getElementById('__content'))

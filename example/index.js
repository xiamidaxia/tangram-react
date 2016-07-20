import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import './index.less'
import { observer } from '../src'
import UserModel from './models/User'
import TodoModel from './models/Todo'
const user = new UserModel
const todo = new TodoModel
let count = 0

@observer()
export default class Main extends Component {
  static propTypes = {
  }
  render() {
    return (
      <div className="container">
        {user.name}
        <button onClick={() => { user.updateName(count ++) }}>name</button>
        <button onClick={() => { todo.setState({ count: count++ }) }}>count</button>
      </div>
    )
  }
}

ReactDOM.render(<Main />, document.getElementById('__content'))


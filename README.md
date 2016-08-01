## Tangram

Simple, React state management

## Guide

```javascript
import { Model, action, store, observer, state } from 'tangram-react'
import React, { Component, PropTypes } from 'react'

class UserModel extends Model {
  @state name = 'init name'
  @state age = 23
  @action addAge() {
    this.age ++
  }
}

@observer('user')
class User extends Component {
  static propTypes = {
    user: PropTypes.instanceOf(UserModel).isRequired,
  }
  render() {
    return <div>{this.props.user.age}</div>
  }
}

@store({ user: UserModel })
export default class Main extends Component {
  static propTypes = {
    user: PropTypes.instanceOf(UserModel).isRequired,
  }
  render() {
    const { user } = this.props
    return (
      <div className="container">
        <User />
        <button onClick={() => { user.addAge() }}>addAge</button>
      </div>
    )
  }
}

```

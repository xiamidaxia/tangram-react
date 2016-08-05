## Tangram

Simple, React state management

## Guide

```javascript
import { Model, action, store, observer, state } from 'tangram-react'
import React, { Component, PropTypes } from 'react'

class UserModel extends Model {
  @state name = 'init name'
  @state age = 23
  @state info = null
  constructor() {
    super(...arguments)
    this.fetchUserInfoFromServer()
  }
  @action addAge() {
    this.age ++
  }
  @action async fetchUserInfoFromServer() {
    return fetch('/xxxx.json').then((data) => {
        this.info = data.json()
    })
  }
}

@observer('user')
class User extends Component {
  static propTypes = {
    user: PropTypes.instanceOf(UserModel).isRequired,
  }
  render() {
    const { user } = this.props
    const { loading } = user.getActionState('fetchUserInfoFromServer')
    return <div>
        name: {user.name}
        info: {loading ? 'loading...' : user.info.address}
        age: {user.age}
    </div>
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

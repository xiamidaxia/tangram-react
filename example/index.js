import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import './index.less'
export default class Main extends Component {
  static propTypes = {
  }
  render() {
    return (
      <div className="container">
        Hello World!
      </div>
    )
  }
}

ReactDOM.render(<Main />, document.getElementById('__content'));


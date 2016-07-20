import { expect } from 'chai'
import state from '../../decorators/state'
import action from '../../decorators/action'
import Monitor from '../Monitor'
import Model from '../Model'

describe('Monitor', () => {
  class ActionMonitor extends Monitor {
    log(actionContext) {
      if (actionContext.isRoot) {
        this.currentLog = this.getActionTree(actionContext)
      }
    }
    getActionTree(actionContext, depth = 0) {
      let str = ''
      let _depth = depth
      let state = ''
      while (_depth) {
        str += '  '
        _depth--
      }
      if (actionContext.loading) {
        state = '...'
      }
      if (actionContext.error) {
        state = '!'
      }
      str += actionContext.name + state + '[' + actionContext.args + ']' + '\n'
      actionContext.children.forEach(c => {
        str += this.getActionTree(c, depth + 1)
      })
      return str
    }
  }
  it('should init monitor in Model', () => {
    const monitor = new Monitor
    const m1 = new Model
    const m2 = new Model(null, { monitor })
    expect(m1.monitor).to.instanceOf(Monitor)
    expect(m2.monitor).to.eql(monitor)
    expect(() => new Model(null, { monitor: 'other type' })).to.throw(/must instance of Monitor/)
  })
  it('should log the action tree.', async () => {
    class User extends Model {
      @state name = 'init name'
      @state age = 3

      @action updateName(name) {
        this.name = name
        return true
      }
      @action updateAsync(times) {
        return new Promise((res) => {
          setTimeout(() => {
            this.age++
            res()
          }, times)
        })
      }
      @action async composeAction() {
        this.updateAsync(100)
        await this.nestExec()
      }
      @action async composeAction2() {
        this.updateAsync(100)
        await this.throwError()
      }
      @action async nestExec() {
        await this.updateAsync(5)
        await this.updateAsync(7)
        this.updateName('nest4')
        this.updateName('nest2')
      }
      @action async throwError() {
        return new Promise((res, rej) => {
          setTimeout(() => {
            rej(new Error('an error'))
          }, 10)
        })
      }
    }
    const monitor = new ActionMonitor
    monitor.subscribe((stack) => monitor.log(stack))
    const user = new User(null, { monitor })
    await user.composeAction()
    expect(monitor.currentLog).to.eql(`composeAction[]
  updateAsync...[100]
  nestExec[]
    updateAsync[5]
    updateAsync[7]
    updateName[nest4]
    updateName[nest2]
`)
    try {
      await user.composeAction2()
    } catch (e) {
      expect(e.message).to.eql('an error')
    }
    expect(monitor.currentLog).to.eql(`composeAction2![]
  updateAsync...[100]
  throwError![]
`)
  })
})

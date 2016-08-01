import Model from '../Model'
import { expect } from 'chai'
import state from '../../decorators/state'
import action from '../../decorators/action'
import { autorun } from '../../core/Tracker'
describe('Model', () => {
  it('should init state by @state and initialState', () => {
    function func(val, isInit) {
      expect(isInit).to.eql(true)
      expect(this.constructor.name).to.eql('C')
      return val
    }
    class A extends Model {
      @state override = 'must override'
      @state a = 'a'
    }
    class B extends A {
      @state b = 'b'
      @state func = func
    }
    class C extends B {
      @state c = 'c'
      @state override = 'override success'
    }
    const c = new C({ b: 'override b', func: 'func' })
    expect(c.a).to.eql('a')
    expect(c.b).to.eql('override b')
    expect(c.c).to.eql('c')
    expect(c.override).to.eql('override success')
    expect(c.func).to.eql('func')
    expect(c.toJS()).to.eql({
      a: 'a',
      b: 'override b',
      c: 'c',
      override: 'override success',
      func: 'func',
    })
  })
  it('setState by state function', () => {
    let firstRun = true
    class User extends Model {
      @state age = (val, isInit) => {
        if (firstRun) {
          expect(isInit).to.eql(true)
          firstRun = false
        } else {
          expect(isInit).to.eql(false)
        }
        return val + 1
      }
      @action addAge() {
        this.age ++
      }
      @action addAge2() {
        this.setState({ age: this.age + 1 })
      }
    }
    const user = new User({ age: 10 })
    expect(user.age).to.eql(11)
    user.addAge()
    expect(user.age).to.eql(13)
    user.addAge2()
    expect(user.age).to.eql(15)
  })
  it('toJS', () => {
    const fn = () => { return 'fn'}
    class A extends Model {
      @state a = 'a'
    }
    class B extends A {
      @state b = 'b'
      @state obj = new A
      @state arr = [new A]
      @state reg = /reg/
      @state nul = null
      @state und = undefined
      @state nest = {
        nest: { a: new A, fn },
        arr: [new A],
      }
    }
    const b = new B
    const a = { a: 'a' }
    expect(b.toJS()).to.eql({
      a: 'a',
      b: 'b',
      reg: /reg/,
      obj: a,
      arr: [a],
      nul: null,
      und: undefined,
      nest: {
        nest: { a, fn },
        arr: [a],
      },
    })
  })
  it('setState before and after', () => {
    class User extends Model {
      @state age = 1
      @action setUnknown() {
        this.setState({ age: 2 })
        expect(this.oldState).to.eql(this._state)
      }
    }
    const user = new User
    user.oldState = user._state
    expect(user.oldState).to.eql(user._state)
  })
  it('should throw Error when setting unknown state', () => {
    class User extends Model {
      @action setUnknown() {
        this.setState({ unKnownKey: '' })
      }
    }
    // expect(() => user.name = 'new name').to.throw(/Cannot set state/)
    expect(() => new User({ unKnownKey: '' })).to.throw(/Unknown state "unKnownKey"/)
    expect(() => (new User()).setUnknown()).to.throw(/Unknown state "unKnownKey"/)
  })
  it('should define action by @action', () => {
    expect(() => {
      return class User extends Model { @action f = 3}
    }).to.throw(/must be a function/)
    class A extends Model {
      @action f1() {}
      f4() {}
    }
    class B extends A {
      @action f1() {}
      @action f2 = () => {}
      f3() {}
    }
    expect(A._actionKeys).to.eql(['f1'])
    expect(B._actionKeys).to.eql(['f1', 'f2'])
    const a = new A
    const b = new B
    expect(a._actionKeys).to.eql(['f1'])
    expect(b._actionKeys).to.eql(['f1', 'f2'])
    expect(() => a.f1 = () => {}).to.throw(/read only/)
    expect(a.f1).to.be.a('function')
    expect(b.f2).to.be.a('function')
  })
  it('should exec action sucess by @action', async () => {
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
            this.age ++
            res()
          }, times)
        })
      }
      @action async composeAction() {
        this.updateAsync(100)
        await this.composeAction2()
      }
      @action async composeAction2() {
        await this.updateAsync(5)
        await this.updateAsync(7)
        this.updateName('nest4')
        this.updateName('nest2')
      }
      @action async checkFlush() {
        await this.updateAsync(50)
        await this.updateAsync(100)
        await this.updateAsync(150)
      }
      @action async changeContext() {
        await this.changeContext2()
        return new Promise((res) => {
          setTimeout(() => {
            this.a1 = 'a1'
            res()
          }, 30)
        })
      }
      @action async changeContext2() {
        return new Promise((res) => {
          setTimeout(() => {
            this.a2 = 'a2'
            res()
          }, 30)
        })
      }
    }
    const user = new User
    let autorunTimes = 0
    const c = autorun(() => {
      autorunTimes++
      return user.toJS()
    })
    expect(autorunTimes).to.eql(1)
    const res = user.updateName('newName')
    // sync action
    expect(res).to.eql(true)
    expect(autorunTimes).to.eql(2)
    user.updateName('newName')
    expect(autorunTimes).to.eql(2)
    await user.updateAsync()
    expect(autorunTimes).to.eql(3)
    await user.composeAction()
    expect(autorunTimes).to.eql(7)
    await user.checkFlush()
    // async trigger
    expect(autorunTimes).to.eql(11)
    // change the context
    await user.changeContext()
    expect(user.a1).to.eql('a1')
    expect(user.a2).to.eql('a2')
    c.stop()
    await user.composeAction()
    expect(autorunTimes).to.eql(11)
  })
  it(`@action state`, async () => {
    class User extends Model {
      @action async(times, preCb) {
        preCb()
        return new Promise((res) => {
          setTimeout(() => {
            res()
          }, times)
        })
      }
    }
    const user = new User
    expect(() => user.getActionState('unknown')).to.throw(/Undefined action/)
    let autorunTimes = 0
    autorun(() => {
      autorunTimes ++
      return user.getActionState('async')
    })
    await user.async(10, () => {
      expect(user.getActionState('async').loading).to.eql(true)
    })
    expect(user.getActionState('async').loading).to.eql(false)
  })
  it('@action maybe error', async () => {
    class User extends Model {
      @action syncError() {
        throw new Error('sync error')
      }
      @action asyncError() {
        return Promise.reject(new Error('async error'))
      }
    }
    const user = new User
    expect(() => user.syncError()).to.throw('sync error')
    expect(user.getActionState('syncError').error.message).to.eql('sync error')
    try {
      await user.asyncError()
    } catch (e) {
      expect(e.message).to.eql('async error')
      expect(user.getActionState('asyncError').error.message).to.eql('async error')
    }
  })
  it('set state outside the model', () => {
    class User extends Model {
      @state age = 3
      notAction() { this.age ++ }
      notAction2() { this.setState({ age: this.age + 1 })}
    }
    const user = new User
    expect(() => user.age++).to.throw(/@action/)
    expect(() => user.setState({ age: user.age + 1 })).to.throw(/@action/)
    expect(() => user.notAction()).to.throw(/@action/)
    expect(() => user.notAction2()).to.throw(/@action/)
  })
})

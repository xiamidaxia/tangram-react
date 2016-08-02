import { expect } from 'chai'
import Monitor from '../Monitor'
import globalMonitor from '../globalMonitor'
import Context from '../Context'
import { each } from '../../common/utils'
import Model from '../Model'
import action from '../../decorators/action'
import state from '../../decorators/state'
function waitNextTick() {
  return new Promise((res) => {
    setTimeout(() => res(), 5)
  })
}
describe('Context', () => {
  it('create', () => {
    class User extends Model {}
    const m1 = new Model
    expect(() => new Context({ m1, m2: '' })).to.throw(/Can not find/)
    expect(() => new Context({ m1, m2: String })).to.throw(/must instance/)
    const context = new Context({ m1, m2: Model, m3: User })
    each(context.data, (m) => expect(m).to.instanceOf(Model))
    expect(context.data.m3).to.instanceOf(User)
  })
  it('create parent context', () => {
    const parentContext = new Context({ m1: Model })
    const context = new Context({ m1: 'm1', m2: Model }, { parentContext })
    expect(context.find('m1')).to.eql(parentContext.find('m1'))
    expect(context.monitor).to.eql(parentContext.monitor)
  })
  it('monitor', () => {
    const m1 = new Model
    const monitor = new Monitor
    const context = new Context({ m1 })
    expect(context.monitor).to.eql(globalMonitor)
    expect(m1.monitor).to.eql(globalMonitor)
    const context2 = new Context({ m1 }, { monitor })
    expect(context2.monitor).to.eql(monitor)
    expect(m1.monitor).to.eql(monitor)
    const context3 = new Context({ m1 }, { parentContext: context2 })
    expect(context3.monitor).to.eql(monitor)
  })
  it('destroy', () => {
    const monitor = new Monitor
    const context = new Context({}, { monitor })
    expect(context._monitorRemove).to.be.a('function')
    expect(monitor._listeners.length).to.eql(1)
    context.destroy()
    expect(monitor._listeners.length).to.eql(0)
    expect(context._monitorRemove).to.eql(null)
  })
  it('checkModels', () => {
    class User extends Model {}
    const context = new Context({ m1: Model, m2: User })
    expect(() => context.checkModels(['m1', 'm3'])).to.throw(/m3/)
    context.checkModels({ m1: Model, m2: Model })
    expect(() => context.checkModels({ m1: User })).to.throw(/not instance/)
    expect(() => context.checkModels({ m1: String })).to.throw(/required Model class/)
    expect(() => context.checkModels({ m3: User })).to.throw(/not find/)
  })
  it('pick, find, findKeyByModel', () => {
    const context = new Context({ m1: Model, m2: Model, m3: Model })
    expect(context.pick('m1', 'm2')).to.eql({ m1: context.data.m1, m2: context.data.m2 })
    expect(context.find('m1')).to.eql(context.data.m1)
    expect(context.findKeyByModel(context.data.m1)).to.eql('m1')
    expect(context.findKeyByModel(context.data.m4)).to.eql(undefined)
    expect(() => context.pick('m4')).to.throw(/not find/)
    expect(() => context.find('m4')).to.throw(/not find/)
  })
  it('context use', async () => {
    let runTimes = 0
    class Tool extends Model {
      @action use() {}
    }
    class Man extends Model {
      @state name = ''
      @state tool = new Tool
      constructor() {
        super(...arguments)
      }
      @action updateName(name) {
        this.name = name
      }
      @action runOther() {}
    }
    function checkType(context) {
      expect(() => context.init()).to.throw(/need a function/)
      expect(() => context.use([null])).to.throw(/need functions/)
      expect(() => context.autorun()).to.throw(/need a function/)
      expect(() => context.listen()).to.throw(/be a String/)
    }
    function listen(context) {
      context.init((data) => {
        runTimes ++
        expect(data).to.eql(context.data)
      })
      context.autorun((data) => {
        runTimes ++
        expect(data).to.eql(context.data)
      })
      context.listen('man.updateName', ({ action }) => {
        expect(action.name).to.eql('updateName')
        runTimes ++
      })
      context.listen('man', () => {
        runTimes ++
      })
      context.listen('man.tool', () => {
        runTimes ++
      })
      context.listen('man.tool.use', ({ action }) => {
        expect(action.name).to.eql('use')
        runTimes ++
      })
    }
    const context = new Context({ man: Man }, { use: [checkType, listen] })
    const man = context.data.man
    man.updateName('abc')
    man.runOther()
    man.tool.use()
    await waitNextTick()
    expect(runTimes).to.eql(12)
  })
})

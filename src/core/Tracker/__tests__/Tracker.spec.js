import Computation from '../Computation'
import { autorun, Dependency } from '../index'
import { expect } from 'chai'

describe('Tracker', () => {
  it('autorun', () => {
    const a = new Dependency()
    let runTimes = 0
    const compute = autorun((c) => {
      expect(c).to.instanceOf(Computation)
      runTimes ++
      if (runTimes === 1) {
        expect(c.firstRun).to.eql(true)
      }
      if (runTimes !== 2) {
        a.depend()
      }
    })
    expect(compute.firstRun).to.eql(false)
    expect(a.isDepend(compute)).to.eql(true)
    expect(runTimes).to.eql(1)
    a.changed()
    expect(runTimes).to.eql(2)
    a.changed()
    // no depend
    expect(runTimes).to.eql(2)
  })
  it('depend repeatedly', () => {
    const a = new Dependency()
    autorun(() => {
      a.depend()
      a.depend()
    })
    expect(Object.keys(a._deps).length).to.eql(1)
  })
  it('autorun with Dependency changed immediately', () => {
    const a = new Dependency()
    let runTimes = 0
    autorun(() => {
      a.depend()
      a.changed()
      runTimes ++
    })
    a.changed()
    expect(runTimes).to.eql(2)
  })
  it('autorun nested', () => {
    let buf = ''
    const check = (str) => { expect(buf).to.eql(str); buf = '' }
    const a = new Dependency()
    const b = new Dependency()
    const c = new Dependency()
    let c2
    autorun(() => {
      a.depend()
      buf += 'a'
      c2 = autorun(() => {
        b.depend()
        buf += 'b'
        autorun(() => {
          c.depend()
          buf += 'c'
        })
      })
    })
    check('abc')
    a.changed()
    check('abc')
    b.changed()
    check('bc')
    c.changed()
    check('c')
    c2.stop()
    b.changed()
    check('')
    c.changed()
    check('')
    a.changed()
    check('abc')
    b.changed()
    check('bc')
  })
})

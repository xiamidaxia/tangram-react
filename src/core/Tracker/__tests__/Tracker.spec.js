import Computation from '../Computation'
import { autorun, Dependency, flush } from '../index'
import { expect } from 'chai'

describe('Tracker', () => {
  function changed(dep) {
    dep.changed()
    flush(true)
  }
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
    changed(a)
    expect(runTimes).to.eql(2)
    changed(a)
    // no depend
    expect(runTimes).to.eql(2)
  })
  it('depend repeatedly', () => {
    const a = new Dependency()
    autorun(() => {
      a.depend()
      a.depend()
    })
    expect(a._deps.length).to.eql(1)
  })
  it('autorun with Dependency changed immediately', () => {
    const a = new Dependency()
    let runTimes = 0
    autorun(() => {
      a.depend()
      changed(a)
      runTimes ++
    })
    changed(a)
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
    changed(a)
    check('abc')
    changed(b)
    check('bc')
    changed(c)
    check('c')
    c2.stop()
    changed(b)
    check('')
    changed(c)
    check('')
    changed(a)
    check('abc')
    changed(b)
    check('bc')
  })
  it('computation nested', () => {
    const a = new Dependency
    const b = new Dependency
    const c = new Dependency
    let childRunTimes = 0
    let parentRunTimes = 0
    let child
    const parent = new Computation(() => {
      a.depend()
      b.depend()
      if (!child) {
        child = new Computation(() => {
          a.depend()
          c.depend()
          childRunTimes ++
        })
      }
      child.compute()
      parentRunTimes ++
    })
    parent.compute()
    expect(parent._dependVersion).to.eql(a.version + ',' + b.version)
    expect(child._dependVersion).to.eql(a.version + ',' + c.version)
    changed(a)
    expect(childRunTimes).to.eql(2)
    expect(parentRunTimes).to.eql(2)
    changed(b)
    expect(parentRunTimes).to.eql(3)
    expect(childRunTimes).to.eql(2)
    changed(c)
    expect(parentRunTimes).to.eql(3)
    expect(childRunTimes).to.eql(3)
  })
})

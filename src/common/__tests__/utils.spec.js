import { expect } from 'chai'
import { isPlainObject } from '../utils'
describe('utils', () => {
  it('returns true only if plain object', () => {
    function Test() {
      this.prop = 1
    }

    expect(isPlainObject(new Test())).to.eql(false)
    expect(isPlainObject(new Date())).to.eql(false)
    expect(isPlainObject([1, 2, 3])).to.eql(false)
    expect(isPlainObject(/reg/)).to.eql(false)
    expect(isPlainObject(null)).to.eql(false)
    expect(isPlainObject(() => {})).to.eql(false)
    expect(isPlainObject()).to.eql(false)
    expect(isPlainObject({ 'x': 1, 'y': 2 })).to.eql(true)
  })
})

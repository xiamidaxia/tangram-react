const fnToString = (fn) => Function.prototype.toString.call(fn)
const objStringValue = fnToString(Object)
/**
 * Applies a function to every key-value pair inside an object.
 *
 * @param {Object} obj - The source object.
 * @param {Function} fn - The mapper function that receives the value and the key.
 * @param {Object?} res - Result object
 * @returns {Object} A new object that contains the mapped values for the keys.
 */
export function mapValues(obj, fn, res = {}) {
  return Object.keys(obj).reduce((result, key) => {
    result[key] = fn(obj[key], key)
    return result
  }, res)
}
export function each(obj = {}, fn) {
  Object.keys(obj).forEach((key) => {
    fn(obj[key], key)
  })
}
/**
 * @param {any} obj The object to inspect.
 * @returns {boolean} True if the argument appears to be a plain object.
 */
export function isPlainObject(obj) {
  if (!obj || typeof obj !== 'object') {
    return false
  }

  const proto = typeof obj.constructor === 'function' ? Object.getPrototypeOf(obj) : Object.prototype

  if (proto === null) {
    return true
  }

  const constructor = proto.constructor

  return typeof constructor === 'function'
    && constructor instanceof constructor
    && fnToString(constructor) === objStringValue
}

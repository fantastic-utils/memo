const Benchmark = require('benchmark');
const { memo } = require('../dist/cjs');
const { memoizeWithArgs } = require('proxy-memoize');
const memoizeState = require('memoize-state');

const suite = new Benchmark.Suite;

const shallowCompare = (objA, c) => (objA.a.a.a.a.a + c);
const memoFn = memo(shallowCompare, { shouldCompare(newArgs, cachedProxyArgsCfg) {
  size = newArgs.length;
  let changed = false;
  for (let i = 0; i < size; i++ ) {
    changed = !Object.is(newArgs[i], cachedProxyArgsCfg[i]?.r);
    if (changed) break;
  }
  return changed;
} });
const memoizeFn = memoizeWithArgs(shallowCompare);
const memoizeStateFn = memoizeState.default(shallowCompare);

const obj = { a: { a: { a: { a: { a: 1 } } } } };
// enable cache
memoFn(obj, 2);
memoizeFn(obj, 2);
memoizeStateFn(obj, 2);

// shallow compare
suite
.add('@fantastic-utils/memo deep', function() {
  memoFn(obj, 2);
})
.add('proxy-memoize deep', function() {
  memoizeFn(obj, 2);
})
.add('memoize-state deep', function() {
  memoizeStateFn(obj, 2);
})
.on('cycle', function(event) {
  console.log(String(event.target));
})
.on('complete', function() {
  console.log('Fastest is ' + this.filter('fastest').map('name'));
})
.run({ 'async': true });

/**
 *
 * @fantastic-utils/memo deep x 82,670,951 ops/sec ±2.32% (85 runs sampled)
 * proxy-memoize deep x 779,043 ops/sec ±3.83% (85 runs sampled)
 * memoize-state deep x 22,624,061 ops/sec ±1.82% (81 runs sampled)
 *
 * Fastest is @fantastic-utils/memo deep
 *
 */
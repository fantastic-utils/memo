const Benchmark = require('benchmark');
const { memo } = require('../dist/cjs');
const { memoizeWithArgs } = require('proxy-memoize');
const memoizeOne = require('memoize-one');
const memoizeState = require('memoize-state');

const suite = new Benchmark.Suite;

const shallowCompare = (objA, arrA, n) => (objA.a + arrA[0] + n);
const memoFn = memo(shallowCompare, { objectShallowCompare: true });
const memoizeFn = memoizeWithArgs(shallowCompare, { noWeakMap: true });
const memoizeOneFn = memoizeOne(shallowCompare);
const memoizeStateFn = memoizeState.default(shallowCompare, { shallowCheck: true });

const obj = { a: 1 };
const arr = [2];
// enable cache
memoFn(obj, arr, 3);
memoizeFn(obj, arr, 3);
memoizeOneFn(obj, arr, 3);
memoizeStateFn(obj, arr, 3);

// shallow compare
suite
.add('@fantastic-utils/memo shallow', function() {
  memoFn(obj, arr, 3);
})
.add('proxy-memoize shallow', function() {
  memoizeFn(obj, arr, 3);
})
.add('memoize-one shallow', function() {
  memoizeOneFn(obj, arr, 3);
})
.add('memoize-state shallow', function() {
  memoizeStateFn(obj, arr, 3);
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
 * @fantastic-utils/memo shallow x 26,180,311 ops/sec ±1.04% (89 runs sampled)
 * proxy-memoize shallow x 1,120,131 ops/sec ±1.29% (86 runs sampled)
 * memoize-one shallow x 17,569,314 ops/sec ±1.66% (83 runs sampled)
 * memoize-state shallow x 18,697,192 ops/sec ±3.24% (86 runs sampled)
 *
 * Fastest is @fantastic-utils/memo shallow
 *
 */
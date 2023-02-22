# @fantastic-utils/memo

A memo library which can be used in many cases, this library is inspired by `memoize-one`, `proxy-memoize`, `async-memoize-one`, and have more feature to support different use cases.

[![NPM version](https://img.shields.io/npm/v/@fantastic-utils/memo.svg?style=flat)](https://npmjs.org/package/@fantastic-utils/memo)
[![NPM downloads](http://img.shields.io/npm/dm/@fantastic-utils/memo.svg?style=flat)](https://npmjs.org/package/@fantastic-utils/memo)

## Difference with others

`memoize-one` and `proxy-memoize` are great, but they are only for some general cases, as many tools and libraries are designed in a special way, so some corner case can't be handled correctly, so this library build up for solving this issue.

- `memoize-one`: use shallow compare as a straightforward way.
- `proxy-memoize`: is build on `proxy-compare` which author designed as a stateless library, and `proxy-memoize` use its markup key to compare old object and new object.

As many library now use the `Proxy` feature, and `Proxy` always work with `Scope` feature, so we can't always simply treat object as a immutable value, especially in some library design, maybe that's we wanted, so This library give an another choice to control the logic, not just a dead code.

## Installation

```bash
npm install @fantastic-utils/memo

```

## Usage

this library contains `memo` and `memoAsync`.

```javascript
import { memo, memoAsync, original } from '@fantastic-utils/memo';

// Basic cache
const add = (a, b) => a + b;
const memoAdd = memo(add);
memoAdd(1, 2); // 3
memoAdd(1, 2); // 3 from cache

// Deep cache
const add = (objA, arrayB) => objA.a + objB[0];
const memoAdd = memo(add);
memoAdd({ a: 1 }, [2]); // 3
memoAdd({ a: 1 }, [2]); // 3 from cache

// Async cache
const add = async (a, b) => await (a + b);
const memoAdd = memoAsync(add);
await memoAdd(1, 2); // 3
await memoAdd(1, 2); // 3

// Shallow compare
const add = (objA, b) => objA.a + b;
const memoAdd = memo(add, { objectShallowCompare: true });
const obj = { a: 1 };
memoAdd(obj, 2); // 3
obj.a = 2;
memoAdd(obj, 2); // 3 from cache

// console log raw data, as argument is wrapped by proxy
const add = (objA, b) => {
  console.log(original(objA));
  return objA.a + b;
};
```

### Reference

```ts
// memo function
memo(fn, memo: MemoConfig): fn
// async memo function
memoAsync(fn, memo: MemoConfig): fn
// Get raw object, as arg are wrapped by proxy
original(arg): object
```

```ts
export interface MemoConfig {
  objectShallowCompare?: boolean;
  shouldCompare?: (args?: any[], cachedArgsCfg?: NormalizeArgCfg[]) => boolean;
  isChanged?: (args?: any[], cachedArgsCfg?: NormalizeArgCfg[]) => boolean;
}

/**
 * @param t The Type
 * @param v The normalized value
 * @param r The raw value
 * @param a The affected info
 */
export interface NormalizeArgCfg {
  t: string;
  v: unknown;
  r: unknown;
  a: Affected;
}
```

## Advance Usage

### shouldCompare

**API: `function(newArgs: any[], cachedArgsCfg: NormalizeArgCfg[]): boolean`.**

`shouldCompare` let user to determine whether to compare args with default compare logic or not,

```javascript
import { memo } from '@fantastic-utils/memo';

const add = (a, b) => a + b;
const memoAdd = memo(add, {
  shouldCompare(newArgs, cachedArgCfg) {
    return newArgs[0] === 1;
  },
});
memoAdd(1, 2); // 3
memoAdd(1, 2); // 3 from cache
expect(memoAdd).toBeCalledTimes(1); // only call once
```

### isChanged

**API: `function(newArgs: any[], cachedArgsCfg: NormalizeArgCfg[]): boolean`.**

`isChanged` is a high level api than `shouldCompare` to control all compare logic.

```javascript
import { memo } from '@fantastic-utils/memo';

const add = (a, b) => a + b;
const memoAdd = memo(add, {
  isChanged(newArgs, cachedArgCfg) {
    return newArgs[0] === 1;
  },
});
memoAdd(1, 2); // 3
memoAdd(1, 2); // 3 from re-run function
expect(memoAdd).toBeCalledTimes(2); // call twice
```

### Difference between `shouldCompare` and `isChanged`

The biggest difference between `shouldCompare` and `isChanged` is that `shouldCompare` control how to use cache, and `isChanged` control how to compare. sometimes `shouldCompare` used to improve performance, and `isChanged` used to customize compare logic.

Please refer to above code see the compare detail.

## Performance compare

Benchmark code pls refer to `__benchmark__` folder.

```bash
@fantastic-utils/memo deep x 82,670,951 ops/sec ±2.32% (85 runs sampled)
proxy-memoize deep x 779,043 ops/sec ±3.83% (85 runs sampled)
memoize-state deep x 22,624,061 ops/sec ±1.82% (81 runs sampled)

Fastest is @fantastic-utils/memo deep
```

```bash
@fantastic-utils/memo shallow x 26,180,311 ops/sec ±1.04% (89 runs sampled)
proxy-memoize shallow x 1,120,131 ops/sec ±1.29% (86 runs sampled)
memoize-one shallow x 17,569,314 ops/sec ±1.66% (83 runs sampled)
memoize-state shallow x 18,697,192 ops/sec ±3.24% (86 runs sampled)

Fastest is @fantastic-utils/memo shallow
```

## Develop

```bash
$ npm install
```

```bash
$ npm run dev
$ npm run build
```

## LICENSE

MIT

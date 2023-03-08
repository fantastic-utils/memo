import { memo, memoAsync } from '../src';

describe('Basic Test', () => {
  test('Function work correctly', () => {
    const add = (a, b) => a + b;
    const memoAdd = memo(add);
    expect(memoAdd(1, 2)).toBe(3);
  });

  test('Function use cache', () => {
    const mockAdd = jest.fn((a, b) => a + b);
    const memoAdd = memo(mockAdd);
    expect(memoAdd(1, 2)).toBe(3);
    expect(memoAdd(1, 2)).toBe(3);
    expect(mockAdd).toBeCalledTimes(1);
  });

  test('Function not use cache', () => {
    const mockAdd = jest.fn((a, b) => a + b);
    const memoAdd = memo(mockAdd);
    expect(memoAdd(1, 2)).toBe(3);
    expect(memoAdd(1, 3)).toBe(4);
    expect(mockAdd).toBeCalledTimes(2);
  });

  test('Function different arguments length', () => {
    const mockAdd = jest.fn((a, b, c) => a + b + (c ? c : 0));
    const memoAdd = memo(mockAdd);
    expect(memoAdd(1, 2)).toBe(3);
    expect(memoAdd(1, 2, 1)).toBe(4);
    expect(memoAdd(1, 2)).toBe(3);
    expect(mockAdd).toBeCalledTimes(3);
  });

  test('Cache work correctly', () => {
    const mockAdd = jest.fn(
      (objA, objB, arrA, strNumB, numC) =>
        objA.n + objB.objI.n + arrA[0] + parseInt(strNumB) + numC
    );
    const memoAdd = memo(mockAdd);
    const obj1 = { n: 1 };
    const obj2 = { objI: { n: 2 } };
    const arr1 = [1, 2];
    expect(memoAdd(obj1, obj2, arr1, '3', 4)).toBe(11);
    expect(mockAdd).toBeCalledTimes(1);
    obj1.m = 2;
    obj2.m = 3;
    obj2.objI.m = 3;
    expect(memoAdd(obj1, obj2, arr1, '3', 4)).toBe(11);
    expect(mockAdd).toBeCalledTimes(1);

    obj1.n = 2;
    expect(memoAdd(obj1, obj2, arr1, '3', 4)).toBe(12);
    expect(mockAdd).toBeCalledTimes(2);

    obj1.n = 3;
    obj2.objI.n = 3;
    expect(memoAdd(obj1, obj2, arr1, '3', 4)).toBe(14);
    expect(mockAdd).toBeCalledTimes(3);

    arr1[1] = 3;
    expect(memoAdd(obj1, obj2, arr1, '3', 4)).toBe(14);
    expect(mockAdd).toBeCalledTimes(3);

    arr1[0] = 2;
    expect(memoAdd(obj1, obj2, arr1, '3', 4)).toBe(15);
    expect(mockAdd).toBeCalledTimes(4);
  });

  test('Object shallow compare', () => {
    const mockAdd = jest.fn((objA, strNumB, numC) => objA.n + parseInt(strNumB) + numC);
    const memoAdd = memo(mockAdd, { objectShallowCompare: true });
    const obj = { n: 1 };
    expect(memoAdd(obj, '2', 3)).toBe(6);
    obj.n = 2;
    expect(memoAdd(obj, '2', 3)).toBe(6);
    expect(mockAdd).toBeCalledTimes(1);
  });

  test('Has symbol key compare', () => {
    const testObj = {};
    const symbolKey = Symbol('a');
    const mockHas = jest.fn((objA) => symbolKey in objA);
    const memoHas = memo(mockHas);

    expect(Object.hasOwn(testObj, symbolKey)).toBe(false);

    expect(memoHas(testObj)).toBe(false);
    expect(mockHas).toBeCalledTimes(1);

    expect(memoHas(testObj)).toBe(false);
    expect(mockHas).toBeCalledTimes(1);

    testObj[symbolKey] = 'value';
    expect(memoHas(testObj)).toBe(true);
    expect(mockHas).toBeCalledTimes(2);

    expect(memoHas(testObj)).toBe(true);
    expect(mockHas).toBeCalledTimes(2);
  });

  test('Has string key compare', () => {
    const testObj = {};
    const stringKey = 'a';
    const mockHas = jest.fn((objA) => stringKey in objA);
    const memoHas = memo(mockHas);

    expect(Object.hasOwn(testObj, stringKey)).toBe(false);

    expect(memoHas(testObj)).toBe(false);
    expect(mockHas).toBeCalledTimes(1);

    expect(memoHas(testObj)).toBe(false);
    expect(mockHas).toBeCalledTimes(1);

    testObj[stringKey] = 'value';
    expect(memoHas(testObj)).toBe(true);
    expect(mockHas).toBeCalledTimes(2);

    expect(memoHas(testObj)).toBe(true);
    expect(mockHas).toBeCalledTimes(2);
  });

  test('Has own string property key compare', () => {
    const testObj = {};
    const stringKey = 'a';
    const mockHas = jest.fn((objA) => objA.hasOwnProperty(stringKey));
    const memoHas = memo(mockHas);

    expect(Object.hasOwn(testObj, stringKey)).toBe(false);

    expect(memoHas(testObj)).toBe(false);
    expect(mockHas).toBeCalledTimes(1);

    expect(memoHas(testObj)).toBe(false);
    expect(mockHas).toBeCalledTimes(1);

    testObj[stringKey] = 'value';
    expect(memoHas(testObj)).toBe(true);
    expect(mockHas).toBeCalledTimes(2);

    expect(memoHas(testObj)).toBe(true);
    expect(mockHas).toBeCalledTimes(2);
  });

  test('Has own symbol property key compare', () => {
    const testObj = {};
    const symbolKey = Symbol('a');
    const mockHas = jest.fn((objA) => objA.hasOwnProperty(symbolKey));
    const memoHas = memo(mockHas);

    expect(Object.hasOwn(testObj, symbolKey)).toBe(false);

    expect(memoHas(testObj)).toBe(false);
    expect(mockHas).toBeCalledTimes(1);

    expect(memoHas(testObj)).toBe(false);
    expect(mockHas).toBeCalledTimes(1);

    testObj[symbolKey] = 'value';
    expect(memoHas(testObj)).toBe(true);
    expect(mockHas).toBeCalledTimes(2);

    expect(memoHas(testObj)).toBe(true);
    expect(mockHas).toBeCalledTimes(2);
  });

  test('Has own string key compare', () => {
    const testObj = {};
    const stringKey = 'a';
    const mockHas = jest.fn((objA) => Object.hasOwn(objA, stringKey));
    const memoHas = memo(mockHas);

    expect(Object.hasOwn(testObj, stringKey)).toBe(false);

    expect(memoHas(testObj)).toBe(false);
    expect(mockHas).toBeCalledTimes(1);

    expect(memoHas(testObj)).toBe(false);
    expect(mockHas).toBeCalledTimes(1);

    testObj[stringKey] = 'value';
    expect(memoHas(testObj)).toBe(true);
    expect(mockHas).toBeCalledTimes(2);

    expect(memoHas(testObj)).toBe(true);
    expect(mockHas).toBeCalledTimes(2);
  });

  test('Has own symbol key compare', () => {
    const testObj = {};
    const symbolKey = Symbol('a');
    const mockHas = jest.fn((objA) => Object.hasOwn(objA, symbolKey));
    const memoHas = memo(mockHas);

    expect(Object.hasOwn(testObj, symbolKey)).toBe(false);

    expect(memoHas(testObj)).toBe(false);
    expect(mockHas).toBeCalledTimes(1);

    expect(memoHas(testObj)).toBe(false);
    expect(mockHas).toBeCalledTimes(1);

    testObj[symbolKey] = 'value';
    expect(memoHas(testObj)).toBe(true);
    expect(mockHas).toBeCalledTimes(2);

    expect(memoHas(testObj)).toBe(true);
    expect(mockHas).toBeCalledTimes(2);
  });

  test('Own keys via Object.keys', () => {
    const testObj = {};
    const mockAllKeys = jest.fn((objA) => Object.keys(objA));
    const memoAllKeys = memo(mockAllKeys);

    memoAllKeys(testObj);
    expect(mockAllKeys).toBeCalledTimes(1);

    memoAllKeys(testObj);
    expect(mockAllKeys).toBeCalledTimes(1);

    testObj.a = 1;
    memoAllKeys(testObj);
    expect(mockAllKeys).toBeCalledTimes(2);

    memoAllKeys(testObj);
    expect(mockAllKeys).toBeCalledTimes(2);
  });

  test('Own keys via for...in', () => {
    const testObj = {};
    const mockAllKeys = jest.fn((objA) => {
      for (let key in objA) {}
    });
    const memoAllKeys = memo(mockAllKeys);

    memoAllKeys(testObj);
    expect(mockAllKeys).toBeCalledTimes(1);

    memoAllKeys(testObj);
    expect(mockAllKeys).toBeCalledTimes(1);

    testObj.a = 1;
    memoAllKeys(testObj);
    expect(mockAllKeys).toBeCalledTimes(2);

    memoAllKeys(testObj);
    expect(mockAllKeys).toBeCalledTimes(2);
  });
});

describe('Customize Test', () => {
  test('should compare', () => {
    const mockAdd = jest.fn((a, objB) => a + objB.b);
    const memoAdd = memo(mockAdd, { shouldCompare(newArgs, cachedArgsCfg) {
      return newArgs[0] === 1;
    } });
    expect(memoAdd(1, { b: 2 })).toBe(3);
    expect(mockAdd).toBeCalledTimes(1);

    expect(memoAdd(1, { b: 2 })).toBe(3);
    expect(mockAdd).toBeCalledTimes(1);

    expect(memoAdd(2, { b: 2 })).toBe(3);
    expect(mockAdd).toBeCalledTimes(1);

    expect(memoAdd(1, { b: 4 })).toBe(5);
    expect(mockAdd).toBeCalledTimes(2);
  });

  test('Customize compare', () => {
    const mockAdd = jest.fn((a, objB) => a + objB.b);
    const memoAdd = memo(mockAdd, { isChanged(newArgs, cachedArgsCfg) {
      return newArgs[0] === 1;
    } });

    expect(memoAdd(1, { b: 2 })).toBe(3);
    expect(mockAdd).toBeCalledTimes(1);

    expect(memoAdd(1, { b: 2 })).toBe(3);
    expect(mockAdd).toBeCalledTimes(2);

    expect(memoAdd(2, { b: 2 })).toBe(3);
    expect(mockAdd).toBeCalledTimes(2);

    expect(memoAdd(1, { b: 4 })).toBe(5);
    expect(mockAdd).toBeCalledTimes(3);
  });
});

describe('Async', () => {
  test('basic', async () => {
    const mockAdd = jest.fn(async (a, b) => await (a + b));
    const memoAdd = memoAsync(mockAdd);

    expect(await memoAdd(1, 2)).toBe(3);
    expect(mockAdd).toBeCalledTimes(1);
    expect(await memoAdd(1, 2)).toBe(3);
    expect(mockAdd).toBeCalledTimes(1);
    expect(await memoAdd(2, 3)).toBe(5);
    expect(mockAdd).toBeCalledTimes(2);
  });
});

describe('Return value', () => {
  test('Return nested proxy object', () => {
    const obj = { num: { a: 1 } };
    const mockFn = jest.fn((objA) => ({ newNum: objA.num }));
    const memoFn = memo(mockFn);
    expect(memoFn(obj).newNum).toBe(obj.num);
    expect(memoFn(obj).newNum).toBe(obj.num);
    expect(mockFn).toBeCalledTimes(1);
  });

  test('Return nested proxy array', () => {
    const obj = { num: [1,2,3] };
    const mockFn = jest.fn((objA) => ({ newNum: objA.num }));
    const memoFn = memo(mockFn);
    expect(memoFn(obj).newNum).toBe(obj.num);
    expect(memoFn(obj).newNum).toBe(obj.num);
    expect(mockFn).toBeCalledTimes(1);
  });

  // TODO:
  // test('Return circular reference object', () => {
  //   const refObj1 = { a: 1 };
  //   const refObj = { a: refObj1 };
  //   const obj = { num: refObj, num2: refObj };
  //   const mockFn = jest.fn((objA) => ({ newNum: objA.num }));
  //   const memoFn = memo(mockFn);
  //   expect(memoFn(obj).newNum).toBe(obj.num);
  //   expect(memoFn(obj).newNum).toBe(obj.num);
  //   expect(mockFn).toBeCalledTimes(1);
  // });
});
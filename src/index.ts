import { getDataType } from '@fantastic-utils/data-type';

const ORIGINAL_SYMBOL = Symbol('_original');

enum AFFECTED_TYPES {
  KEYS = 'k',
  HAS_KEY = 'h',
  HAS_OWN_KEY = 'o',
  ALL_KEYS = 'a',
}

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
  v: any;
  r: unknown;
  a: Affected;
}

export interface HasKeyArgCfg {
  v: boolean;
}

export interface HasOwnKeyArgCfg {
  v: boolean;
}

export type RecordKey = string | symbol;

export type AffectedKey = Map<RecordKey, NormalizeArgCfg>;
export type AffectedHasKey = Map<RecordKey, HasKeyArgCfg>;
export type AffectedHasOwnKey = Map<RecordKey, HasOwnKeyArgCfg>;
export type AffectedAllKey = [boolean, Array<RecordKey>];

/**
 * @param k The key map which used
 * @param h The key which used in has
 * @param a The key which used in all keys
 */
export interface Used {
  p?: ProxyHandler<any>;
  [AFFECTED_TYPES.KEYS]: AffectedKey;
  [AFFECTED_TYPES.HAS_KEY]: AffectedHasKey;
  [AFFECTED_TYPES.HAS_OWN_KEY]: AffectedHasOwnKey;
  [AFFECTED_TYPES.ALL_KEYS]: AffectedAllKey;
}

export type Affected = WeakMap<object, Used>;

export type PathSet = string;

const defaultShouldCompare = () => true;

// get object prototype
const getProto = Object.getPrototypeOf;

// Properties that are both non-configurable and non-writable will break
// the proxy get trap when we try to return a recursive/child compare proxy
// from them. We can avoid this by making a copy of the target object with
// all descriptors marked as configurable, see `copyTargetObject`.
const needsToCopyTargetObject = (obj: object) =>
  Object.values(Object.getOwnPropertyDescriptors(obj)).some(
    (descriptor) => !descriptor.configurable && !descriptor.writable
  );

// Make a copy with all descriptors marked as configurable.
const copyTargetObject = <T extends object>(obj: T): T => {
  if (Array.isArray(obj)) {
    // Arrays need a special way to copy
    return Array.from(obj) as T;
  }
  // For non-array objects, we create a new object keeping the prototype
  // with changing all configurable options (otherwise, proxies will complain)
  const descriptors = Object.getOwnPropertyDescriptors(obj);
  Object.values(descriptors).forEach((desc) => {
    desc.configurable = true;
  });
  return Object.create(getProto(obj), descriptors);
};

export const original = (proxyTarget: any) => proxyTarget[ORIGINAL_SYMBOL];

export const getUsed = (arg: any, affected: Affected) => {
  let used = affected.get(arg);
  if (!used) {
    used = {
      [AFFECTED_TYPES.KEYS]: new Map(),
      [AFFECTED_TYPES.HAS_KEY]: new Map(),
      [AFFECTED_TYPES.ALL_KEYS]: [false, []],
      [AFFECTED_TYPES.HAS_OWN_KEY]: new Map(),
    };
    affected.set(arg, used);
  }
  return used;
};

const createHandler = <T extends object>(
  arg: T,
  memoCfg: MemoConfig,
  affected: Affected
) => {
  const handler: ProxyHandler<T> = {
    get(target, key) {
      if (key === ORIGINAL_SYMBOL) return arg;
      const keyType = getDataType(key);
      const reflectValue = Reflect.get(target, key);
      if (keyType === 'Symbol') return reflectValue;

      const used = getUsed(arg, affected);
      const affectedKeysMap = used[AFFECTED_TYPES.KEYS];
      const affectedKeyCfg = affectedKeysMap.get(key as RecordKey);
      if (affectedKeyCfg) {
        return affectedKeyCfg.v;
      }

      const normalizedArgCfg = normalizeArgs(reflectValue, memoCfg, affected);
      affectedKeysMap.set(key as RecordKey, normalizedArgCfg);
      return normalizedArgCfg.v;
    },
    has(target, key) {
      const reflectHas = Reflect.has(target, key);
      const used = getUsed(arg, affected);

      const affectedHasKeysMap = used[AFFECTED_TYPES.HAS_KEY];
      const affectedHasKeyCfg = affectedHasKeysMap.get(key as RecordKey);

      if (affectedHasKeyCfg) {
        return affectedHasKeyCfg.v;
      }

      affectedHasKeysMap.set(key as RecordKey, { v: reflectHas });
      return reflectHas;
    },
    getOwnPropertyDescriptor(target, key) {
      const desc = Object.getOwnPropertyDescriptor(target, key);
      const used = getUsed(arg, affected);
      const affectedHasOwnKey = used[AFFECTED_TYPES.HAS_OWN_KEY];
      const affectedHasOwnKeyCfg = affectedHasOwnKey.get(key as RecordKey);

      if (!affectedHasOwnKeyCfg) {
        affectedHasOwnKey.set(key as RecordKey, { v: !!desc });
      }

      return desc;
    },
    ownKeys(target) {
      const ownKeys = Reflect.ownKeys(target);
      const used = getUsed(arg, affected);
      const [allKeysCalled] = used[AFFECTED_TYPES.ALL_KEYS];

      if (!allKeysCalled) {
        used[AFFECTED_TYPES.ALL_KEYS] = [true, ownKeys];
      }
      return ownKeys;
    },
  };
  return handler;
};

const createProxy = <T extends object>(
  arg: T,
  memoCfg: MemoConfig,
  affected: Affected
): T => {
  const handler = createHandler(arg, memoCfg, affected);
  return new Proxy(arg, handler);
};

const normalizeArgs = (
  arg: any,
  memoCfg: MemoConfig,
  affected: Affected
): NormalizeArgCfg => {
  const dataType = getDataType(arg);
  switch (dataType) {
    case 'Object':
    case 'Array':
      const used = getUsed(arg, affected);
      const selfProxy = used?.p;
      const needCopy = needsToCopyTargetObject(arg);
      let proxyValue = selfProxy;
      let plainArg = arg;
      if (!proxyValue) {
        if (needCopy) {
          plainArg = copyTargetObject(arg);
        }
        proxyValue = createProxy(plainArg as object, memoCfg, affected);
        used.p = proxyValue;
      }
      return {
        t: dataType,
        r: needCopy ? plainArg : arg,
        v: proxyValue,
        a: affected,
      };
    default:
      return {
        t: dataType,
        r: arg,
        v: arg,
        a: affected,
      };
  }
};

const isChanged = (
  normalizedArg: NormalizeArgCfg,
  newArg: any,
  memoCfg: MemoConfig
) => {
  const { t, r, a: affected } = normalizedArg;
  const { objectShallowCompare } = memoCfg;
  if (objectShallowCompare) {
    return !Object.is(r, newArg);
  }

  const newArgType = getDataType(newArg);
  switch (t) {
    case 'Array':
    case 'Object':
      const used = affected.get(r as object);
      if (newArgType !== t || !used) {
        return true;
      }

      const affectedKeys = used[AFFECTED_TYPES.KEYS];
      const affectedHasKey = used[AFFECTED_TYPES.HAS_KEY];
      const affectedHasOwnKey = used[AFFECTED_TYPES.HAS_OWN_KEY];
      const [allKeysCalled, keys] = used[AFFECTED_TYPES.ALL_KEYS];

      let changed = false;
      for (const [key, hasKeyCfg] of affectedHasKey || []) {
        changed = hasKeyCfg.v !== Reflect.has(newArg, key);
        if (changed) break;
      }
      if (changed) return true;

      if (allKeysCalled) {
        const newArgOwnKeys = Reflect.ownKeys(newArg);
        changed =
          keys.length !== newArgOwnKeys.length ||
          keys.some((k, i) => k !== newArgOwnKeys[i]);
        if (changed) return changed;
      } else {
        for (const [key, hasOwnKeyCfg] of affectedHasOwnKey || []) {
          changed =
            hasOwnKeyCfg.v !== !!Reflect.getOwnPropertyDescriptor(newArg, key);
          if (changed) break;
        }
      }
      if (changed) return true;

      for (const [key, affectedKeyArg] of affectedKeys || []) {
        changed = isChanged(affectedKeyArg, newArg[key], memoCfg);
        if (changed) break;
      }
      if (changed) return true;
      return false;
    default:
      return !Object.is(r, newArg);
  }
};

const isArgsChanged = (
  cachedProxyArgCfg: any[],
  newArgs: any[],
  memoCfg: MemoConfig
) => {
  const { shouldCompare } = memoCfg;
  if (shouldCompare && !shouldCompare(newArgs, cachedProxyArgCfg)) {
    return false;
  }
  const argLength = cachedProxyArgCfg.length;
  if (argLength !== newArgs.length) {
    return true;
  }
  let changed = false;
  for (let i = 0; i < argLength; i++) {
    changed = isChanged(cachedProxyArgCfg[i], newArgs[i], memoCfg);
    if (changed) break;
  }
  return changed;
};

const getCachedProxyArgCfg = (args: any[], memoCfg: MemoConfig) => {
  const proxyArgs = [] as Array<unknown>;
  const cachedProxyArgsCfg = args.reduce((prev, arg) => {
    const affected = new WeakMap() as Affected;
    const normalizedArg = normalizeArgs(arg, memoCfg, affected);
    prev.push(normalizedArg);
    proxyArgs.push(normalizedArg.v);
    return prev;
  }, []);
  return [proxyArgs, cachedProxyArgsCfg];
};

const untrack = (x: any, seen: Set<unknown>) => {
  if (['Object', 'Array'].indexOf(getDataType(x)) === -1) return x;
  const untrackedObj = original(x);
  if (untrackedObj) {
    return untrackedObj;
  }
  if (!seen.has(x)) {
    seen.add(x);
    Object.entries(x).forEach(([k, v]) => {
      const vv = untrack(v, seen);
      if (!Object.is(vv, v)) x[k] = vv;
    });
  }
  return x;
};

export const memo = (
  fn: (...args: any[]) => any,
  memoCfg: MemoConfig = {
    objectShallowCompare: false,
    shouldCompare: defaultShouldCompare,
  }
) => {
  const { isChanged: customIsChanged } = memoCfg;
  let cachedProxyArgsCfg = [] as NormalizeArgCfg[];
  let cachedResult: any;
  return (...args: any[]) => {
    let proxyArgs = [] as Array<unknown>;
    const changed = customIsChanged
      ? customIsChanged(args, cachedProxyArgsCfg)
      : isArgsChanged(cachedProxyArgsCfg, args, memoCfg);

    if (!changed) {
      return cachedResult as any;
    }

    [proxyArgs, cachedProxyArgsCfg] = getCachedProxyArgCfg(args, memoCfg);

    const rt = fn(...proxyArgs);
    cachedResult = untrack(rt, new Set());
    return cachedResult;
  };
};

export const memoAsync = (
  fn: (...args: any[]) => any,
  memoCfg: MemoConfig = {
    objectShallowCompare: false,
    shouldCompare: defaultShouldCompare,
  }
) => {
  const { isChanged: customIsChanged } = memoCfg;
  let cachedProxyArgsCfg = [] as NormalizeArgCfg[];
  let cachedResult: any;
  return async (...args: any[]) => {
    let proxyArgs = [] as Array<unknown>;
    const changed = customIsChanged
      ? customIsChanged(args, cachedProxyArgsCfg)
      : isArgsChanged(cachedProxyArgsCfg, args, memoCfg);

    if (!changed) {
      return cachedResult as any;
    }

    [proxyArgs, cachedProxyArgsCfg] = getCachedProxyArgCfg(args, memoCfg);

    const rt = await fn(...proxyArgs);
    cachedResult = untrack(rt, new Set());
    return cachedResult;
  };
};

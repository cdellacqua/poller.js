reactive-poller

# reactive-poller

## Table of contents

### Type Aliases

- [DerivedStoreConfig](README.md#derivedstoreconfig)
- [EqualityComparator](README.md#equalitycomparator)
- [Getter](README.md#getter)
- [MakePollerParams](README.md#makepollerparams)
- [Poller](README.md#poller)
- [PollerState](README.md#pollerstate)
- [ReadonlySignal](README.md#readonlysignal)
- [ReadonlyStore](README.md#readonlystore)
- [Setter](README.md#setter)
- [Signal](README.md#signal)
- [StartHandler](README.md#starthandler)
- [StopHandler](README.md#stophandler)
- [Store](README.md#store)
- [StoreConfig](README.md#storeconfig)
- [Subscriber](README.md#subscriber)
- [Unsubscribe](README.md#unsubscribe)
- [Update](README.md#update)
- [Updater](README.md#updater)

### Functions

- [coalesceSignals](README.md#coalescesignals)
- [deriveSignal](README.md#derivesignal)
- [makeDerivedStore](README.md#makederivedstore)
- [makePoller](README.md#makepoller)
- [makeReadonlyStore](README.md#makereadonlystore)
- [makeSignal](README.md#makesignal)
- [makeStore](README.md#makestore)

## Type Aliases

### DerivedStoreConfig

Ƭ **DerivedStoreConfig**<`T`\>: `Object`

Configurations for derived stores.

#### Type parameters

| Name |
| :------ |
| `T` |

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `comparator?` | [`EqualityComparator`](README.md#equalitycomparator)<`T`\> | (optional, defaults to `(a, b) => a === b`) a function that's used to determine if the current value of the store value is different from the one being set and thus if the store needs to be updated and the subscribers notified. |

#### Defined in

node_modules/universal-stores/dist/composition.d.ts:15

___

### EqualityComparator

Ƭ **EqualityComparator**<`T`\>: (`a`: `T`, `b`: `T`) => `boolean`

#### Type parameters

| Name |
| :------ |
| `T` |

#### Type declaration

▸ (`a`, `b`): `boolean`

A comparison function used to optimize subscribers notifications. Used in [Store](README.md#store)

##### Parameters

| Name | Type |
| :------ | :------ |
| `a` | `T` |
| `b` | `T` |

##### Returns

`boolean`

#### Defined in

node_modules/universal-stores/dist/index.d.ts:22

___

### Getter

Ƭ **Getter**<`T`\>: () => `T`

#### Type parameters

| Name |
| :------ |
| `T` |

#### Type declaration

▸ (): `T`

A generic getter function. Used in [Store](README.md#store)

##### Returns

`T`

#### Defined in

node_modules/universal-stores/dist/index.d.ts:16

___

### MakePollerParams

Ƭ **MakePollerParams**<`T`\>: `Object`

Configuration parameters for making a Poller.

#### Type parameters

| Name |
| :------ |
| `T` |

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `interval` | `number` | The number of milliseconds between each polling cycle. Note that if `useDynamicInterval` is set to true the actual interval will be computed taking into account the time spent in the dataProvider. |
| `retryInterval?` | `number` | (optional, defaults to `interval`) The number of milliseconds to wait before the next polling cycle if the dataProvider throws an error. |
| `useDynamicInterval?` | `boolean` | (optional, defaults to true) If true, the specified `interval` will represent the actual interval between two subsequent calls to the dataProvider. If false, the interval will simply represent a fixed delay between polling cycles. For example, let's imagine a scenario where the dataProvider takes 1 seconds to complete and the polling interval is set to 5 seconds. Setting `useDynamicInterval` to true would make the task sleep for 4 seconds before calling the dataProvider in the next cycle, totalling a 5 second delay between each dataProvider call, while `useDynamicInterval` set to false would delay for 5 seconds independently from the processing time, making the actual interval between each dataProvider calls reach a total of 6 seconds. |
| `dataProvider` | (`signal`: `AbortSignal`) => `T` \| `Promise`<`T`\> | A function that provides data, synchronously or asynchronously. You can use the provided AbortSignal argument to stop the task performed by the dataProvider when a user calls methods such as `.stop()` or `.restart()` on the poller. For example, if the dataProvider is implemented as a `fetch(...)` call, you can simply propagate the AbortSignal to fetch and let it handle it. |
| `errorHandler?` | (`err`: `unknown`) => `void` \| `Promise`<`void`\> | (optional) An error handler that will receive the errors that can occur in the dataProvider. |
| `monotonicTimeProvider?` | () => `number` | (optional, defaults to performance.now) A function that provides the current time, used to compute the dynamic interval. |

#### Defined in

[src/lib/index.ts:12](https://github.com/cdellacqua/poller.js/blob/main/src/lib/index.ts#L12)

___

### Poller

Ƭ **Poller**<`T`\>: `Object`

A Poller is an helper object that enables querying a resource or performing a task
at fixed intervals.

#### Type parameters

| Name |
| :------ |
| `T` |

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `onData$` | [`ReadonlySignal`](README.md#readonlysignal)<`T`\> | A signal that will emit every time the dateProvider returns (or resolves with) a value. |
| `state$` | [`ReadonlyStore`](README.md#readonlystore)<[`PollerState`](README.md#pollerstate)\> | A store containing the current state of the poller. See [PollerState](README.md#pollerstate). |
| `abort` | (`reason?`: `unknown`) => `Promise`<`void`\> | Stop the poller and trigger the abort signal. If called multiple times while waiting for a pending dataProvider, only the first call will trigger the abort event, while all subsequent calls will behave like the stop method, resolving only when the dataProvider completes. The returned promise will resolve when the poller state becomes 'stopped'. |
| `restart` | (`overrides?`: `Partial`<[`MakePollerParams`](README.md#makepollerparams)<`T`\>\>) => `Promise`<`void`\> | Restart the polling loop by calling stop and start. An optional parameter can be passed to override the default configuration. Note that this override is temporary, once the poller is restarted the default configuration will be restored. If the poller is already in a 'stopped' state, this method behaves like `start`. The returned promise will resolve when the poller state becomes 'running'. |
| `start` | () => `Promise`<`void`\> | Start the polling loop. The returned promise will resolve when the poller state becomes 'running'. |
| `stop` | () => `Promise`<`void`\> | Stop the poller, but wait for the dataProvider to complete if it's already in a pending state (i.e. without triggering the abort signal). The returned promise will resolve when the poller state becomes 'stopped'. |

#### Defined in

[src/lib/index.ts:73](https://github.com/cdellacqua/poller.js/blob/main/src/lib/index.ts#L73)

___

### PollerState

Ƭ **PollerState**: ``"initial"`` \| ``"running"`` \| ``"stopping"`` \| ``"stopped"``

All the possible states in which a poller can be.

#### Defined in

[src/lib/index.ts:67](https://github.com/cdellacqua/poller.js/blob/main/src/lib/index.ts#L67)

___

### ReadonlySignal

Ƭ **ReadonlySignal**<`T`\>: `Object`

A signal that can have subscribers and emit values to them.

#### Type parameters

| Name |
| :------ |
| `T` |

#### Type declaration

| Name | Type |
| :------ | :------ |
| `nOfSubscriptions` | () => `number` |
| `subscribe` | (`subscriber`: [`Subscriber`](README.md#subscriber)<`T`\>) => [`Unsubscribe`](README.md#unsubscribe) |
| `subscribeOnce` | (`subscriber`: [`Subscriber`](README.md#subscriber)<`T`\>) => [`Unsubscribe`](README.md#unsubscribe) |

#### Defined in

node_modules/@cdellacqua/signals/dist/index.d.ts:6

___

### ReadonlyStore

Ƭ **ReadonlyStore**<`T`\>: `Object`

A store that can have subscribers and emit values to them. It also
provides the current value upon subscription. It's readonly in the
sense that it doesn't provide direct set/update methods, unlike [Store](README.md#store),
therefore its value can only be changed by a [StartHandler](README.md#starthandler) (see also [makeReadonlyStore](README.md#makereadonlystore)).

#### Type parameters

| Name |
| :------ |
| `T` |

#### Type declaration

| Name | Type |
| :------ | :------ |
| `content` | () => `T` |
| `nOfSubscriptions` | () => `number` |
| `subscribe` | (`subscriber`: [`Subscriber`](README.md#subscriber)<`T`\>) => [`Unsubscribe`](README.md#unsubscribe) |

#### Defined in

node_modules/universal-stores/dist/index.d.ts:33

___

### Setter

Ƭ **Setter**<`T`\>: (`newValue`: `T`) => `void`

#### Type parameters

| Name |
| :------ |
| `T` |

#### Type declaration

▸ (`newValue`): `void`

A generic setter function. Used in [Store](README.md#store)

##### Parameters

| Name | Type |
| :------ | :------ |
| `newValue` | `T` |

##### Returns

`void`

#### Defined in

node_modules/universal-stores/dist/index.d.ts:14

___

### Signal

Ƭ **Signal**<`T`\>: [`ReadonlySignal`](README.md#readonlysignal)<`T`\> & { `emit`: (`v`: `T`) => `void`  }

A signal that can have subscribers and emit values to them.

#### Type parameters

| Name |
| :------ |
| `T` |

#### Defined in

node_modules/@cdellacqua/signals/dist/index.d.ts:28

___

### StartHandler

Ƭ **StartHandler**<`T`\>: (`set`: [`Setter`](README.md#setter)<`T`\>) => [`StopHandler`](README.md#stophandler) \| `void`

#### Type parameters

| Name |
| :------ |
| `T` |

#### Type declaration

▸ (`set`): [`StopHandler`](README.md#stophandler) \| `void`

A function that gets called once a store gets at least one subscriber. Used in [Store](README.md#store)

##### Parameters

| Name | Type |
| :------ | :------ |
| `set` | [`Setter`](README.md#setter)<`T`\> |

##### Returns

[`StopHandler`](README.md#stophandler) \| `void`

#### Defined in

node_modules/universal-stores/dist/index.d.ts:26

___

### StopHandler

Ƭ **StopHandler**: () => `void`

#### Type declaration

▸ (): `void`

A function that gets called once a store reaches 0 subscribers. Used in [Store](README.md#store)

##### Returns

`void`

#### Defined in

node_modules/universal-stores/dist/index.d.ts:24

___

### Store

Ƭ **Store**<`T`\>: [`ReadonlyStore`](README.md#readonlystore)<`T`\> & { `set`: (`v`: `T`) => `void` ; `update`: (`updater`: [`Updater`](README.md#updater)<`T`\>) => `void`  }

A store that can have subscribers and emit values to them. It also
provides the current value upon subscription.

#### Type parameters

| Name |
| :------ |
| `T` |

#### Defined in

node_modules/universal-stores/dist/index.d.ts:56

___

### StoreConfig

Ƭ **StoreConfig**<`T`\>: `Object`

Configurations for Store<T> and ReadonlyStore<T>.

#### Type parameters

| Name |
| :------ |
| `T` |

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `comparator?` | [`EqualityComparator`](README.md#equalitycomparator)<`T`\> | (optional, defaults to `(a, b) => a === b`) a function that's used to determine if the current value of the store value is different from the one being set and thus if the store needs to be updated and the subscribers notified. |
| `start?` | [`StartHandler`](README.md#starthandler)<`T`\> | (optional) a [StartHandler](README.md#starthandler) that will get called once there is at least one subscriber to this store. |

#### Defined in

node_modules/universal-stores/dist/index.d.ts:72

___

### Subscriber

Ƭ **Subscriber**<`T`\>: (`current`: `T`) => `void`

#### Type parameters

| Name |
| :------ |
| `T` |

#### Type declaration

▸ (`current`): `void`

A generic subscriber that takes a value emitted by a signal as its only parameter.

##### Parameters

| Name | Type |
| :------ | :------ |
| `current` | `T` |

##### Returns

`void`

#### Defined in

node_modules/@cdellacqua/signals/dist/index.d.ts:2

___

### Unsubscribe

Ƭ **Unsubscribe**: () => `void`

#### Type declaration

▸ (): `void`

A function that's used to unsubscribe a subscriber from a signal.

##### Returns

`void`

#### Defined in

node_modules/@cdellacqua/signals/dist/index.d.ts:4

___

### Update

Ƭ **Update**<`T`\>: (`updater`: (`current`: `T`) => `T`) => `void`

#### Type parameters

| Name |
| :------ |
| `T` |

#### Type declaration

▸ (`updater`): `void`

A generic update function. Used in [Store](README.md#store)

##### Parameters

| Name | Type |
| :------ | :------ |
| `updater` | (`current`: `T`) => `T` |

##### Returns

`void`

#### Defined in

node_modules/universal-stores/dist/index.d.ts:20

___

### Updater

Ƭ **Updater**<`T`\>: (`current`: `T`) => `T`

#### Type parameters

| Name |
| :------ |
| `T` |

#### Type declaration

▸ (`current`): `T`

A generic updater function. Used in [Store](README.md#store)

##### Parameters

| Name | Type |
| :------ | :------ |
| `current` | `T` |

##### Returns

`T`

#### Defined in

node_modules/universal-stores/dist/index.d.ts:18

## Functions

### coalesceSignals

▸ **coalesceSignals**<`T`\>(`signals$`): [`ReadonlySignal`](README.md#readonlysignal)<`T`[`number`]\>

Coalesce multiple signals into one that will emit the latest value emitted
by any of the source signals.

Example:
```ts
const lastUpdate1$ = makeSignal<number>();
const lastUpdate2$ = makeSignal<number>();
const latestUpdate$ = coalesceSignals([lastUpdate1$, lastUpdate2$]);
latestUpdate$.subscribe((v) => console.log(v));
lastUpdate1$.emit(1577923200000); // will log 1577923200000
lastUpdate2$.emit(1653230659450); // will log 1653230659450
```

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `unknown`[] |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `signals$` | { [P in string \| number \| symbol]: ReadonlySignal<T[P]\> } | an array of signals to observe. |

#### Returns

[`ReadonlySignal`](README.md#readonlysignal)<`T`[`number`]\>

a new signal that emits whenever one of the source signals emits.

#### Defined in

node_modules/@cdellacqua/signals/dist/composition.d.ts:35

___

### deriveSignal

▸ **deriveSignal**<`T`, `U`\>(`signal$`, `transform`): [`ReadonlySignal`](README.md#readonlysignal)<`U`\>

Create a signal that emits whenever the passed signal emits. The original
emitted value gets transformed by the passed function and the result gets
emitted.

Example:
```ts
const signal$ = makeSignal<number>();
const derived$ = deriveSignal(signal$, (n) => n + 100);
derived$.subscribe((v) => console.log(v));
signal$.emit(3); // will trigger console.log, echoing 103
```

#### Type parameters

| Name |
| :------ |
| `T` |
| `U` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `signal$` | [`ReadonlySignal`](README.md#readonlysignal)<`T`\> | a signal. |
| `transform` | (`data`: `T`) => `U` | a transformation function. |

#### Returns

[`ReadonlySignal`](README.md#readonlysignal)<`U`\>

a new signal that will emit the transformed data.

#### Defined in

node_modules/@cdellacqua/signals/dist/composition.d.ts:18

___

### makeDerivedStore

▸ **makeDerivedStore**<`TIn`, `TOut`\>(`readonlyStore`, `map`, `config?`): [`ReadonlyStore`](README.md#readonlystore)<`TOut`\>

Create a derived store.

Example usage:
```ts
const source$ = makeStore(10);
const derived$ = makeDerivedStore(source$, (v) => v * 2);
source$.subscribe((v) => console.log(v)); // prints 10
derived$.subscribe((v) => console.log(v)); // prints 20
source$.set(16); // triggers both console.logs, printing 16 and 32
```

#### Type parameters

| Name |
| :------ |
| `TIn` |
| `TOut` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `readonlyStore` | [`ReadonlyStore`](README.md#readonlystore)<`TIn`\> | a store or readonly store. |
| `map` | (`value`: `TIn`) => `TOut` | a function that takes the current value of the source store and maps it to another value. |
| `config?` | [`DerivedStoreConfig`](README.md#derivedstoreconfig)<`TOut`\> | a [DerivedStoreConfig](README.md#derivedstoreconfig) which contains configuration information such as a value comparator to avoid needless notifications to subscribers. |

#### Returns

[`ReadonlyStore`](README.md#readonlystore)<`TOut`\>

#### Defined in

node_modules/universal-stores/dist/composition.d.ts:37

▸ **makeDerivedStore**<`TIn`, `TOut`\>(`readonlyStores`, `map`, `config?`): [`ReadonlyStore`](README.md#readonlystore)<`TOut`\>

Create a derived store from multiple sources.

Example usage:
```ts
const source1$ = makeStore(10);
const source2$ = makeStore(-10);
const derived$ = makeDerivedStore([source1$, source2$], ([v1, v2]) => v1 + v2);
source1$.subscribe((v) => console.log(v)); // prints 10
source2$.subscribe((v) => console.log(v)); // prints -10
derived$.subscribe((v) => console.log(v)); // prints 0
source1$.set(11); // prints 11 (first console.log) and 1 (third console.log)
source2$.set(9); // prints 9 (second console.log) and 20 (third console.log)
```

#### Type parameters

| Name | Type |
| :------ | :------ |
| `TIn` | extends `unknown`[] \| [`unknown`, ...unknown[]] |
| `TOut` | `TOut` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `readonlyStores` | { [K in string \| number \| symbol]: ReadonlyStore<TIn[K]\> } | an array of stores or readonly stores. |
| `map` | (`value`: { [K in string \| number \| symbol]: TIn[K] }) => `TOut` | a function that takes the current value of all the source stores and maps it to another value. |
| `config?` | [`DerivedStoreConfig`](README.md#derivedstoreconfig)<`TOut`\> | a [DerivedStoreConfig](README.md#derivedstoreconfig) which contains configuration information such as a value comparator to avoid needless notifications to subscribers. |

#### Returns

[`ReadonlyStore`](README.md#readonlystore)<`TOut`\>

#### Defined in

node_modules/universal-stores/dist/composition.d.ts:56

▸ **makeDerivedStore**<`TIn`, `TOut`\>(`readonlyStores`, `map`, `config?`): [`ReadonlyStore`](README.md#readonlystore)<`TOut`\>

Create a derived store from multiple sources.

Example usage:
```ts
const source1$ = makeStore(10);
const source2$ = makeStore(-10);
const derived$ = makeDerivedStore({v1: source1$, v2: source2$}, ({v1, v2}) => v1 + v2);
source1$.subscribe((v) => console.log(v)); // prints 10
source2$.subscribe((v) => console.log(v)); // prints -10
derived$.subscribe((v) => console.log(v)); // prints 0
source1$.set(11); // prints 11 (first console.log) and 1 (third console.log)
source2$.set(9); // prints 9 (second console.log) and 20 (third console.log)
```

#### Type parameters

| Name |
| :------ |
| `TIn` |
| `TOut` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `readonlyStores` | { [K in string \| number \| symbol]: ReadonlyStore<TIn[K]\> } | an array of stores or readonly stores. |
| `map` | (`value`: { [K in string \| number \| symbol]: TIn[K] }) => `TOut` | a function that takes the current value of all the source stores and maps it to another value. |
| `config?` | [`DerivedStoreConfig`](README.md#derivedstoreconfig)<`TOut`\> | a [DerivedStoreConfig](README.md#derivedstoreconfig) which contains configuration information such as a value comparator to avoid needless notifications to subscribers. |

#### Returns

[`ReadonlyStore`](README.md#readonlystore)<`TOut`\>

#### Defined in

node_modules/universal-stores/dist/composition.d.ts:79

___

### makePoller

▸ **makePoller**<`T`\>(`config`): [`Poller`](README.md#poller)<`T`\>

Create a poller.

Example:
```ts
const poller = makePoller({
	interval: 500,
	dataProvider: () => Math.floor(Math.random() * 10),
});
poller.start()
	.then(() => console.log('polling started'), (err) => console.error('ops!', err));
```

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `config` | [`MakePollerParams`](README.md#makepollerparams)<`T`\> | a object containing the desired configuration of the poller. See [MakePollerParams](README.md#makepollerparams) |

#### Returns

[`Poller`](README.md#poller)<`T`\>

a poller.

#### Defined in

[src/lib/index.ts:139](https://github.com/cdellacqua/poller.js/blob/main/src/lib/index.ts#L139)

___

### makeReadonlyStore

▸ **makeReadonlyStore**<`T`\>(`initialValue`, `start?`): [`ReadonlyStore`](README.md#readonlystore)<`T`\>

Make a store of type T.

Example usage:
```ts
let value = 0;
const store$ = makeReadonlyStore(value, (set) => {
	value++;
	set(value);
});
console.log(store$.content()); // 1
store$.subscribe((v) => console.log(v)); // immediately prints 2
console.log(store$.content()); // 2
```

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `initialValue` | `undefined` \| `T` | the initial value of the store. |
| `start?` | [`StartHandler`](README.md#starthandler)<`T`\> | a [StartHandler](README.md#starthandler) that will get called once there is at least one subscriber to this store. |

#### Returns

[`ReadonlyStore`](README.md#readonlystore)<`T`\>

a ReadonlyStore

#### Defined in

node_modules/universal-stores/dist/index.d.ts:144

▸ **makeReadonlyStore**<`T`\>(`initialValue`, `config?`): [`ReadonlyStore`](README.md#readonlystore)<`T`\>

Make a store of type T.

Example usage:
```ts
const store$ = makeReadonlyStore({prop: 'some value'}, {
	comparator: (a, b) => a.prop === b.prop,
	start: (set) => {
		// ...
	},
});
```

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `initialValue` | `undefined` \| `T` | the initial value of the store. |
| `config?` | [`StoreConfig`](README.md#storeconfig)<`T`\> | a [StoreConfig](README.md#storeconfig) which contains configuration information such as a value comparator to avoid needless notifications to subscribers and a [StartHandler](README.md#starthandler). |

#### Returns

[`ReadonlyStore`](README.md#readonlystore)<`T`\>

a ReadonlyStore

#### Defined in

node_modules/universal-stores/dist/index.d.ts:161

▸ **makeReadonlyStore**<`T`\>(`initialValue`, `startOrConfig?`): [`ReadonlyStore`](README.md#readonlystore)<`T`\>

Make a store of type T.

Example usage:
```ts
let value = 0;
const store$ = makeReadonlyStore(value, (set) => {
	value++;
	set(value);
});
console.log(store$.content()); // 1
store$.subscribe((v) => console.log(v)); // immediately prints 2
console.log(store$.content()); // 2
```

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `initialValue` | `undefined` \| `T` | the initial value of the store. |
| `startOrConfig?` | [`StartHandler`](README.md#starthandler)<`T`\> \| [`StoreConfig`](README.md#storeconfig)<`T`\> | a [StartHandler](README.md#starthandler) or a [StoreConfig](README.md#storeconfig) which contains configuration information such as a value comparator to avoid needless notifications to subscribers and a [StartHandler](README.md#starthandler). |

#### Returns

[`ReadonlyStore`](README.md#readonlystore)<`T`\>

a ReadonlyStore

#### Defined in

node_modules/universal-stores/dist/index.d.ts:180

___

### makeSignal

▸ **makeSignal**<`T`\>(): [`Signal`](README.md#signal)<`T`\>

Make a signal of type T.

Example usage:
```ts
const signal$ = makeSignal<number>();
signal$.emit(10);
```
Example usage with no data:
```ts
const signal$ = makeSignal<void>();
signal$.emit();
```

#### Type parameters

| Name |
| :------ |
| `T` |

#### Returns

[`Signal`](README.md#signal)<`T`\>

a signal.

#### Defined in

node_modules/@cdellacqua/signals/dist/index.d.ts:50

___

### makeStore

▸ **makeStore**<`T`\>(`initialValue`, `start?`): [`Store`](README.md#store)<`T`\>

Make a store of type T.

Example usage:
```ts
const store$ = makeStore(0);
console.log(store$.content()); // 0
store$.subscribe((v) => console.log(v));
store$.set(10); // will trigger the above console log, printing 10
```

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `initialValue` | `undefined` \| `T` | the initial value of the store. |
| `start?` | [`StartHandler`](README.md#starthandler)<`T`\> | a [StartHandler](README.md#starthandler) that will get called once there is at least one subscriber to this store. |

#### Returns

[`Store`](README.md#store)<`T`\>

a Store

#### Defined in

node_modules/universal-stores/dist/index.d.ts:95

▸ **makeStore**<`T`\>(`initialValue`, `config?`): [`Store`](README.md#store)<`T`\>

Make a store of type T.

Example usage:
```ts
const store$ = makeStore(0);
console.log(store$.content()); // 0
store$.subscribe((v) => console.log(v));
store$.set(10); // will trigger the above console log, printing 10
```

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `initialValue` | `undefined` \| `T` | the initial value of the store. |
| `config?` | [`StoreConfig`](README.md#storeconfig)<`T`\> | a [StoreConfig](README.md#storeconfig) which contains configuration information such as a value comparator to avoid needless notifications to subscribers and a [StartHandler](README.md#starthandler). |

#### Returns

[`Store`](README.md#store)<`T`\>

a Store

#### Defined in

node_modules/universal-stores/dist/index.d.ts:110

▸ **makeStore**<`T`\>(`initialValue`, `startOrConfig?`): [`Store`](README.md#store)<`T`\>

Make a store of type T.

Example usage:
```ts
const store$ = makeStore(0);
console.log(store$.content()); // 0
store$.subscribe((v) => console.log(v));
store$.set(10); // will trigger the above console log, printing 10
```

#### Type parameters

| Name |
| :------ |
| `T` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `initialValue` | `undefined` \| `T` | the initial value of the store. |
| `startOrConfig?` | [`StartHandler`](README.md#starthandler)<`T`\> \| [`StoreConfig`](README.md#storeconfig)<`T`\> | a [StartHandler](README.md#starthandler) or a [StoreConfig](README.md#storeconfig) which contains configuration information such as a value comparator to avoid needless notifications to subscribers and a [StartHandler](README.md#starthandler). |

#### Returns

[`Store`](README.md#store)<`T`\>

a Store

#### Defined in

node_modules/universal-stores/dist/index.d.ts:125

reactive-poller

# reactive-poller

## Table of contents

### Type Aliases

- [MakePollerParams](README.md#makepollerparams)
- [Poller](README.md#poller)
- [PollerState](README.md#pollerstate)

### Functions

- [makePoller](README.md#makepoller)

## Type Aliases

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
| `useDynamicInterval?` | `boolean` | (optional, defaults to true) If true, the specified `interval` will represent the actual interval between two subsequent calls to the dataProvider. If false, the interval will simply represent a fixed delay between polling cycles.  For example, let's imagine a scenario where the dataProvider takes 1 seconds to complete and the polling interval is set to 5 seconds. Setting `useDynamicInterval` to true would make the task sleep for 4 seconds before calling the dataProvider in the next cycle, totalling a 5 second delay between each dataProvider call, while `useDynamicInterval` set to false would delay for 5 seconds independently from the processing time, making the actual interval between each dataProvider calls reach a total of 6 seconds. |
| `dataProvider` | () => `T` \| `Promise`<`T`\> | A function that provides data, synchronously or asynchronously. |
| `errorHandler?` | (`err`: `unknown`) => `void` \| `Promise`<`void`\> | (optional) An error handler that will receive the errors that can occur in the dataProvider. |
| `monotonicTimeProvider?` | () => `number` | (optional, defaults to performance.now) A function that provides the current time, used to compute the dynamic interval. |

#### Defined in

[index.ts:8](https://github.com/cdellacqua/poller.js/blob/main/src/lib/index.ts#L8)

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
| `onData$` | `ReadonlySignal`<`T`\> | A signal that will emit every time the dateProvider returns (or resolves with) a value. |
| `state$` | `ReadonlyStore`<[`PollerState`](README.md#pollerstate)\> | A store containing the current state of the poller. See [PollerState](README.md#pollerstate). |
| ``get` **state**(): [`PollerState`](README.md#pollerstate)` | {} | - |
| `restart` | (`overrides?`: `Partial`<[`MakePollerParams`](README.md#makepollerparams)<`T`\>\>) => `Promise`<`void`\> | Restart the polling loop. An optional parameter can be passed to override the default configuration. Note that this override is temporary, once the poller is restarted the default configuration will be restored.  If the poller is already in a 'stopped' state, this method behaves like `start`.  The returned promise will resolve when the poller state becomes 'running'. |
| `start` | () => `Promise`<`void`\> | Start the polling loop.  The returned promise will resolve when the poller state becomes 'running'. |
| `stop` | () => `Promise`<`void`\> | Stop the polling loop.  The returned promise will resolve when the poller state becomes 'stopped'. |

#### Defined in

[index.ts:57](https://github.com/cdellacqua/poller.js/blob/main/src/lib/index.ts#L57)

___

### PollerState

Ƭ **PollerState**: ``"initial"`` \| ``"running"`` \| ``"stopping"`` \| ``"stopped"``

All the possible states in which a poller can be.

#### Defined in

[index.ts:51](https://github.com/cdellacqua/poller.js/blob/main/src/lib/index.ts#L51)

## Functions

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

[index.ts:113](https://github.com/cdellacqua/poller.js/blob/main/src/lib/index.ts#L113)

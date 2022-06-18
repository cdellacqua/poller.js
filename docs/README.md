reactive-poller

# reactive-poller

## Table of contents

### Type aliases

- [MakePollerParams](README.md#makepollerparams)
- [Poller](README.md#poller)
- [PollerState](README.md#pollerstate)

### Functions

- [makePoller](README.md#makepoller)

## Type aliases

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
| `interval` | `number` | The number of milliseconds between each polling cycle. Note that if `useDynamicInterval` is set to true the actual interval will be computed taking into account the time spent in the consumer and in the producer. |
| `retryInterval?` | `number` | (optional, defaults to `interval`) The number of milliseconds to wait before the next polling cycle when the producer or the consumer throw an error. |
| `useDynamicInterval?` | `boolean` | (optional, defaults to true) If true, the specified `interval` will represent the actual interval between two subsequent calls to the producer. If false, the interval will simply represent a fixed delay between polling cycles.  For example, let's imagine a scenario where producing + consuming takes 1 seconds and the polling interval is set to 5 seconds. Setting `useDynamicInterval` to true would make the task sleep for 4 seconds before calling the producer in the next cycle, totalling a 5 second delay between producer calls, while `useDynamicInterval` set to false would delay for 5 seconds independently from the processing time, making the actual interval between producer calls reach a total of 6 seconds. |
| `consumer` | (`data`: `T`) => `void` \| `Promise`<`void`\> | - |
| `errorHandler?` | (`err`: `unknown`) => `void` \| `Promise`<`void`\> | - |
| `monotonicTimeProvider?` | () => `number` | - |
| `producer` | () => `T` \| `Promise`<`T`\> | - |

#### Defined in

[index.ts:7](https://github.com/cdellacqua/poller.js/blob/main/src/lib/index.ts#L7)

___

### Poller

Ƭ **Poller**<`T`\>: `Object`

A Poller is an helper object that enables querying a resource
at fixed intervals.

#### Type parameters

| Name |
| :------ |
| `T` |

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `state$` | `ReadonlyStore`<[`PollerState`](README.md#pollerstate)\> | A store containing the current state of the poller. See [PollerState](README.md#pollerstate). |
| ``get` **state**(): [`PollerState`](README.md#pollerstate)` | `Object` | - |
| `restart` | (`overrides?`: `Partial`<[`MakePollerParams`](README.md#makepollerparams)<`T`\>\>) => `Promise`<`void`\> | - |
| `start` | () => `Promise`<`void`\> | - |
| `stop` | () => `Promise`<`void`\> | - |

#### Defined in

[index.ts:61](https://github.com/cdellacqua/poller.js/blob/main/src/lib/index.ts#L61)

___

### PollerState

Ƭ **PollerState**: ``"initial"`` \| ``"running"`` \| ``"stopping"`` \| ``"stopped"``

All the possible states in which a poller can be.

#### Defined in

[index.ts:55](https://github.com/cdellacqua/poller.js/blob/main/src/lib/index.ts#L55)

## Functions

### makePoller

▸ **makePoller**<`T`\>(`config`): [`Poller`](README.md#poller)<`T`\>

Create a poller.

Example:
```ts
const poller = makePoller({
	interval: 500,
	producer: () => Math.floor(Math.random() * 10),
	consumer: (n) => console.log(`Random number: ${n}`),
});
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

[index.ts:112](https://github.com/cdellacqua/poller.js/blob/main/src/lib/index.ts#L112)

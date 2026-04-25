[**reactive-poller**](../README.md)

***

[reactive-poller](../README.md) / Poller

# Type Alias: Poller\<T\>

> **Poller**\<`T`\> = `object`

Defined in: [src/lib/index.ts:74](https://github.com/cdellacqua/poller.js/blob/main/src/lib/index.ts#L74)

A Poller is an helper object that enables querying a resource or performing a task
at fixed intervals.

## Type Parameters

### T

`T`

## Properties

### onData$

> **onData$**: [`ReadonlySignal`](ReadonlySignal.md)\<`T`\>

Defined in: [src/lib/index.ts:82](https://github.com/cdellacqua/poller.js/blob/main/src/lib/index.ts#L82)

A signal that will emit every time the dateProvider returns (or resolves with) a value.

***

### state$

> **state$**: [`ReadonlyStore`](ReadonlyStore.md)\<[`PollerState`](PollerState.md)\>

Defined in: [src/lib/index.ts:78](https://github.com/cdellacqua/poller.js/blob/main/src/lib/index.ts#L78)

A store containing the current state of the poller. See [PollerState](PollerState.md).

## Methods

### abort()

> **abort**(`reason?`): `Promise`\<`void`\>

Defined in: [src/lib/index.ts:108](https://github.com/cdellacqua/poller.js/blob/main/src/lib/index.ts#L108)

Stop the poller and trigger the abort signal.

If called multiple times while waiting for a pending dataProvider,
only the first call will trigger the abort event, while
all subsequent calls will behave like the stop method,
resolving only when the dataProvider completes.

The returned promise will resolve when the poller state becomes 'stopped'.

#### Parameters

##### reason?

`unknown`

a reason that will be emitted by the abort signal.

#### Returns

`Promise`\<`void`\>

***

### restart()

> **restart**(`overrides?`): `Promise`\<`void`\>

Defined in: [src/lib/index.ts:121](https://github.com/cdellacqua/poller.js/blob/main/src/lib/index.ts#L121)

Restart the polling loop by calling stop and start.
An optional parameter can be passed
to override the default configuration. Note that this override
is temporary, once the poller is restarted the default configuration
will be restored.

If the poller is already in a 'stopped' state, this
method behaves like `start`.

The returned promise will resolve when the poller state becomes 'running'.

#### Parameters

##### overrides?

`Partial`\<[`MakePollerParams`](MakePollerParams.md)\<`T`\>\>

#### Returns

`Promise`\<`void`\>

***

### start()

> **start**(): `Promise`\<`void`\>

Defined in: [src/lib/index.ts:88](https://github.com/cdellacqua/poller.js/blob/main/src/lib/index.ts#L88)

Start the polling loop.

The returned promise will resolve when the poller state becomes 'running'.

#### Returns

`Promise`\<`void`\>

***

### stop()

> **stop**(): `Promise`\<`void`\>

Defined in: [src/lib/index.ts:95](https://github.com/cdellacqua/poller.js/blob/main/src/lib/index.ts#L95)

Stop the poller, but wait for the dataProvider to complete
if it's already in a pending state (i.e. without triggering the abort signal).

The returned promise will resolve when the poller state becomes 'stopped'.

#### Returns

`Promise`\<`void`\>

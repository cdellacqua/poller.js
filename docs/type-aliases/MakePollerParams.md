[**reactive-poller**](../README.md)

***

[reactive-poller](../README.md) / MakePollerParams

# Type Alias: MakePollerParams\<T\>

> **MakePollerParams**\<`T`\> = `object`

Defined in: [src/lib/index.ts:13](https://github.com/cdellacqua/poller.js/blob/main/src/lib/index.ts#L13)

Configuration parameters for making a Poller.

## Type Parameters

### T

`T`

## Properties

### interval

> **interval**: `number`

Defined in: [src/lib/index.ts:40](https://github.com/cdellacqua/poller.js/blob/main/src/lib/index.ts#L40)

The number of milliseconds between each polling cycle. Note
that if `useDynamicInterval` is set to true the actual interval
will be computed taking into account the time spent in the dataProvider.

***

### retryInterval?

> `optional` **retryInterval?**: `number`

Defined in: [src/lib/index.ts:45](https://github.com/cdellacqua/poller.js/blob/main/src/lib/index.ts#L45)

(optional, defaults to `interval`) The number of milliseconds to wait before the next polling cycle
if the dataProvider throws an error.

***

### useDynamicInterval?

> `optional` **useDynamicInterval?**: `boolean`

Defined in: [src/lib/index.ts:57](https://github.com/cdellacqua/poller.js/blob/main/src/lib/index.ts#L57)

(optional, defaults to true) If true, the specified `interval` will
represent the actual interval between two subsequent calls to the dataProvider.
If false, the interval will simply represent a fixed delay between polling cycles.

For example, let's imagine a scenario where the dataProvider takes 1 seconds to complete and the polling interval
is set to 5 seconds. Setting `useDynamicInterval` to true would make the task sleep for 4 seconds
before calling the dataProvider in the next cycle, totalling a 5 second delay between each dataProvider call, while `useDynamicInterval`
set to false would delay for 5 seconds independently from the processing time, making the actual interval between
each dataProvider calls reach a total of 6 seconds.

## Methods

### dataProvider()

> **dataProvider**(`signal`): `T` \| `Promise`\<`T`\>

Defined in: [src/lib/index.ts:28](https://github.com/cdellacqua/poller.js/blob/main/src/lib/index.ts#L28)

A function that provides data, synchronously or asynchronously.

You can use the provided AbortSignal argument to stop the task
performed by the dataProvider when a user calls methods such as `.stop()`
or `.restart()` on the poller.
For example, if the dataProvider is implemented as a `fetch(...)` call,
you can simply propagate the AbortSignal to fetch and let it handle it.

#### Parameters

##### signal

`AbortSignal`

an AbortSignal.
Note that this signal is not recycled during subsequent polling cycles,
in other words the dataProvider gets a new signal object at each cycle (and
the previous one with its subscriber(s) gets garbage collected).

#### Returns

`T` \| `Promise`\<`T`\>

***

### errorHandler()?

> `optional` **errorHandler**(`err`): `void` \| `Promise`\<`void`\>

Defined in: [src/lib/index.ts:34](https://github.com/cdellacqua/poller.js/blob/main/src/lib/index.ts#L34)

(optional) An error handler that will receive the errors that can
occur in the dataProvider.

#### Parameters

##### err

`unknown`

the occurred error.

#### Returns

`void` \| `Promise`\<`void`\>

***

### monotonicTimeProvider()?

> `optional` **monotonicTimeProvider**(): `number`

Defined in: [src/lib/index.ts:62](https://github.com/cdellacqua/poller.js/blob/main/src/lib/index.ts#L62)

(optional, defaults to performance.now) A function that provides the current time, used to
compute the dynamic interval.

#### Returns

`number`

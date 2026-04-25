[**reactive-poller**](../README.md)

***

[reactive-poller](../README.md) / ReadonlySignal

# Type Alias: ReadonlySignal\<T\>

> **ReadonlySignal**\<`T`\> = `object`

Defined in: node\_modules/@cdellacqua/signals/dist/index.d.ts:6

A signal that can have subscribers and emit values to them.

## Type Parameters

### T

`T`

## Methods

### nOfSubscriptions()

> **nOfSubscriptions**(): `number`

Defined in: node\_modules/@cdellacqua/signals/dist/index.d.ts:25

Return the current number of active subscriptions.

#### Returns

`number`

***

### subscribe()

> **subscribe**(`subscriber`): [`Unsubscribe`](Unsubscribe.md)

Defined in: node\_modules/@cdellacqua/signals/dist/index.d.ts:15

Subscribe a function to this signal.

Note: subscribers are deduplicated, if you need to subscribe the same
function more than once wrap it in an arrow function, e.g.
`signal$.subscribe((v) => myFunc(v));`

#### Parameters

##### subscriber

[`Subscriber`](Subscriber.md)\<`T`\>

a function that will be called when this signal emits.

#### Returns

[`Unsubscribe`](Unsubscribe.md)

***

### subscribeOnce()

> **subscribeOnce**(`subscriber`): [`Unsubscribe`](Unsubscribe.md)

Defined in: node\_modules/@cdellacqua/signals/dist/index.d.ts:21

Subscribe a function to this signal and automatically unsubscribe it after one emit occurs.

#### Parameters

##### subscriber

[`Subscriber`](Subscriber.md)\<`T`\>

a function that will be called when this signal emits.

#### Returns

[`Unsubscribe`](Unsubscribe.md)

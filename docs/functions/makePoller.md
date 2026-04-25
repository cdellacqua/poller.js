[**reactive-poller**](../README.md)

***

[reactive-poller](../README.md) / makePoller

# Function: makePoller()

> **makePoller**\<`T`\>(`config`): [`Poller`](../type-aliases/Poller.md)\<`T`\>

Defined in: [src/lib/index.ts:140](https://github.com/cdellacqua/poller.js/blob/main/src/lib/index.ts#L140)

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

## Type Parameters

### T

`T`

## Parameters

### config

[`MakePollerParams`](../type-aliases/MakePollerParams.md)\<`T`\>

a object containing the desired configuration of the poller. See [MakePollerParams](../type-aliases/MakePollerParams.md)

## Returns

[`Poller`](../type-aliases/Poller.md)\<`T`\>

a poller.

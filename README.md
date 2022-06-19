# reactive-poller

A polling library.

Polling is a recurring concept in programming. This library provides a simple
implementation that should cover most use-cases.

[NPM Package](https://www.npmjs.com/package/reactive-poller)

`npm install reactive-poller`

[Documentation](./docs/README.md)

## Poller

A `Poller<T>` is an object that provides the following methods:

- `start()`;
- `stop()`;
- `restart()` (or `restart({...})` to override some settings).

Other than those methods there is also a property called `state`
which contains one of the following values: 'initial', 'running', 'stopping' or 'stopped'.

The `state` property mirrors the value of a `state$` [store](https://www.npmjs.com/package/universal-stores), which also contains one of the above
values and lets you subscribe to listen for changes.

A poller has also a public [signal](https://www.npmjs.com/package/@cdellacqua/signals) called `onData$`
to which you can attach subscribers. Those will be notified at every polling cycle
with the payload supplied by the `dataProvider` (if any).

## Creating a poller

`makePoller` is a factory function used to create Poller instances.
This function takes a configuration object.
Most parameters are optional.

2 arguments are needed to create a simple poller:

- `interval`, the delay (in milliseconds) between subsequent requests;
- `dataProvider`, the function to call periodically to perform the actual polling;

Let's see an example:

```ts
import {makePoller} from 'reactive-poller';

const examplePoller = makePoller({
	interval: 5000,
	dataProvider: () => fetch('http://www.example.com/'),
});

examplePoller.start().then(() => console.log('polling started'));
```

The other configuration parameters are:

- `monotonicTimeProvider`, a function that returns the current time in milliseconds. Defaults to `performance.now`;
- `retryInterval`, a delay (in milliseconds) used when the `dataProvider` throws an error. Defaults to `interval`;
- `errorHandler`, a callback that will receive the error thrown by the `dataProvider`. Defaults to `console.error`;
- `useDynamicInterval`, a boolean that determines whether or not the specified interval between polling cycles should
  be used as-is (`false`) or adjusted (`true`) to take into account the time spent in the `dataProvider`. Defaults to `true`.

## Listen for polled data

Each time the `dataProvider` returns (or resolves with) a value, the `onData$` signal
will send it to all subscribers.

```ts
import {makePoller} from 'reactive-poller';

const examplePoller = makePoller({
	interval: 5000,
	dataProvider: () => fetch('http://www.example.com/'),
});
examplePoller.onData$.subscribe(({status}) => console.log(`Received status ${status}`));
examplePoller.start().then(() => console.log('polling started'));
```

The `subscribe` method returns a function that can be used to remove the active
subscription:

```ts
import {makePoller} from 'reactive-poller';

const examplePoller = makePoller({
	interval: 5000,
	dataProvider: () => fetch('http://www.example.com/'),
});
const unsubscribe = examplePoller.onData$.subscribe(({status}) => console.log(`Received status ${status}`));
examplePoller.start().then(() => console.log('polling started'));

setTimeout(() => unsubscribe(), 8000); // stop printing 'Received status ...' after 8 seconds.
```

The `dataProvider` can also return `void` or `Promise<void>`:

```ts
import {makePoller} from 'reactive-poller';

const examplePoller = makePoller({
	interval: 5000,
	dataProvider: async () => {
		await fetch('http://www.example.com/');
	},
});
examplePoller.onData$.subscribe(() => console.log('fetch completed'));
examplePoller.start().then(() => console.log('polling started'));
```

## Notes on async

Once you create a `Poller<T>`, you will be able to start and stop it.

Both `start` and `stop` are async methods. The returned promise will let
the caller know when the polling actually starts or stops, taking into
account a pending polling operation.

As an example, when a poller is running it could be in two distinct scenarios:

- idling while waiting for the specified interval to pass;
- waiting for the `dataProvider` to finish its processing.

In the first scenario, calling `stop` will resolve almost immediately, cancelling
the delay, while in the second scenario it's necessary to wait for
the `dataProvider` to complete (or throw an error).

## Restarting a poller

It's also possible to restart a poller with a temporarily overridden configuration
using the `restart` method. Note that this method stops the poller first (if running, otherwise it just starts it).

```ts
import {makePoller} from 'reactive-poller';

const examplePoller = makePoller({
	interval: 5000,
	dataProvider: () => fetch('http://www.example.com/'),
});

examplePoller
	.restart({
		interval: 10000,
	})
	.then(() => console.log('polling started, using an interval of 10 seconds instead of 5'));
```

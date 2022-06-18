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

The `state` property mirrors the value of a `state$` store, which also contains one of the above
values and lets you subscribe to listen for changes.

## Creating a poller

`makePoller` is a factory function used to create Poller instances.
This function takes a configuration object.
Most parameters are optional.

3 arguments are needed to create a simple poller:
- interval, the delay (in milliseconds) between subsequent requests;
- producer, the function that provides the data, either by fetching it or generating it;
- consumer, the callback that will be notified once the producer has produced a result.

Let's see an example:

```ts
import {makePoller} from 'reactive-poller';

const examplePoller = makePoller({
	interval: 5000,
	producer: () => fetch('http://www.example.com/'),
	consumer: (response) => console.log(`Received status code ${response.status}`),
});

examplePoller.start()
	.then(() => console.log('polling started'));
```

The other configuration parameters are:
- monotonicTimeProvider, a function that returns the current time in milliseconds. Defaults to `performance.now`;
- retryInterval, a delay (in milliseconds) used when the producer or the consumer throw an error. Defaults to `interval`;
- errorHandler, a callback that will receive the error thrown by the producer or the consumer. Defaults to `console.error`;
- useDynamicInterval, a boolean that determines whether or not the specified interval between polling cycles should
be used as-is (`false`) or adjusted (`true`) to take into account the time spent producing and consuming
data. Defaults to `true`.

## Notes on async

Once you create a `Poller<T>`, you will be able to start and stop it.

Both `start` and `stop` are async methods. The returned promise will let
the caller know when the polling actually starts or stops, taking into
account a pending producer or consumer.

As an example, when a poller is running it could be in two distinct scenarios:
- idling while waiting for the specified interval to pass;
- waiting for the producer or consumer to finish their processing.

In the first scenario, calling `stop` will resolve almost immediately, cancelling
the delay, while in the second scenario it's necessary to wait for both
the producer and consumer to resolve their respective promises.

## Restarting a poller

It's also possible to restart a poller with a temporarily overridden configuration
using the `restart` method. Note that this method stops the poller first (if running, otherwise it just starts it).

```ts
import {makePoller} from 'reactive-poller';

const examplePoller = makePoller({
	interval: 5000,
	producer: () => fetch('http://www.example.com/'),
	consumer: (response) => console.log(`Received status code ${response.status}`),
});

examplePoller.restart({
	interval: 10000,
}).then(() => console.log('polling started, using an interval of 10 seconds instead of 5'));
```

import {makeStore, ReadonlyStore} from 'universal-stores';
import {SleepPromise, sleep} from '@cdellacqua/sleep';
import {makeSignal, ReadonlySignal} from '@cdellacqua/signals';

/**
 * Configuration parameters for making a Poller.
 */
export type MakePollerParams<T> = {
	/**
	 * A function that provides data, synchronously or asynchronously.
	 */
	dataProvider: () => Promise<T> | T;
	/**
	 * (optional) An error handler that will receive the errors that can
	 * occur in the dataProvider.
	 */
	errorHandler?: (err: unknown) => Promise<void> | void;
	/**
	 * The number of milliseconds between each polling cycle. Note
	 * that if `useDynamicInterval` is set to true the actual interval
	 * will be computed taking into account the time spent in the dataProvider.
	 */
	interval: number;
	/**
	 * (optional, defaults to `interval`) The number of milliseconds to wait before the next polling cycle
	 * if the dataProvider throws an error.
	 */
	retryInterval?: number;
	/**
	 * (optional, defaults to true) If true, the specified `interval` will
	 * represent the actual interval between two subsequent calls to the dataProvider.
	 * If false, the interval will simply represent a fixed delay between polling cycles.
	 *
	 * For example, let's imagine a scenario where the dataProvider takes 1 seconds to complete and the polling interval
	 * is set to 5 seconds. Setting `useDynamicInterval` to true would make the task sleep for 4 seconds
	 * before calling the dataProvider in the next cycle, totalling a 5 second delay between each dataProvider call, while `useDynamicInterval`
	 * set to false would delay for 5 seconds independently from the processing time, making the actual interval between
	 * each dataProvider calls reach a total of 6 seconds.
	 */
	useDynamicInterval?: boolean;
	/**
	 * (optional, defaults to performance.now) A function that provides the current time, used to
	 * compute the dynamic interval.
	 */
	monotonicTimeProvider?: () => number;
};

/**
 * All the possible states in which a poller can be.
 */
export type PollerState = 'initial' | 'running' | 'stopping' | 'stopped';

/**
 * A Poller is an helper object that enables querying a resource or performing a task
 * at fixed intervals.
 */
export type Poller<T> = {
	/**
	 * Return the current state of the poller. See {@link PollerState}.
	 */
	get state(): PollerState;
	/**
	 * A store containing the current state of the poller. See {@link PollerState}.
	 */
	state$: ReadonlyStore<PollerState>;
	/**
	 * A signal that will emit every time the dateProvider returns (or resolves with) a value.
	 */
	onData$: ReadonlySignal<T>;
	/**
	 * Start the polling loop.
	 *
	 * The returned promise will resolve when the poller state becomes 'running'.
	 */
	start(): Promise<void>;
	/**
	 * Stop the polling loop.
	 *
	 * The returned promise will resolve when the poller state becomes 'stopped'.
	 */
	stop(): Promise<void>;
	/**
	 * Restart the polling loop.
	 * An optional parameter can be passed
	 * to override the default configuration. Note that this override
	 * is temporary, once the poller is restarted the default configuration
	 * will be restored.
	 *
	 * If the poller is already in a 'stopped' state, this
	 * method behaves like `start`.
	 *
	 * The returned promise will resolve when the poller state becomes 'running'.
	 */
	restart(overrides?: Partial<MakePollerParams<T>>): Promise<void>;
};

/**
 * Create a poller.
 *
 * Example:
 * ```ts
 * const poller = makePoller({
 * 	interval: 500,
 * 	dataProvider: () => Math.floor(Math.random() * 10),
 * });
 * poller.start()
 * 	.then(() => console.log('polling started'), (err) => console.error('ops!', err));
 * ```
 *
 * @param config a object containing the desired configuration of the poller. See {@link MakePollerParams}
 * @returns a poller.
 */
export function makePoller<T>({
	dataProvider,
	errorHandler,
	interval,
	retryInterval,
	monotonicTimeProvider,
	useDynamicInterval = true,
}: MakePollerParams<T>): Poller<T> {
	const state$ = makeStore<PollerState>('initial');
	const onData$ = makeSignal<T>();
	let stoppingPromise: Promise<void> = Promise.resolve();
	let stoppingResolve = () => undefined as void;
	let sleepPromise: SleepPromise | null = null;

	const defaultErrorHandler = errorHandler ?? ((err) => console.error('an error occurred while polling', err));
	const defaultMonotonicTimeProvider = monotonicTimeProvider ?? (() => performance.now());

	async function start(overrides?: Partial<MakePollerParams<T>>) {
		if (state$.value === 'running') {
			return;
		}
		if (state$.value === 'stopping') {
			await stoppingPromise;
		}

		const overriddenErrorHandler = overrides?.errorHandler ?? defaultErrorHandler;
		const overriddenMonotonicTimeProvider = overrides?.monotonicTimeProvider ?? defaultMonotonicTimeProvider;
		const overriddenInterval = overrides?.interval ?? interval;
		const overriddenRetryInterval = overrides?.retryInterval ?? retryInterval;
		const overriddenDataProvider = overrides?.dataProvider ?? dataProvider;
		const overriddenUseDynamicInterval = overrides?.useDynamicInterval ?? useDynamicInterval;

		state$.set('running');
		(async () => {
			while (state$.value === 'running') {
				try {
					if (overriddenUseDynamicInterval) {
						const startedAt = overriddenMonotonicTimeProvider();
						const produced = await overriddenDataProvider();
						onData$.emit(produced);
						const now = overriddenMonotonicTimeProvider();
						const passedTime = now - startedAt;
						sleepPromise = sleep(Math.max(0, overriddenInterval - passedTime));
					} else {
						const produced = await overriddenDataProvider();
						onData$.emit(produced);
						sleepPromise = sleep(overriddenInterval);
					}
					await sleepPromise;
				} catch (err) {
					await Promise.resolve()
						.then(() => overriddenErrorHandler(err))
						.catch((handlerError) => {
							console.error('poller error handler threw an error', handlerError);
						});
					sleepPromise = sleep(overriddenRetryInterval ?? overriddenInterval);
					await sleepPromise;
				}
			}
		})().finally(() => {
			state$.set('stopped');
			stoppingResolve();
		});
	}

	async function stop() {
		if (state$.value === 'initial' || state$.value === 'stopped') {
			return;
		}

		if (state$.value === 'stopping') {
			return stoppingPromise;
		}

		if (state$.value === 'running') {
			stoppingPromise = new Promise((res) => {
				stoppingResolve = res;
			});
			state$.set('stopping');
			sleepPromise?.skip();
			await stoppingPromise;
		}
	}

	return {
		state$,
		get state() {
			return state$.value;
		},
		onData$,
		start,
		stop,
		restart: async (overrides) => {
			await stop();
			await start(overrides);
		},
	};
}

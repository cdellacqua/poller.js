import {makeStore, ReadonlyStore} from 'universal-stores';
import {sleep} from '@cdellacqua/sleep';
import {makeSignal, ReadonlySignal, Signal} from '@cdellacqua/signals';

/**
 * Configuration parameters for making a Poller.
 */
export type MakePollerParams<T, TAbort> = {
	/**
	 * A function that provides data, synchronously or asynchronously.
	 *
	 * If the task performed by this function can be stopped without necessarily
	 * waiting for it to resolve (e.g. a fetch supporting AbortController/AbortSignal),
	 * you can attach a subscriber to the passed onAbort$ argument and handle
	 * that logic.
	 *
	 * @param onAbort$ a signal that will emit at most once.
	 * Note that this signal is not recycled during subsequent polling cycles,
	 * in other words the dataProvider gets a new signal object at each cycle (and
	 * the previous one with its subscriber(s) gets garbage collected).
	 */
	dataProvider(onAbort$: ReadonlySignal<TAbort>): Promise<T> | T;
	/**
	 * (optional) An error handler that will receive the errors that can
	 * occur in the dataProvider.
	 * @param err the occurred error.
	 */
	errorHandler?(err: unknown): Promise<void> | void;
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
	monotonicTimeProvider?(): number;
};

/**
 * All the possible states in which a poller can be.
 */
export type PollerState = 'initial' | 'running' | 'stopping' | 'stopped';

/**
 * A Poller is an helper object that enables querying a resource or performing a task
 * at fixed intervals.
 */
export type Poller<T, TAbort> = {
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
	 * Stop the poller, but wait for the dataProvider to complete
	 * if it's already in a pending state (i.e. without emitting the onAbort$ signal).
	 *
	 * The returned promise will resolve when the poller state becomes 'stopped'.
	 */
	stop(): Promise<void>;
	/**
	 * Stop the poller and emit the onAbort$ signal.
	 *
	 * If called multiple times while waiting for a pending dataProvider,
	 * only the first call will emit the onAbort$ signal, while
	 * all subsequent calls will behave like the stop method,
	 * resolving only when the dataProvider completes.
	 *
	 * The returned promise will resolve when the poller state becomes 'stopped'.
	 *
	 * @param reason a reason that will be emitted by the onAbort$ signal
	 * and propagated to the dataProvider if the latter subscribed to it.
	 */
	abort(reason: TAbort): Promise<void>;
	/**
	 * Restart the polling loop by calling stop and start.
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
	restart(overrides?: Partial<MakePollerParams<T, TAbort>>): Promise<void>;
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
export function makePoller<T, TAbort = void>({
	dataProvider,
	errorHandler,
	interval,
	retryInterval,
	monotonicTimeProvider,
	useDynamicInterval = true,
}: MakePollerParams<T, TAbort>): Poller<T, TAbort> {
	const state$ = makeStore<PollerState>('initial');
	const onData$ = makeSignal<T>();
	let onAbort$: Signal<TAbort> | undefined;
	let stoppingPromise: Promise<void> = Promise.resolve();
	let stoppingResolve: (() => void) | undefined;
	let skipSleep$: Signal<void> | undefined;

	const defaultErrorHandler = errorHandler ?? ((err) => console.error('an error occurred while polling', err));
	const defaultMonotonicTimeProvider = monotonicTimeProvider ?? (() => performance.now());

	async function start(overrides?: Partial<MakePollerParams<T, TAbort>>) {
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
					const startedAt = overriddenUseDynamicInterval ? overriddenMonotonicTimeProvider() : 0;

					onAbort$ = makeSignal<TAbort>();
					const produced = await overriddenDataProvider(onAbort$);
					onData$.emit(produced);

					if (state$.value === 'running') {
						const now = overriddenUseDynamicInterval ? overriddenMonotonicTimeProvider() : 0;
						const passedTime = overriddenUseDynamicInterval ? now - startedAt : 0;
						skipSleep$ = makeSignal<void>();
						if (overriddenUseDynamicInterval) {
							await sleep(Math.max(0, overriddenInterval - passedTime), {hurry$: skipSleep$});
						} else {
							await sleep(overriddenInterval, {hurry$: skipSleep$});
						}
					}
				} catch (err) {
					await Promise.resolve()
						.then(() => overriddenErrorHandler(err))
						.catch((handlerError) => {
							console.error('poller error handler threw an error', handlerError);
						});
					if (state$.value === 'running') {
						skipSleep$ = makeSignal<void>();
						await sleep(overriddenRetryInterval ?? overriddenInterval, {hurry$: skipSleep$});
					}
				}
			}
		})().finally(() => {
			state$.set('stopped');
			stoppingResolve?.();
		});
	}

	async function stop(reasonWrapper?: {reason: TAbort}) {
		if (state$.value === 'initial' || state$.value === 'stopped') {
			return;
		}

		if (state$.value === 'stopping') {
			if (reasonWrapper) {
				onAbort$?.emit(reasonWrapper.reason);
				// remove the signal so that there is no risk of sending it multiple times
				onAbort$ = undefined;
			}
			return stoppingPromise;
		}

		if (state$.value === 'running') {
			stoppingPromise = new Promise((res) => {
				stoppingResolve = res;
			});
			state$.set('stopping');
			skipSleep$?.emit();
			if (reasonWrapper) {
				onAbort$?.emit(reasonWrapper.reason);
				// remove the signal so that there is no risk of sending it multiple times
				onAbort$ = undefined;
			}
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
		abort: (reason) => stop({reason}),
		restart: async (overrides) => {
			await stop();
			await start(overrides);
		},
	};
}

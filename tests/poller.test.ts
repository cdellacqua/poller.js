import spies from 'chai-spies';
import chai, {expect} from 'chai';
import {sleep} from '@cdellacqua/sleep';
import {makePoller} from '../src/lib';

chai.use(spies);

function nextTick() {
	return Promise.resolve();
}

let pendingSetTimeouts: {callback(): void; ttl: number}[] = [];
async function nextMillisecond() {
	pendingSetTimeouts.forEach((x) => {
		if (x.ttl > 0) {
			x.ttl--;
		}
	});
	const expired = pendingSetTimeouts.filter((x) => x.ttl === 0);
	expired.forEach((x) => x.callback());
	pendingSetTimeouts = pendingSetTimeouts.filter((x) => x.ttl > 0);

	await nextTick();
	await nextTick();
}
async function nextMilliseconds(ms: number) {
	for (let i = 0; i < ms; i++) {
		await nextMillisecond();
	}
}
function resolveAllPendingSetTimeout() {
	pendingSetTimeouts.forEach((x) => {
		x.callback();
	});
	pendingSetTimeouts = [];
}

describe('poller', () => {
	let setTimeoutSandbox: ChaiSpies.Sandbox | undefined;
	before(() => {
		setTimeoutSandbox = chai.spy.sandbox();
		setTimeoutSandbox.on(globalThis, 'setTimeout', (callback, ms, ...params) => {
			pendingSetTimeouts.push({
				callback: () => callback(...params),
				ttl: ms,
			});
		});
	});
	after(() => {
		setTimeoutSandbox?.restore();
		setTimeoutSandbox = undefined;
	});
	it('checks the poller state in different situations', async () => {
		const poller = makePoller({
			interval: 10,
			dataProvider: () => Math.floor(Math.random() * 10),
		});
		expect(poller.state).to.eq('initial');
		await poller.stop();
		expect(poller.state).to.eq('initial');
		await poller.start();
		expect(poller.state).to.eq('running');
		const stopPromise = poller.stop();
		expect(poller.state).to.eq('stopping');
		resolveAllPendingSetTimeout();
		await stopPromise;
		expect(poller.state).to.eq('stopped');
	});
	it('checks that the poller is fetching values from a synchronous producer', async () => {
		let i = 0;
		let actual: number | undefined;
		const poller = makePoller({
			interval: 2,
			dataProvider: () => {
				i++;
				return i;
			},
		});
		poller.onData$.subscribe((n) => {
			actual = n;
		});
		expect(actual).to.be.undefined;
		await poller.start();

		expect(actual).to.eq(1);
		await nextMilliseconds(2);

		expect(actual).to.eq(2);
		await poller.stop();
		expect(actual).to.eq(2);
	});
	it('overrides some poller settings', async () => {
		let i = 0;
		let actual: number | undefined;
		const poller = makePoller({
			interval: 2,
			dataProvider: () => {
				i++;
				return i;
			},
			monotonicTimeProvider: () => 0,
		});
		const unsubscribe = poller.onData$.subscribe((n) => {
			actual = n;
		});
		unsubscribe();
		poller.onData$.subscribe((n) => {
			actual = -n;
		});
		await poller.restart({
			dataProvider: () => {
				i += 2;
				return i;
			},
			interval: 4,
		});

		expect(actual).to.eq(-2);
		await nextMilliseconds(2);

		expect(actual).to.eq(-2);
		await nextMilliseconds(2);

		expect(actual).to.eq(-4);
		await poller.stop();
		expect(actual).to.eq(-4);
	});
	it('overrides more complex settings', async () => {
		let i = 0;
		let actual: number | undefined;
		const poller = makePoller({
			interval: 1,
			dataProvider: () => {
				i++;
				if (i > 2) {
					throw new Error('catch me!');
				}
				return i;
			},
			useDynamicInterval: false,
		});
		poller.onData$.subscribe((n) => {
			actual = n;
		});
		let customHandlerCalls = 0;
		let fakeTime = 0;
		await nextMillisecond();
		await poller.restart({
			errorHandler: () => {
				customHandlerCalls++;
			},
			monotonicTimeProvider: () => {
				fakeTime++;
				return fakeTime;
			},
			retryInterval: 3,
			useDynamicInterval: true,
		});
		expect(actual).to.eq(1);
		await nextMillisecond();
		expect(actual).to.eq(2);
		await nextMillisecond();
		expect(actual).to.eq(2);
		await nextMilliseconds(3 * 3);
		expect(customHandlerCalls).to.eq(3);
		await nextMillisecond();
		await poller.stop();
		expect(actual).to.eq(2);
	});
	it('tests dynamic interval', async () => {
		let consumerCalls = 0;
		let fakeTime = 0;
		const poller = makePoller({
			interval: 2,
			dataProvider: () => sleep(4).then(() => undefined),
			useDynamicInterval: true,
			monotonicTimeProvider: () => {
				fakeTime++;
				return fakeTime;
			},
		});
		poller.onData$.subscribe(() => {
			consumerCalls++;
		});
		await poller.start();
		expect(consumerCalls).to.eq(0);
		await nextMilliseconds(4);
		await nextMilliseconds(1);
		expect(consumerCalls).to.eq(1);
		await nextMilliseconds(4);
		await nextMilliseconds(1);
		expect(consumerCalls).to.eq(2);
		await nextMilliseconds(4);
		await nextMilliseconds(1);
		expect(consumerCalls).to.eq(3);
		resolveAllPendingSetTimeout();
		await poller.stop();
	});
	it('tests static interval', async () => {
		let consumerCalls = 0;
		const poller = makePoller({
			interval: 1,
			dataProvider: () => sleep(1).then(() => undefined),
			useDynamicInterval: false,
		});
		poller.onData$.subscribe(() => {
			consumerCalls++;
		});

		await poller.start();
		expect(consumerCalls).to.eq(0);
		await nextMilliseconds(2);
		expect(consumerCalls).to.eq(1);
		await nextMilliseconds(2);
		expect(consumerCalls).to.eq(2);
		await nextMilliseconds(2);
		expect(consumerCalls).to.eq(3);
		resolveAllPendingSetTimeout();
		await poller.stop();
	});
	it('starts while still running', async () => {
		const poller = makePoller({
			interval: 10,
			dataProvider: () => sleep(10).then(() => undefined),
		});
		await poller.start();
		expect(poller.state).to.eq('running');
		await poller.start();
		expect(poller.state).to.eq('running');
		resolveAllPendingSetTimeout();
		await poller.stop();
		expect(poller.state).to.eq('stopped');
	});
	it('starts while stopping', async () => {
		const poller = makePoller({
			interval: 10,
			dataProvider: () => sleep(10).then(() => undefined),
		});
		await poller.start();
		expect(poller.state).to.eq('running');
		const stopPromise = poller.stop();
		expect(poller.state).to.eq('stopping');
		const startPromise = poller.start();
		expect(poller.state).to.eq('stopping');
		resolveAllPendingSetTimeout();
		await Promise.all([stopPromise, startPromise]);
		expect(poller.state).to.eq('running');
		resolveAllPendingSetTimeout();
		await poller.stop();
	});
	it('stops while stopping', async () => {
		const poller = makePoller({
			interval: 10,
			dataProvider: () => sleep(10).then(() => undefined),
		});
		await poller.start();
		expect(poller.state).to.eq('running');
		const stopPromise1 = poller.stop();
		expect(poller.state).to.eq('stopping');
		const stopPromise2 = poller.stop();
		expect(poller.state).to.eq('stopping');
		resolveAllPendingSetTimeout();
		await Promise.all([stopPromise1, stopPromise2]);
		expect(poller.state).to.eq('stopped');
	});
	it('tests the error handler', async () => {
		let errorHandlerCalls = 0;
		const poller = makePoller({
			interval: 1,
			dataProvider: async () => {
				throw new Error('catch me!');
			},
			errorHandler: (err) => {
				errorHandlerCalls++;
				expect(String(err)).to.eq('Error: catch me!');
			},
			monotonicTimeProvider: () => 0,
		});
		await poller.start();
		await nextMillisecond();
		expect(errorHandlerCalls).to.eq(1);
		resolveAllPendingSetTimeout();
		await poller.stop();
	});
	it('tests a faulty error handler', async () => {
		const poller = makePoller({
			interval: 10,
			dataProvider: async () => {
				throw new Error('catch me!');
			},
			errorHandler: () => {
				throw new Error('ops!');
			},
		});
		await poller.start();
		await nextMillisecond();
		expect(poller.state).to.eq('running');
		resolveAllPendingSetTimeout();
		await poller.stop();
	});
	it('stops sending the abort signal', (done) => {
		const poller = makePoller({
			dataProvider: (onAbort$) => {
				return new Promise<void>((_, rej) => {
					onAbort$.subscribe(() => {
						rej();
					});
				});
			},
			interval: 0,
		});
		(async () => {
			await poller.start();
			poller.stop().catch(done);
			await nextMillisecond();
			expect(poller.state).to.eq('stopping');
			await poller.abort();
			expect(poller.state).to.eq('stopped');
			done();
		})().catch(done);
	});
	it('stops sending the abort signal with a payload', (done) => {
		const poller = makePoller<number>({
			dataProvider: (onAbort$) => {
				return new Promise<number>((_, rej) => {
					onAbort$.subscribe((payload) => {
						expect(payload).to.eq('bye!');
						rej(payload);
					});
				});
			},
			interval: 0,
		});
		(async () => {
			await poller.start();
			expect(poller.state).to.eq('running');
			await poller.abort('bye!');
			done();
			expect(poller.state).to.eq('stopped');
		})().catch(done);
	});
	it('stops sending the abort signal with a payload after normal stop', (done) => {
		const poller = makePoller<number>({
			dataProvider: (onAbort$) => {
				return new Promise<number>((_, rej) => {
					onAbort$.subscribe((payload) => {
						expect(payload).to.eq('bye!');
						rej(payload);
					});
				});
			},
			interval: 0,
			monotonicTimeProvider: () => 0,
		});
		(async () => {
			await poller.start();
			poller.stop().catch(done);
			expect(poller.state).to.eq('stopping');
			await poller.abort('bye!');
			expect(poller.state).to.eq('stopped');
			done();
		})().catch(done);
	});
	it('stops sending the abort signal multiple times', (done) => {
		let receivedAbortEvents = 0;
		const poller = makePoller<number>({
			dataProvider: (onAbort$) => {
				return new Promise<number>(() => {
					onAbort$.subscribe(() => {
						receivedAbortEvents++;
						expect(receivedAbortEvents).to.eq(1);
					});
				});
			},
			interval: 0,
			monotonicTimeProvider: () => 0,
		});
		(async () => {
			await poller.start();
			poller.abort().catch(done);
			poller.abort().catch(done);
			poller.abort().catch(done);
			poller.abort().catch(done);
			expect(poller.state).to.eq('stopping');
			done();
		})().catch(done);
	});
});

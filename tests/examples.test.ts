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

describe('examples', () => {
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

	it('makePoller', () => {
		expect(() =>
			makePoller({
				interval: 500,
				dataProvider: () => Math.floor(Math.random() * 10),
			}),
		).not.to.throw();
	});
	it('readme 1, 2', async () => {
		const fakeFetch = (_: string) => sleep(10).then(() => ({status: 200}));
		let actual = 0;
		const poller = makePoller({
			interval: 10,
			dataProvider: () => fakeFetch('http://www.example.com/'),
		});
		poller.onData$.subscribe((response) => {
			actual = response.status;
		});
		await poller.start();
		resolveAllPendingSetTimeout();
		await poller.stop();
		expect(actual).to.eq(200);
	});
	it('readme 2.5', async () => {
		const fakeFetch = (_: string) => sleep(10).then(() => ({status: 200}));
		let calls = 0;
		const poller = makePoller({
			interval: 10,
			dataProvider: () => fakeFetch('http://www.example.com/'),
			monotonicTimeProvider: () => 0,
		});
		const unsubscribe = poller.onData$.subscribe(() => {
			calls++;
		});
		await poller.start();
		await nextMilliseconds(10);
		unsubscribe();
		expect(calls).to.eq(1);
		resolveAllPendingSetTimeout();
		await poller.stop();
	});
	it('readme 2.75', async () => {
		const fakeFetch = (_: string) => sleep(10).then(() => ({status: 200}));
		let calls = 0;
		const poller = makePoller({
			interval: 10,
			dataProvider: async () => {
				await fakeFetch('http://www.example.com/');
			},
			monotonicTimeProvider: () => 0,
		});
		await poller.start();
		poller.onData$.subscribe(() => {
			calls++;
		});
		await nextMilliseconds(10);
		expect(calls).to.eq(1);
		await poller.stop();
	});
	it('readme 3', async () => {
		const fakeFetch = (_: string) => sleep(10).then(() => ({status: 200}));
		let calls = 0;
		const poller = makePoller({
			interval: 10,
			dataProvider: () => fakeFetch('http://www.example.com/'),
			monotonicTimeProvider: () => 0,
		});
		poller.onData$.subscribe(() => {
			calls++;
		});
		await poller.restart({
			interval: 40,
		});
		await nextMilliseconds(15);
		expect(calls).to.eq(1);
		await nextMilliseconds(30);
		expect(calls).to.eq(1);
		resolveAllPendingSetTimeout();
		await poller.stop();
	});
	it('readme - AbortController', async () => {
		let error: unknown;
		const fakeFetch = (_: string, {signal}: {signal: AbortSignal}) => {
			return new Promise((_, rej) => {
				signal.addEventListener('abort', () => {
					rej(new DOMException('failed'));
				});
			});
		};
		const poller = makePoller({
			interval: 5000,
			dataProvider: (onAbort$) => {
				const abortController = new AbortController();
				onAbort$.subscribe(() => abortController.abort());
				return fakeFetch('http://www.example.com/', {signal: abortController.signal});
			},
			errorHandler: (err) => {
				error = err;
				if (err instanceof DOMException && err.name === 'AbortError') {
					// ignore
					return;
				}
			},
		});

		await poller.start();
		await poller.abort();
		expect(error).not.to.be.undefined;
	});
});

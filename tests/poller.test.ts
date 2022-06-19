import {expect} from 'chai';
import {makePoller} from '../src/lib';
import {sleep} from '@cdellacqua/sleep';

describe('poller', () => {
	it('checks the poller state in different situations', async () => {
		const poller = makePoller({
			interval: 10,
			dataProvider: () => Math.floor(Math.random() * 10),
		});
		try {
			expect(poller.state).to.eq('initial');
			await poller.stop();
			expect(poller.state).to.eq('initial');
			await poller.start();
			expect(poller.state).to.eq('running');
			const stopPromise = poller.stop();
			expect(poller.state).to.eq('stopping');
			await stopPromise;
			expect(poller.state).to.eq('stopped');
		} finally {
			await poller.stop();
		}
	});
	it('checks that the poller is fetching values from a synchronous producer', async () => {
		let i = 0;
		let actual: number | undefined;
		const poller = makePoller({
			interval: 20,
			dataProvider: () => {
				i++;
				return i;
			},
		});
		poller.onData$.subscribe((n) => {
			actual = n;
		});
		try {
			expect(actual).to.be.undefined;
			await poller.start();
			expect(actual).to.eq(1);
			await sleep(24);
			expect(actual).to.eq(2);
			await poller.stop();
			expect(actual).to.eq(2);
		} finally {
			await poller.stop();
		}
	});
	it('overrides some poller settings', async () => {
		let i = 0;
		let actual: number | undefined;
		const poller = makePoller({
			interval: 20,
			dataProvider: () => {
				i++;
				return i;
			},
		});
		const unsubscribe = poller.onData$.subscribe((n) => {
			actual = n;
		});
		try {
			unsubscribe();
			poller.onData$.subscribe((n) => {
				actual = -n;
			});
			await poller.restart({
				dataProvider: () => {
					i += 2;
					return i;
				},
				interval: 40,
			});
			expect(actual).to.eq(-2);
			await sleep(24);
			expect(actual).to.eq(-2);
			await sleep(20);
			expect(actual).to.eq(-4);
			await poller.stop();
			expect(actual).to.eq(-4);
		} finally {
			await poller.stop();
		}
	});
	it('overrides more complex settings', async () => {
		let i = 0;
		let actual: number | undefined;
		const poller = makePoller({
			interval: 10,
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
		try {
			let customHandlerCalls = 0;
			let fakeTime = 0;
			await poller.restart({
				errorHandler: () => {
					customHandlerCalls++;
				},
				monotonicTimeProvider: () => {
					fakeTime++;
					return fakeTime;
				},
				retryInterval: 5,
				useDynamicInterval: true,
			});
			expect(actual).to.eq(1);
			await sleep(14);
			expect(actual).to.eq(2);
			await sleep(18);
			expect(actual).to.eq(2);
			expect(customHandlerCalls).to.eq(3);
			await poller.stop();
			expect(actual).to.eq(2);
		} finally {
			await poller.stop();
		}
	});
	it('tests dynamic interval', async () => {
		let consumerCalls = 0;
		const poller = makePoller({
			interval: 20,
			dataProvider: () => sleep(20).then(() => undefined),
			useDynamicInterval: true,
		});
		poller.onData$.subscribe(() => {
			consumerCalls++;
		});
		try {
			await poller.start();
			expect(consumerCalls).to.eq(0);
			await sleep(24);
			expect(consumerCalls).to.eq(1);
			await sleep(24);
			expect(consumerCalls).to.eq(2);
			await sleep(24);
			expect(consumerCalls).to.eq(3);
		} finally {
			await poller.stop();
		}
	});
	it('tests static interval', async () => {
		let consumerCalls = 0;
		const poller = makePoller({
			interval: 10,
			dataProvider: () => sleep(10).then(() => undefined),
			useDynamicInterval: false,
		});
		poller.onData$.subscribe(() => {
			consumerCalls++;
		});
		try {
			await poller.start();
			expect(consumerCalls).to.eq(0);
			await sleep(21);
			expect(consumerCalls).to.eq(1);
			await sleep(21);
			expect(consumerCalls).to.eq(2);
			await sleep(21);
			expect(consumerCalls).to.eq(3);
		} finally {
			await poller.stop();
		}
	});
	it('starts while still running', async () => {
		const poller = makePoller({
			interval: 10,
			dataProvider: () => sleep(10).then(() => undefined),
		});
		try {
			await poller.start();
			expect(poller.state).to.eq('running');
			await poller.start();
			expect(poller.state).to.eq('running');
			await poller.stop();
			expect(poller.state).to.eq('stopped');
		} finally {
			await poller.stop();
		}
	});
	it('starts while stopping', async () => {
		const poller = makePoller({
			interval: 10,
			dataProvider: () => sleep(10).then(() => undefined),
		});
		try {
			await poller.start();
			expect(poller.state).to.eq('running');
			const stopPromise = poller.stop();
			expect(poller.state).to.eq('stopping');
			const startPromise = poller.start();
			expect(poller.state).to.eq('stopping');
			await Promise.all([stopPromise, startPromise]);
			expect(poller.state).to.eq('running');
		} finally {
			await poller.stop();
		}
	});
	it('stops while stopping', async () => {
		const poller = makePoller({
			interval: 10,
			dataProvider: () => sleep(10).then(() => undefined),
		});
		try {
			await poller.start();
			expect(poller.state).to.eq('running');
			const stopPromise1 = poller.stop();
			expect(poller.state).to.eq('stopping');
			const stopPromise2 = poller.stop();
			expect(poller.state).to.eq('stopping');
			await Promise.all([stopPromise1, stopPromise2]);
			expect(poller.state).to.eq('stopped');
		} finally {
			await poller.stop();
		}
	});
	it('tests the error handler', async () => {
		let errorHandlerCalls = 0;
		const poller = makePoller({
			interval: 10,
			dataProvider: async () => {
				throw new Error('catch me!');
			},
			errorHandler: (err) => {
				errorHandlerCalls++;
				expect(String(err)).to.eq('Error: catch me!');
			},
		});
		try {
			await poller.start();
			await sleep(1);
			expect(errorHandlerCalls).to.eq(1);
		} finally {
			await poller.stop();
		}
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
		try {
			await poller.start();
			await sleep(1);
			expect(poller.state).to.eq('running');
		} finally {
			await poller.stop();
		}
	});
});

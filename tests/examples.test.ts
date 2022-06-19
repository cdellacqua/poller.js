import {expect} from 'chai';
import {makePoller} from '../src/lib';
import {sleep} from '@cdellacqua/sleep';

describe('examples', () => {
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
		try {
			await poller.start();
			await poller.stop();
			expect(actual).to.eq(200);
		} finally {
			await poller.stop();
		}
	});
	it('readme 2.5', (done) => {
		const fakeFetch = (_: string) => sleep(10).then(() => ({status: 200}));
		let calls = 0;
		const poller = makePoller({
			interval: 10,
			dataProvider: () => fakeFetch('http://www.example.com/'),
		});
		poller.start().catch(done);
		const unsubscribe = poller.onData$.subscribe(() => {
			calls++;
		});
		setTimeout(() => {
			unsubscribe();
			expect(calls).to.eq(1);
			poller.stop().then(() => done(), done);
		}, 15);
	});
	it('readme 2.75', async () => {
		const fakeFetch = (_: string) => sleep(10).then(() => ({status: 200}));
		let calls = 0;
		const poller = makePoller({
			interval: 10,
			dataProvider: async () => {
				await fakeFetch('http://www.example.com/');
			},
		});
		try {
			await poller.start();
			poller.onData$.subscribe(() => {
				calls++;
			});
			await sleep(10);
			expect(calls).to.eq(1);
		} finally {
			await poller.stop();
		}
	});
	it('readme 3', async () => {
		const fakeFetch = (_: string) => sleep(10).then(() => ({status: 200}));
		let calls = 0;
		const poller = makePoller({
			interval: 10,
			dataProvider: () => fakeFetch('http://www.example.com/'),
		});
		poller.onData$.subscribe(() => {
			calls++;
		});
		try {
			await poller.restart({
				interval: 40,
			});
			await sleep(15);
			expect(calls).to.eq(1);
			await sleep(30);
			expect(calls).to.eq(1);
			await poller.stop();
		} finally {
			await poller.stop();
		}
	});
});

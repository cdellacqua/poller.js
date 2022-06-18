import {expect} from 'chai';
import {makePoller} from '../src/lib';
import {sleep} from '@cdellacqua/sleep';

describe('examples', () => {
	it('makePoller', () => {
		expect(() =>
			makePoller({
				interval: 500,
				producer: () => Math.floor(Math.random() * 10),
				consumer: (n) => console.log(`Random number: ${n}`),
			}),
		).not.to.throw();
	});
	it('readme 1', async () => {
		const fakeFetch = (_: string) => sleep(10).then(() => ({status: 200}));
		let actual = 0;
		const poller = makePoller({
			interval: 10,
			producer: () => fakeFetch('http://www.example.com/'),
			consumer: (response) => {
				actual = response.status;
			},
		});
		try {
			await poller.start();
			await poller.stop();
			expect(actual).to.eq(200);
		} finally {
			await poller.stop();
		}
	});
	it('readme 1', async () => {
		const fakeFetch = (_: string) => sleep(10).then(() => ({status: 200}));
		let calls = 0;
		const poller = makePoller({
			interval: 10,
			producer: () => fakeFetch('http://www.example.com/'),
			consumer: () => {
				calls++;
			},
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

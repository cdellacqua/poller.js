import {makePoller} from './lib';
import {sleep} from '@cdellacqua/sleep';

console.log(`Random number: -`);

const poller = makePoller({
	interval: 500,
	dataProvider: () => sleep(1000).then(() => Math.floor(Math.random() * 10)),
});

poller.onData$.subscribe((n) => {
	console.log(`Random number: ${n}`);
});

poller.state$.subscribe((state) => console.log(`Poller state: ${state}`));

poller.start().then(
	async () => {
		console.log('successfully started, stopping in 5 seconds...');
		await sleep(5000);
		await poller.stop();
	},
	(err) => console.error('ops', err),
);

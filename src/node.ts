import {makePoller} from './lib';
import delay from 'delay';

console.log(`Random number: -`);

const poller = makePoller({
	interval: 500,
	producer: () => delay(1000).then(() => Math.floor(Math.random() * 10)),
	consumer: (n) => {
		console.log(`Random number: ${n}`);
	},
});

poller.state$.subscribe((state) => console.log(`Poller state: ${state}`));

poller.start().then(
	async () => {
		console.log('successfully started, stopping in 5 seconds...');
		await delay(5000);
		await poller.stop();
	},
	(err) => console.error('ops', err),
);

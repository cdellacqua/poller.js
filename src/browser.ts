import './style.css';
import {makePoller} from './lib';
import delay from 'delay';

const appDiv = document.getElementById('app') as HTMLDivElement;

const randomNumberDiv = document.createElement('div');
randomNumberDiv.textContent = `Random number: -`;
appDiv.appendChild(randomNumberDiv);
const stateDiv = document.createElement('div');
appDiv.appendChild(stateDiv);

const startButton = document.createElement('button');
startButton.textContent = 'Start';
startButton.onclick = () =>
	poller.start().then(
		() => console.log('successfully started'),
		(err) => console.error('ops', err),
	);
appDiv.appendChild(startButton);
const stopButton = document.createElement('button');
stopButton.textContent = 'Stop';
stopButton.onclick = () =>
	poller.stop().then(
		() => console.log('successfully stopped'),
		(err) => console.error('ops', err),
	);
appDiv.appendChild(stopButton);
const restartButton = document.createElement('button');
restartButton.textContent = 'Restart';
restartButton.onclick = () =>
	poller.restart().then(
		() => console.log('successfully restarted'),
		(err) => console.error('ops', err),
	);
appDiv.appendChild(restartButton);

const poller = makePoller({
	interval: 500,
	producer: () => delay(1000).then(() => Math.floor(Math.random() * 10)),
	consumer: (n) => {
		randomNumberDiv.textContent = `Random number: ${n}`;
	},
});

poller.state$.subscribe((state) => (stateDiv.textContent = `Poller state: ${state}`));
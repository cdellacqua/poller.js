import './style.css';
import {makePoller} from './lib';
import {sleep} from '@cdellacqua/sleep';
import {deriveSignal} from '@cdellacqua/signals';

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
const abortButton = document.createElement('button');
abortButton.textContent = 'Force Stop';
abortButton.onclick = () =>
	poller.abort().then(
		() => console.log('successfully stopped'),
		(err) => console.error('ops', err),
	);
appDiv.appendChild(abortButton);
const restartButton = document.createElement('button');
restartButton.textContent = 'Restart';
restartButton.onclick = () =>
	poller.restart().then(
		() => console.log('successfully restarted'),
		(err) => console.error('ops', err),
	);
appDiv.appendChild(restartButton);

const poller = makePoller<number>({
	interval: 500,
	dataProvider: async (onAbort$) => {
		await sleep(500, {hurry$: deriveSignal(onAbort$, () => new Error())});
		return Math.floor(Math.random() * 10);
	},
});

poller.onData$.subscribe((n) => {
	randomNumberDiv.textContent = `Random number: ${n}`;
});

poller.state$.subscribe((state) => (stateDiv.textContent = `Poller state: ${state}`));

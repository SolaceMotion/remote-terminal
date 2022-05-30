import 'vite/modulepreload-polyfill';

import { ITerminalOptions, Terminal } from 'xterm';
import { io } from 'socket.io-client';

import './style.css';
const socket = io('http://localhost:8001');

const app = document.querySelector<HTMLDivElement>('#entry')!;

const conf: ITerminalOptions = {
  fontFamily: 'JetBrains Mono',
  cols: 100,
  rows: 30,
};

const submitConnectionForm = document.getElementById('submit-connection')!;

let initialRequestSent = false;

const term = new Terminal(conf);

submitConnectionForm.addEventListener('submit', (e) => {
  e.preventDefault();

  if (!initialRequestSent) {
    term.open(app);
  }

  app.style.display = 'block';

  initialRequestSent = true;
  const { host, port } = e.currentTarget;

  socket.emit('terminal.details', {
    details: { host: host.value, port: port.value },
  });
});

term.onData((data) => socket.emit('terminal.data', data));

socket.on('terminal.inData', (data) => {
  term.write(data);
});

socket.on('terminal.conErr', () => {
  term.write('ERROR');
  console.log('could not connect');
});

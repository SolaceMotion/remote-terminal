const fs = require('fs');
const path = require('path');

const os = require('os');
const pty = require('node-pty');
const { createServer } = require('http');
const { Server } = require('socket.io');

const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());

const p = path.join(__dirname, '../remoteterm/dist');

app.use(express.static(p));

app.get('/', (req, res) => {
  res.sendFile(path.join(p, '/index.html'));
});

const shell = os.platform() === 'linux' ? 'ssh' : 'powershell.exe';

const httpServer = createServer(app);

const io = new Server(httpServer, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  socket.on('terminal.details', (data) => {
    //all terminal data
    let ptyProcess = pty.spawn(
      shell,
      [data.details.host, `-p${data.details.port}`],
      {
        name: 'xterm-color',
        cols: 100,
        rows: 30,
        cwd: process.env.HOME,
        env: process.env,
      }
    );
    console.log(ptyProcess.process);
    socket.on('terminal.data', (data) => {
      //write incoming data to bash process
      ptyProcess.write(data);
    });

    ptyProcess.on('data', (data) => {
      //process.stdout.write(data);

      if (
        data.includes('Bad') ||
        data.includes('Could not') ||
        data.includes('refused')
      ) {
        socket.emit('terminal.conErr');
      } else socket.emit('terminal.inData', data);
    });
  });
});

httpServer.listen(8001, () => console.log('listening'));

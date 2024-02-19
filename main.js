// main.js

const { app, BrowserWindow } = require('electron');
const path = require('path');
const childProcess = require('child_process');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1080,
    height: 720,
    webPreferences: {
      nodeIntegration: true,
    },
    icon: 'public/icon.ico'
  });

  // Load the localhost:3000 URL directly
  setTimeout(() => {
    mainWindow.loadURL('http://localhost:3000');
  }, 3000);

  mainWindow.on('closed', function () {
    mainWindow = null;
  });

  // Start Express server as a child process
  const expressServer = childProcess.spawn('node', ['server.js']);
  expressServer.stdout.on('data', (data) => {
    console.log(`Express Server: ${data}`);
  });
  expressServer.stderr.on('data', (data) => {
    console.error(`Express Server Error: ${data}`);
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  if (mainWindow === null) createWindow();
});

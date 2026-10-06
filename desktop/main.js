'use strict';

const { app, BrowserWindow, protocol, shell } = require('electron');
const fs = require('fs/promises');
const path = require('path');

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'tdapp',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true
    }
  }
]);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.txt': 'text/plain; charset=utf-8'
};

function appRoot() {
  return app.getAppPath();
}

function safeLocalPath(url) {
  const u = new URL(url);
  let rel = decodeURIComponent(u.pathname || '/');
  if (rel === '/' || rel === '') rel = '/testdrive/index.html';
  rel = rel.replace(/^\/+/, '');
  const root = appRoot();
  const full = path.resolve(root, rel);
  if (!full.startsWith(path.resolve(root) + path.sep) && full !== path.resolve(root)) {
    throw new Error('Blocked path');
  }
  return full;
}

async function handleAppRequest(request) {
  try {
    const filePath = safeLocalPath(request.url);
    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    return new Response(data, {
      status: 200,
      headers: {
        'content-type': MIME[ext] || 'application/octet-stream',
        'cache-control': 'no-store'
      }
    });
  } catch (error) {
    return new Response('Not found', {
      status: 404,
      headers: {'content-type': 'text/plain; charset=utf-8'}
    });
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1480,
    height: 920,
    minWidth: 1180,
    minHeight: 720,
    show: false,
    backgroundColor: '#f4f6f8',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      spellcheck: false
    }
  });

  win.loadURL('tdapp://local/testdrive/index.html');
  win.once('ready-to-show', () => {
    win.maximize();
    win.show();
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('tdapp://')) event.preventDefault();
  });

  win.webContents.on('did-finish-load', () => {
    win.webContents.executeJavaScript(`
      document.title = 'TestDrive Doc';
      const title = document.querySelector('.title-wrap strong');
      if (title) title.textContent = 'TestDrive Doc';
      const meta = document.querySelector('.title-wrap span');
      if (meta) meta.textContent = 'Desktop · локальная версия для Windows';
      const footer = document.querySelector('footer');
      if (footer) footer.textContent = 'TestDrive Doc Desktop · локальная работа на ноутбуке';
      document.documentElement.classList.add('desktop-app');
    `).catch(() => {});
  });
}

app.whenReady().then(async () => {
  await protocol.handle('tdapp', handleAppRequest);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

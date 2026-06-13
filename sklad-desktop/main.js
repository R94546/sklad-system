const { app, BrowserWindow, Tray, Menu, nativeImage, shell, dialog } = require('electron');
const path = require('path');
const { default: Store } = require('electron-store');
const { autoUpdater } = require('electron-updater');

const APP_URL = 'https://sklad-web-app.vercel.app';
const ICON_PATH = path.join(__dirname, 'assets', 'icon.png');

const store = new Store();
let mainWindow;
let tray;
let updateDownloaded = false;

function createWindow() {
  const bounds = store.get('windowBounds', { width: 1280, height: 800 });

  mainWindow = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    minWidth: 1024,
    minHeight: 600,
    icon: ICON_PATH,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: 'Sklad',
    show: false,
    backgroundColor: '#0F172A',
    autoHideMenuBar: true,
  });

  // Стандартное меню скрыто — это приложение, а не браузер
  mainWindow.setMenuBarVisibility(false);

  mainWindow.loadURL(APP_URL);

  // Если нет интернета — показать понятную заглушку с кнопкой «Повторить»
  mainWindow.webContents.on('did-fail-load', (e, code, desc, url, isMainFrame) => {
    if (!isMainFrame) return;
    mainWindow.loadURL(
      'data:text/html;charset=utf-8,' +
        encodeURIComponent(`
          <html><body style="margin:0;height:100vh;display:flex;flex-direction:column;
            align-items:center;justify-content:center;font-family:Segoe UI,Arial,sans-serif;
            background:#0F172A;color:#e2e8f0">
            <div style="font-size:54px;margin-bottom:12px">📦</div>
            <h2 style="margin:0 0 6px">Нет подключения к интернету</h2>
            <p style="color:#94a3b8;margin:0 0 20px">Проверьте сеть и повторите попытку</p>
            <button onclick="location.href='${APP_URL}'" style="padding:12px 28px;border:0;
              border-radius:10px;background:#4F46E5;color:#fff;font-size:15px;font-weight:600;
              cursor:pointer">Повторить</button>
          </body></html>`)
    );
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());

  // Внешние ссылки (target=_blank) открываем в системном браузере
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('resize', () => store.set('windowBounds', mainWindow.getBounds()));

  // Закрытие окна сворачивает в трей (приложение остаётся в фоне)
  mainWindow.on('close', (e) => {
    if (!app.isQuiting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  const icon = nativeImage.createFromPath(ICON_PATH).resize({ width: 16, height: 16 });
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Sklad — система управления', enabled: false },
    { type: 'separator' },
    { label: 'Открыть', click: () => { mainWindow.show(); mainWindow.focus(); } },
    { label: 'Проверить обновления', click: () => checkForUpdates(true) },
    { type: 'separator' },
    { label: 'Выход', click: () => { app.isQuiting = true; app.quit(); } },
  ]);

  tray.setToolTip('Sklad');
  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => { mainWindow.show(); mainWindow.focus(); });
}

// ===== Автообновление (через GitHub Releases) =====
// manual=true — показывать сообщения даже когда обновлений нет (ручная проверка из трея)
function checkForUpdates(manual = false) {
  autoUpdater.autoDownload = true;

  autoUpdater.removeAllListeners();

  autoUpdater.on('update-available', (info) => {
    if (manual) {
      dialog.showMessageBox(mainWindow, {
        type: 'info', title: 'Обновление',
        message: 'Доступна новая версия ' + info.version,
        detail: 'Загрузка началась. Мы сообщим, когда всё будет готово.',
        buttons: ['OK'],
      });
    }
  });

  autoUpdater.on('update-not-available', () => {
    if (manual) {
      dialog.showMessageBox(mainWindow, {
        type: 'info', title: 'Обновление',
        message: 'У вас последняя версия',
        detail: 'Текущая версия: ' + app.getVersion(),
        buttons: ['OK'],
      });
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    updateDownloaded = true;
    dialog.showMessageBox(mainWindow, {
      type: 'info', title: 'Обновление готово',
      message: 'Версия ' + info.version + ' загружена',
      detail: 'Перезапустить приложение, чтобы установить обновление?',
      buttons: ['Перезапустить', 'Позже'], defaultId: 0, cancelId: 1,
    }).then(({ response }) => {
      if (response === 0) { app.isQuiting = true; autoUpdater.quitAndInstall(); }
    });
  });

  autoUpdater.on('error', (err) => {
    if (manual) {
      dialog.showMessageBox(mainWindow, {
        type: 'error', title: 'Ошибка обновления',
        message: 'Не удалось проверить обновления',
        detail: String(err?.message || err),
        buttons: ['OK'],
      });
    }
  });

  autoUpdater.checkForUpdates().catch(() => {});
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) { mainWindow.show(); mainWindow.focus(); }
  });

  app.whenReady().then(() => {
    createWindow();
    createTray();
    // Тихая проверка обновлений при запуске + раз в 6 часов
    checkForUpdates(false);
    setInterval(() => { if (!updateDownloaded) checkForUpdates(false); }, 6 * 60 * 60 * 1000);
  });
}

app.on('window-all-closed', () => {
  // Трей держит приложение живым — не выходим автоматически
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
  else mainWindow.show();
});

app.on('before-quit', () => { app.isQuiting = true; });

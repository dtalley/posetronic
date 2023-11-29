import { app, BrowserWindow, screen, ipcMain, dialog, protocol } from 'electron';
import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs'

let win: BrowserWindow = null;
const args = process.argv.slice(1),
  serve = args.some(val => val === '--serve');

let windowConfig = {
  startWidth: 590,
  startHeight: 600
}
let savingData = false
let queueSave = false
let saveData = () => {
  if(savingData) {
    queueSave = true
    return;
  }

  savingData = true
  let userPath = app.getPath('userData')
  let dataFile = path.join(userPath, "window.json")
  let data = windowConfig
  let rawData = JSON.stringify(data)
  fs.writeFile(dataFile, rawData, {
    encoding: "utf8",
    flag: "w"
  }, () => {
    savingData = false;
    if(queueSave) {
      queueSave = false;
      saveData()
    }
  })
}

function createWindow(): BrowserWindow {

  const electronScreen = screen;

  protocol.registerFileProtocol("file", (request, cb) => {
    const url = request.url.replace('file:///', '')
    const decodedUrl = decodeURI(url)
    try {
      return cb(decodedUrl)
    } catch (error) {
      console.error('ERROR: registerLocalResourceProtocol: Could not get file path:', error)
    }
  })

  ipcMain.handle('open-folder-dialog', async () => {
    let dialogResult = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    return dialogResult
  })

  let userPath = app.getPath('userData')
  let dataFile = path.join(userPath, "window.json")
  if(fs.existsSync(dataFile)) {
    let rawData: string = fs.readFileSync(dataFile, {
      encoding: "utf8"
    })
    let parsed = JSON.parse(rawData)
    windowConfig.startWidth = parsed.startWidth || 590;
    windowConfig.startHeight = parsed.startHeight || 600;
  }

  // Create the browser window.
  win = new BrowserWindow({
    x: 0,
    y: 0,
    width: windowConfig.startWidth,
    height: windowConfig.startHeight,
    minHeight: 500,
    minWidth: 590,
    icon: "/assets/icons/favicon.png",
    webPreferences: {
      nodeIntegration: true,
      allowRunningInsecureContent: (serve) ? true : false,
      webSecurity: (serve) ? false : true
    },
  });

  win.setMenu(null);

  win.on('resize', ()=>{
    if(!win.isFullScreen()) {
      let size = win.getSize()
      windowConfig.startWidth = size[0]
      windowConfig.startHeight = size[1]
      saveData()
    }
  })

  if (serve) {
    require('electron-reload')(__dirname, {
      electron: require(`${__dirname}/node_modules/electron`)
    });
    win.loadURL('http://localhost:4200');
  } else {
    win.loadURL(url.format({
      pathname: path.join(__dirname, 'dist/index.html'),
      protocol: 'file:',
      slashes: true
    }));
  }

  if (serve) {
    win.webContents.openDevTools();
  }

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });

  return win;
}

try {

  app.allowRendererProcessReuse = true;

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  // Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
  app.on('ready', () => setTimeout(createWindow, 400));

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }
  });

} catch (e) {
  // Catch Error
  // throw e;
}

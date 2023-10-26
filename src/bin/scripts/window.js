const { app, BrowserWindow, Tray, Menu, screen } = require('electron')
const path = require('path');

function createWindow (port) {

  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.workAreaSize
  // Crea la ventana del navegador.
  const win = new BrowserWindow({
    width: 480,
    height: 720,
    x: width - 480,
    y: height - 720,
    maximizable: false,
    resizable: false,
    frame: false,
    webPreferences: {
      nodeIntegration: true
    }
  })


  global.autoLauncher.isEnabled().then(res => {
    let tray = new Tray(path.join(__dirname, '../../public/src/icons/HUM.ico'))
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Iniciar con el Sistema',
        type: 'checkbox',
        checked: res, 
        click: () => 
        {
          global.autoLauncher.isEnabled().then(res => {
            console.log(res);
            if(res)
            {
              global.autoLauncher.disable();
            }
            else
            {
              global.autoLauncher.enable();
            }
          })
        }
      },
      { label: 'Mostrar', click: () => { win.show()} },
      { label: 'Salir', click: () => { app.exit() } }
    ])
  
    tray.setContextMenu(contextMenu);
  
    tray.on('click', function(e){
      win.show();
    });
    
  });
  

  win.setMenu(null)
  win.setMenuBarVisibility(false)
  // Carga el archivo HTML.
  win.loadURL('http://localhost:'+port)

  win.on('close', function (event){
      event.preventDefault()
      win.hide()
      return false
   })

  return win;
}

// Este método se llamará cuando Electron haya terminado
// la inicialización y esté listo para crear ventanas del navegador.
// Algunas APIs pueden usarse solo después de que este evento ocurra.
global.appPath = app.getAppPath();

module.exports = async (port)=>
{
  app.whenReady().then(()=>{
    global.win = createWindow(port);
  })
}
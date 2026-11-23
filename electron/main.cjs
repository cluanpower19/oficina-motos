// Processo principal do app desktop (Windows/Mac). Abre o sistema numa janela.
// O site compilado (pasta dist) é servido pelo protocolo interno app://oficio,
// assim as rotas e os caminhos /img/... funcionam igual ao site na web.
const { app, BrowserWindow, protocol, net, shell, Menu } = require('electron')
const path = require('node:path')
const fs = require('node:fs')
const { pathToFileURL } = require('node:url')

const DIST = path.join(__dirname, '..', 'dist')
const ICONE = path.join(__dirname, '..', 'build', 'icon.png')

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } },
])

if (!app.requestSingleInstanceLock()) {
  app.quit()
}

let janela = null

function abrirJanela() {
  janela = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 980,
    minHeight: 640,
    backgroundColor: '#0b1016',
    title: 'Ofício do motor',
    icon: ICONE,
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  })

  // Links externos (WhatsApp, etc.) abrem no navegador padrão.
  janela.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:|^mailto:/i.test(url)) shell.openExternal(url)
    return { action: 'deny' }
  })
  janela.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('app://')) {
      e.preventDefault()
      if (/^https?:|^mailto:/i.test(url)) shell.openExternal(url)
    }
  })

  janela.loadURL('app://oficio/')
  janela.on('closed', () => { janela = null })
}

app.whenReady().then(() => {
  protocol.handle('app', (req) => {
    const { pathname } = new URL(req.url)
    let arquivo = path.normalize(path.join(DIST, decodeURIComponent(pathname)))
    // segurança: não sair da pasta dist
    if (!arquivo.startsWith(DIST)) arquivo = path.join(DIST, 'index.html')
    // rotas do sistema (ex.: /os/123): devolve o index.html
    if (!fs.existsSync(arquivo) || fs.statSync(arquivo).isDirectory()) arquivo = path.join(DIST, 'index.html')
    return net.fetch(pathToFileURL(arquivo).toString())
  })

  // Windows: sem menu. Mac: menu mínimo (precisa para copiar/colar e Cmd+Q funcionarem).
  if (process.platform === 'darwin') {
    Menu.setApplicationMenu(Menu.buildFromTemplate([{ role: 'appMenu' }, { role: 'editMenu' }, { role: 'windowMenu' }]))
  } else {
    Menu.setApplicationMenu(null)
  }
  abrirJanela()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) abrirJanela()
  })
})

app.on('second-instance', () => {
  if (janela) {
    if (janela.isMinimized()) janela.restore()
    janela.focus()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

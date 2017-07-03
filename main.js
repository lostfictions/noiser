const express = require('express')
const { app, BrowserWindow } = require('electron')
const path = require('path')
const url = require('url')

const config = {
  port: process.env.PORT || 3000,
}

const { adj, noun } = require('./corpora.json')
function randomInArray(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function getId() { return [randomInArray(adj), randomInArray(adj), randomInArray(noun)].join('-') }

//Don't quit on windows closed!
app.on('window-all-closed', () => {})

const windows = new Set()

function createWindow(cb) {
  console.log('creating browser window...')

  const win = new BrowserWindow({ show: false })

  windows.add(win)

  win.loadURL(url.format({
    pathname: path.join(__dirname, 'generator', 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // win.webContents.openDevTools()

  win.on('closed', () => {
    windows.delete(win)
  })

  win.webContents.session.once('will-download', (event, item, webContents) => {
    console.log('preparing download...')
    const path = `/tmp/${getId()}.wav`
    item.setSavePath(path)
    item.once('done', (event, state) => {
      if(state !== 'completed') {
        const err = `Download failed: ${state}`
        console.warn(err)
        cb(err)
      }
      else {
        console.log('download done')
        cb(null, path)
      }
      win.close()
    })
  })
}


const e = express()

e.get('/', (req, res) => {
  createWindow((err, path) => {
    console.log('req done!')
    if(err) {
      res.status(500).send(err)
    }
    else {
      res.sendFile(path)
    }
  })
})

e.get('/active', (req, res) => {
  res.send(windows.size.toString())
})

e.listen(config.port, () => {
  console.log(`Listening at ${config.port}`)
})

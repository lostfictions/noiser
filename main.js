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
  const win = new BrowserWindow({ show: false })

  windows.add(win)

  win.loadURL(url.format({
    pathname: path.join(__dirname, 'generator', 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  win.on('closed', () => {
    windows.delete(win)
  })

  win.webContents.session.once('will-download', (event, item) => {
    const path = `/tmp/${getId()}.wav`
    item.setSavePath(path)
    item.once('done', (event, state) => {
      if(state !== 'completed') {
        const err = `Download failed: ${state}`
        console.warn(err)
        cb(err)
      }
      else {
        cb(null, path)
      }
      win.close()
    })
  })
}


const e = express()

e.get('/', (req, res) => {
  createWindow((err, filePath) => {
    if(err) {
      res.status(500).send(err)
    }
    else {
      res.set({
        'Content-Type': 'application/download',
        'Content-Disposition': 'attachment; filename=' + path.basename(filePath)
      })
      res.sendFile(filePath)
    }
  })
})

e.get('/active', (req, res) => {
  res.send(windows.size.toString())
})

e.listen(config.port, () => {
  console.log(`Listening at ${config.port}`)
})

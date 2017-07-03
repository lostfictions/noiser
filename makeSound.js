const path = require('path')

const Nightmare = require('nightmare')
require('nightmare-download-manager')(Nightmare)

const nightmare = Nightmare()

let lastPath = ''

nightmare.on('download', function(state, downloadItem) {
  if(state == 'started') {
    lastPath = path.resolve('/tmp', 'file' + Math.random().toString() + '.wav')
    nightmare.emit('download', lastPath, downloadItem)
  }
})

const instance = nightmare
  .downloadManager()
  .goto('file://' + path.resolve(__dirname, 'nightmare', 'index.html'))
  // .catch(e => console.error(e))


  // .wait('#downloadframe')
  // .waitDownloadsComplete()

module.exports = function() {
  return instance
    .refresh()
    .wait('#downloadframe')
    .waitDownloadsComplete()
    .then(() => console.log('done'))
    .then(() => lastPath)
    // .end()
}

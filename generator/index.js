/*eslint no-use-before-define:["error", "nofunc"]*/
/*global ArrayBuffer:false, DataView:false*/

const ctx = new OfflineAudioContext(2, 44100 * 10, 44100)

const amt = Math.floor(1 + Math.random() * 10)

console.log('amt ' + amt)

const oscTypes = [
  'sine',
  'square',
  'sawtooth',
  'triangle'
]

for(let i = 0; i < amt; i++) {
  const osc = ctx.createOscillator()
  osc.frequency = Math.pow(4.088, Math.round(1 + Math.random() * 10))
  osc.detune = Math.round(1 + Math.random() * 10) * 100
  osc.type = oscTypes[Math.floor(Math.random() * oscTypes.length)]

  const gain = ctx.createGain()
  gain.gain = 0.5

  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.start()

  if(Math.random() < 0.5) {
    const lfo = ctx.createOscillator()
    lfo.frequency.value = Math.round(1 + Math.random() * 10)
    lfo.type = oscTypes[Math.floor(Math.random() * oscTypes.length)]

    const lfoGain = ctx.createGain()
    // const gainAmt = 0.5
    lfoGain.gain.value = Math.pow(4.088, Math.round(1 + Math.random() * 10))

    console.log(`[${i}] lfo freq ${lfo.frequency.value} - ${lfoGain.gain.value}`)
    lfo.connect(lfoGain)
    // lfoGain.connect(gain.gain)
    lfoGain.connect(osc.frequency)
    lfo.start()
  }

  if(Math.random() < 0.1) {
    const lfo = ctx.createOscillator()
    lfo.frequency.value = Math.round(1 + Math.random() * 10)
    lfo.type = oscTypes[Math.floor(Math.random() * oscTypes.length)]

    const lfoGain = ctx.createGain()
    lfoGain.gain.value = Math.pow(4.088, Math.round(1 + Math.random() * 10))

    console.log(`[${i}] lfo detune ${lfo.frequency.value} - ${lfoGain.gain.value}`)
    lfo.connect(lfoGain)
    // lfoGain.connect(gain.gain)
    lfoGain.connect(osc.detune)
    lfo.start()

  }
}


async function doRender() {
  const buff = await ctx.startRendering()

  // test play!
  // const c = new AudioContext()
  // const b = c.createBufferSource()
  // b.buffer = buff
  // b.connect(c.destination)
  // b.start()

  // ctx.suspend(2).then(() => console.log('suspended'))

  split(buff)
}

doRender()


///////////////////////


function split(buffer) {

  // calc number of segments and segment length
  // const channels = buffer.numberOfChannels
  const duration = buffer.duration
  const rate = buffer.sampleRate
  const segmentLen = 10
  const block = 10 * rate

  let count = Math.floor(duration / segmentLen)

  // console.dir({
  //   duration,
  //   segmentLen,
  //   count
  // })

  let offset = 0

  while(count--) {
    const url = URL.createObjectURL(bufferToWave(buffer, offset, block))

    // console.log('url: ' + url)

    // window.location = url

    const iframe = document.createElement('iframe')
    iframe.src = url
    document.body.appendChild(iframe)

    // const audio = new Audio(url)
    // audio.controls = true
    // audio.volume = 0.5
    // document.body.appendChild(audio)

    // const idoc = iframe.contentWindow.document
    // idoc.open()
    // idoc.write(html)
    // idoc.close()

    offset += block
  }
}

// Convert a audio-buffer segment to a Blob using WAVE representation
function bufferToWave(buffer, offset, len) {
  const numOfChan = buffer.numberOfChannels
  const length = len * numOfChan * 2 + 44

  const outputBuffer = new ArrayBuffer(length)
  const view = new DataView(outputBuffer)

  const channels = []

  let i
  let sample
  let pos = 0

  // write WAVE header
  setUint32(0x46464952)                         // "RIFF"
  setUint32(length - 8)                         // file length - 8
  setUint32(0x45564157)                         // "WAVE"

  setUint32(0x20746d66)                         // "fmt " chunk
  setUint32(16)                                 // length = 16
  setUint16(1)                                  // PCM (uncompressed)
  setUint16(numOfChan)
  setUint32(buffer.sampleRate)
  setUint32(buffer.sampleRate * 2 * numOfChan) // avg. bytes/sec
  setUint16(numOfChan * 2)                      // block-align
  setUint16(16)                                 // 16-bit (hardcoded in this demo)

  setUint32(0x61746164)                         // "data" - chunk
  setUint32(length - pos - 4)                   // chunk length

  // write interleaved data
  for(i = 0; i < buffer.numberOfChannels; i++)
    channels.push(buffer.getChannelData(i))

  while(pos < length) {
    for(i = 0; i < numOfChan; i++) {             // interleave channels
      sample = Math.max(-1, Math.min(1, channels[i][offset])) // clamp
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767)|0 // scale to 16-bit signed int
      view.setInt16(pos, sample, true)          // update data chunk
      pos += 2
    }
    offset++                                     // next source sample
  }

  return new Blob([outputBuffer], { type: 'application/download' })

  function setUint16(data) {
    view.setUint16(pos, data, true)
    pos += 2
  }

  function setUint32(data) {
    view.setUint32(pos, data, true)
    pos += 4
  }
}

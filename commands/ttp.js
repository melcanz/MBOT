const { createCanvas, registerFont } = require('canvas')
const fs = require('fs')
const path = require('path')
const os = require('os')
const { writeExifImg } = require('../lib/exif')

/* ================= FONT ================= */
const FONT_PATH = path.join(
  __dirname,
  '../font/Marcellus-Regular.ttf'
)

registerFont(FONT_PATH, { family: 'Marcellus' })

/* ================= COLOR MAP ================= */
const COLOR_MAP = {
  putih: '#ffffff',
  merah: '#ff0000',
  kuning: '#ffff00',
  hijau: '#00ff00',
  biru: '#00aaff',
  orange: '#ff9900',
  ungu: '#8e44ad',
  emas: '#ffd700',
  pink: '#ff69b4'
}

/* ================= COMMAND ================= */
module.exports = async function ttpCommand(sock, chatId, message) {
  const userMessage =
    message.message?.conversation ||
    message.message?.extendedTextMessage?.text ||
    ''

  const args = userMessage.split(' ').slice(1)

  let color = 'putih'
  let textParts = []

  for (const arg of args) {
    if (arg.startsWith('--')) {
      const c = arg.replace('--', '').toLowerCase()
      if (COLOR_MAP[c]) color = c
    } else {
      textParts.push(arg)
    }
  }

  const text = textParts.join(' ').trim()

  if (!text) {
    return sock.sendMessage(
      chatId,
      {
        text:
          'Contoh penggunaan:\n' +
          '.ttp halo\n' +
          '.ttp halo --merah\n' +
          'Warna yang tersedia (pink, emas, putih, merah, kuning, hijau, biru, orange, ungu)'
      },
      { quoted: message }
    )
  }

  try {
    const pngPath = await renderTTP(text, color)

    const webpPath = await writeExifImg(
      fs.readFileSync(pngPath),
      {
        packname: global.wm,
        author: global.auth
      }
    )

    await sock.sendMessage(
      chatId,
      { sticker: fs.readFileSync(webpPath) },
      { quoted: message }
    )

    fs.unlinkSync(pngPath)
    fs.unlinkSync(webpPath)

  } catch (err) {
    console.error('[TTP ERROR]', err)
    await sock.sendMessage(
      chatId,
      { text: 'Gagal membuat TTP.' },
      { quoted: message }
    )
  }
}

/* ================= RENDER ================= */
async function renderTTP(text, colorName = 'putih') {
  const size = 512
  const padding = 40
  const maxWidth = size - padding * 2

  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  ctx.clearRect(0, 0, size, size)

  let fontSize = 120
  let lines = []

  while (fontSize > 20) {
    ctx.font = `${fontSize}px Marcellus`
    lines = wrapText(ctx, text, maxWidth)

    const lineHeight = fontSize * 1.25
    const totalHeight = lines.length * lineHeight

    if (totalHeight <= size - padding * 2) break
    fontSize -= 5
  }

  ctx.font = `${fontSize}px Marcellus`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  ctx.fillStyle = COLOR_MAP[colorName] || '#ffffff'
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = Math.max(2, fontSize / 18)

  const lineHeight = fontSize * 1.25
  let y = size / 2 - ((lines.length - 1) * lineHeight) / 2

  for (const line of lines) {
    ctx.strokeText(line, size / 2, y)
    ctx.fillText(line, size / 2, y)
    y += lineHeight
  }

  const outPath = path.join(os.tmpdir(), `ttp_${Date.now()}.png`)
  fs.writeFileSync(outPath, canvas.toBuffer('image/png'))
  return outPath
}

/* ================= TEXT WRAP ================= */
function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ')
  const lines = []
  let line = ''

  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    const width = ctx.measureText(test).width

    if (width > maxWidth) {
      if (line) lines.push(line)
      line = word
    } else {
      line = test
    }
  }

  if (line) lines.push(line)
  return lines
}
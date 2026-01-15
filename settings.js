const settings = {
  packname: 'VantyxBot',
  author: '@VantyxBot',

  botName: 'Vantyx',
  botOwner: 'Bot',
  ownerNumber: '6287755080455',

  giphyApiKey: 'qnl7ssQChTdPjsKta2Ax2LMaGXz303tq',
  commandMode: 'private',

  maxStoreMessages: 20,
  storeWriteInterval: 10000,

  description: 'This is a bot for managing group commands and automating task.',
  version: '3.0.5',

  updateZipUrl: '',
}
// Wm Sticker
global.packname = settings.packname
global.author = settings.author
global.wm = settings.packname
global.auth = `Ig: ${settings.author.replace('@', '')}`

//Respon
global.error = "❌️ Terjadi kesalahan, mohon coba lagi nanti!"
global.load = "⏳️ Tunggu Sebentar, permintaan anda sedang kami proses"
global.succes = "✅️ Berhasil"
// CHANNEL
global.channel = "120363423464130445@newsletter"

global.prompt = "Kamu adalah Vantyx dan kamu diciptakan oleh Owner, aksen kamu jaksel dan kamu membantu dalam pengodean"


module.exports = settings

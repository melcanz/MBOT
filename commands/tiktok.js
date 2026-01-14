const { download } = require("./lib/tiktok")

const processedMessages = new Set()

module.exports = async function tiktokCommand(sock, chatId, message) {
  if (processedMessages.has(message.key.id)) return
  processedMessages.add(message.key.id)
  setTimeout(() => processedMessages.delete(message.key.id), 300000)

  try {
    const text =
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text

    if (!text) return

    const args = text.split(" ").slice(1)
    const url = args.find(v =>
      /^https?:\/\/(www\.)?(tiktok\.com|vt\.tiktok\.com)/.test(v)
    )

    const isViewOnce = args.includes("--vv")
    const isPTV = args.includes("--ptv")

    if (!url) {
      return sock.sendMessage(
        chatId,
        { text: "❌ Masukkan link TikTok" },
        { quoted: message }
      )
    }

    await sock.sendMessage(chatId, {
      react: { text: "⏳", key: message.key }
    })

    // ================= DOWNLOAD =================
    const data = await download(url)
    if (!data?.play && !data?.hdplay) {
      throw "Video URL tidak ditemukan"
    }

    const title = data.title?.trim() || "TikTok Video"

    // ⚠️ Prioritas kualitas
    const videoUrl =
      data.hdplay ||
      data.play ||
      data.wmplay

    // ================= SEND =================
    const payload = {
      video: { url: videoUrl },
      mimetype: "video/mp4",
      caption: `📥 TikTok Download\n📝 ${title}`,
      viewOnce: isViewOnce
    }

    // PTV (video bulat / videoNote)
    if (isPTV) {
      payload.videoNote = true
      delete payload.caption
    }

    await sock.sendMessage(chatId, payload, { quoted: message })

  } catch (e) {
    console.error("TIKTOK ERROR:", e)
    await sock.sendMessage(
      chatId,
      { text: "❌ Gagal download TikTok" },
      { quoted: message }
    )
  }
}

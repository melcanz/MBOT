const os = require('os')
const settings = require('../settings.js')

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    const parts = []
    if (days) parts.push(`${days} hari`)
    if (hours) parts.push(`${hours} jam`)
    if (minutes) parts.push(`${minutes} menit`)
    if (secs || parts.length === 0) parts.push(`${secs} detik`)

    return parts.join(', ')
}

function formatBytes(bytes) {
    const units = ['B', 'KB', 'MB', 'GB']
    let i = 0
    while (bytes >= 1024 && i < units.length - 1) {
        bytes /= 1024
        i++
    }
    return `${bytes.toFixed(2)} ${units[i]}`
}

async function pingCommand(sock, chatId, message) {
    try {
        const start = Date.now()
        await sock.sendMessage(chatId, { text: '🏓 Pong!' }, { quoted: message })
        const ping = Math.round((Date.now() - start) / 2)

        const uptime = formatUptime(process.uptime())

        const totalRam = os.totalmem()
        const freeRam = os.freemem()
        const usedRam = totalRam - freeRam

        const cpus = os.cpus()
        const cpuModel = cpus[0].model
        const cpuCore = cpus.length
        const load = os.loadavg()[0].toFixed(2)

        const botName = global.packname || 'WhatsApp Bot'

        const botInfo = `
🤖 ${botName}

⚡ Ping    : ${ping} ms
⏱️ Uptime  : ${uptime}

🧠 CPU     : ${cpuModel}
🧮 Core    : ${cpuCore}
📊 Load    : ${load}

💾 RAM     : ${formatBytes(usedRam)} / ${formatBytes(totalRam)}

🔖 Version : v${settings.version}
`.trim()

        await sock.sendMessage(
            chatId,
            { text: botInfo },
            { quoted: message }
        )

    } catch (err) {
        console.error('[PING ERROR]', err)
        await sock.sendMessage(
            chatId,
            { text: '❌ Gagal mengambil status bot.' },
            { quoted: message }
        )
    }
}

module.exports = pingCommand

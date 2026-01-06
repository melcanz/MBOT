const fetch = require('node-fetch')
const xvideos = require('../lib/xvideos')

// ======================
// CACHE (per chat)
// ======================
const xvCache = new Map()

function setCache(chatId, data) {
    xvCache.set(chatId, {
        data,
        expire: Date.now() + 2 * 60 * 1000 // 2 menit
    })
}

function getCache(chatId) {
    const cache = xvCache.get(chatId)
    if (!cache) return null
    if (Date.now() > cache.expire) {
        xvCache.delete(chatId)
        return 'expired'
    }
    return cache.data
}

// ======================
// COMMAND HANDLER
// ======================
module.exports = async (sock, chatId, message, userMessage) => {
    try {
        const text = userMessage.trim()
        const args = text.split(/\s+/)
        const cmd = args[0].toLowerCase()

        // ======================
        // 🔍 SEARCH
        // ======================
        if (cmd === '.xvsearch') {
            const query = args.slice(1).join(' ')
            if (!query) {
                await sock.sendMessage(
                    chatId,
                    { text: 'Cari apa?\nContoh: *.xvsearch japanese*' },
                    { quoted: message }
                )
                return
            }

            const res = await xvideos.search(query)
            if (!Array.isArray(res) || !res.length) {
                await sock.sendMessage(
                    chatId,
                    { text: 'Tidak ada hasil.' },
                    { quoted: message }
                )
                return
            }

            const list = res.slice(0, 10)
            setCache(chatId, list)

            let out = `🔎 *Hasil Pencarian*\n\n`
            out += list.map((v, i) =>
                `*${i + 1}.* ${v.title}\n⏱ ${v.duration} | 📺 ${v.resolution}`
            ).join('\n\n')

            out += `\n\n⬇️ *Download:*
.getxvideo 1
.getxvideo 1 2 3
.getxvideo all

⏳ *Berlaku 2 menit*`

            await sock.sendMessage(
                chatId,
                { text: out },
                { quoted: message }
            )
            return
        }

        // ======================
        // ⬇️ GET VIDEO
        // ======================
        if (cmd === '.getxvideo') {
            const params = args.slice(1)

            const cache = getCache(chatId)
            if (!cache) {
                await sock.sendMessage(
                    chatId,
                    { text: 'Belum ada list.\nGunakan *.xvsearch* dulu.' },
                    { quoted: message }
                )
                return
            }

            if (cache === 'expired') {
                await sock.sendMessage(
                    chatId,
                    { text: '⏳ List sudah kadaluarsa.\nSilakan *.xvsearch* ulang.' },
                    { quoted: message }
                )
                return
            }

            if (!params.length) {
                await sock.sendMessage(
                    chatId,
                    { text: 'Gunakan:\n.getxvideo 1\n.getxvideo 1 2 3\n.getxvideo all' },
                    { quoted: message }
                )
                return
            }

            // ===== tentukan index =====
            let indexes = []

            if (params[0].toLowerCase() === 'all') {
                indexes = cache.map((_, i) => i)
            } else {
                indexes = params
                    .join(' ')
                    .split(/[,\s]+/)
                    .filter(v => /^\d+$/.test(v))
                    .map(v => Number(v) - 1)

                indexes = [...new Set(indexes)]
            }

            if (!indexes.length) {
                await sock.sendMessage(
                    chatId,
                    { text: 'Format salah.\nContoh: *.getxvideo 1 2 3*' },
                    { quoted: message }
                )
                return
            }

            // ======================
            // SEND VIDEO
            // ======================
            for (const idx of indexes) {
                const item = cache[idx]
                if (!item) continue

                try {
                    const dl = await xvideos.download(item.link)
                    if (!dl || !dl.videos) continue

                    const videoUrl =
                        dl.videos.high ||
                        dl.videos.low ||
                        dl.videos.HLS

                    if (!videoUrl) continue

                    // ===== cek size =====
                    let isBig = false
                    try {
                        const head = await fetch(videoUrl, { method: 'HEAD' })
                        const len = head.headers.get('content-length')
                        if (len && Number(len) > 100 * 1024 * 1024) {
                            isBig = true
                        }
                    } catch {}

                    if (isBig) {
                        await sock.sendMessage(
                            chatId,
                            {
                                document: { url: videoUrl },
                                mimetype: 'video/mp4',
                                fileName: `${item.title || 'xvideo'}.mp4`
                            },
                            { quoted: message }
                        )
                    } else {
                        await sock.sendMessage(
                            chatId,
                            {
                                video: { url: videoUrl },
                                caption: item.title || ''
                            },
                            { quoted: message }
                        )
                    }

                } catch (err) {
                    console.error('GETXVIDEO ERROR:', err)
                }
            }

            return
        }

    } catch (e) {
        console.error('XVIDEOS CMD ERROR:', e)
    }
}
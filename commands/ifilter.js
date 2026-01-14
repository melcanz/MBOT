const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

const FILTERS = {
    // BASIC
    grayscale: 'format=gray',
    sepia: 'colorchannelmixer=.393:.769:.189:.349:.686:.168:.272:.534:.131',
    invert: 'negate',

    // INSTAGRAM LIKE
    moon: 'eq=contrast=1.4:brightness=0.05:saturation=0.3',
    clarendon: 'eq=contrast=1.25:saturation=1.35',
    lofi: 'eq=contrast=1.6:saturation=1.4',
    vintage: 'curves=vintage',
    warm: 'colorbalance=rs=0.15:bs=-0.15',
    cold: 'colorbalance=rs=-0.15:bs=0.15',

    // AESTHETIC
    soft: 'eq=contrast=0.9:brightness=0.05:saturation=0.9',
    vivid: 'eq=contrast=1.3:saturation=1.6',
    pastel: 'eq=contrast=0.95:saturation=0.8',
    dark: 'eq=contrast=1.4:brightness=-0.1',

    // SPECIAL
    blur: 'boxblur=5:1',
    sharpen: 'unsharp=5:5:1.5:5:5:0',
    glow: 'split[a][b];[a]boxblur=10:5[a];[b][a]blend=all_mode=screen'
};

async function iFilterCommand(sock, chatId, message, args = []) {
    try {
        const filter = args[0]?.toLowerCase();
        if (!filter || !FILTERS[filter]) {
            return sock.sendMessage(
                chatId,
                {
                    text:
`❌ Filter tidak valid

Available:
${Object.keys(FILTERS).join(', ')}

Contoh:
.ifilter moon`
                },
                { quoted: message }
            );
        }

        // =======================
        // AMBIL QUOTED MEDIA
        // =======================
        const ctx = message.message?.extendedTextMessage?.contextInfo;
        if (!ctx?.quotedMessage) {
            return sock.sendMessage(
                chatId,
                { text: '❌ Reply foto atau video' },
                { quoted: message }
            );
        }

        const quoted = ctx.quotedMessage;
        const isImage = !!quoted.imageMessage;
        const isVideo = !!quoted.videoMessage;

        if (!isImage && !isVideo) {
            return sock.sendMessage(
                chatId,
                { text: '❌ Hanya support foto atau video' },
                { quoted: message }
            );
        }

        const mediaMsg = {
            key: {
                remoteJid: chatId,
                id: ctx.stanzaId,
                participant: ctx.participant
            },
            message: quoted
        };

        const buffer = await downloadMediaMessage(
            mediaMsg,
            'buffer',
            {},
            { reuploadRequest: sock.updateMediaMessage }
        );

        // =======================
        // TEMP FILE
        // =======================
        const tmp = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmp)) fs.mkdirSync(tmp);

        const input = path.join(tmp, `ifilter_in_${Date.now()}`);
        const output = path.join(tmp, `ifilter_out_${Date.now()}.mp4`);

        fs.writeFileSync(input, buffer);

        // =======================
        // FFMPEG
        // =======================
        const cmd = isImage
            ? `ffmpeg -y -loop 1 -i "${input}" -vf "${FILTERS[filter]},scale=720:-2" -t 5 -pix_fmt yuv420p "${output}"`
            : `ffmpeg -y -i "${input}" -vf "${FILTERS[filter]},scale=720:-2" -pix_fmt yuv420p "${output}"`;

        await new Promise((resolve, reject) => {
            exec(cmd, err => err ? reject(err) : resolve());
        });

        // =======================
        // SEND RESULT
        // =======================
        await sock.sendMessage(
            chatId,
            {
                video: fs.readFileSync(output),
                caption: `🎨 Filter: ${filter}`
            },
            { quoted: message }
        );

        try {
            fs.unlinkSync(input);
            fs.unlinkSync(output);
        } catch {}

    } catch (err) {
        console.error('ifilter error:', err);
        await sock.sendMessage(
            chatId,
            { text: '❌ Gagal apply filter' },
            { quoted: message }
        );
    }
}

module.exports = iFilterCommand;

const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

async function viewonceCommand(sock, chatId, message) {
    const quoted =
        message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    const quotedImage = quoted?.imageMessage;
    const quotedVideo = quoted?.videoMessage;
    const quotedAudio = quoted?.audioMessage;

    // VIEW ONCE IMAGE
    if (quotedImage && quotedImage.viewOnce) {
        const stream = await downloadContentFromMessage(quotedImage, 'image');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

        await sock.sendMessage(
            chatId,
            {
                image: buffer,
                caption: quotedImage.caption || '',
            },
            { quoted: message }
        );

    // VIEW ONCE VIDEO
    } else if (quotedVideo && quotedVideo.viewOnce) {
        const stream = await downloadContentFromMessage(quotedVideo, 'video');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

        await sock.sendMessage(
            chatId,
            {
                video: buffer,
                caption: quotedVideo.caption || '',
            },
            { quoted: message }
        );

    // VIEW ONCE AUDIO / VOICE NOTE
    } else if (quotedAudio && quotedAudio.viewOnce) {
        const stream = await downloadContentFromMessage(quotedAudio, 'audio');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

        await sock.sendMessage(
            chatId,
            {
                audio: buffer,
                mimetype: quotedAudio.mimetype || 'audio/ogg; codecs=opus',
                ptt: quotedAudio.ptt || false, // true kalau voice note
            },
            { quoted: message }
        );

    } else {
        await sock.sendMessage(
            chatId,
            { text: '❌ Reply view-once image, video, atau audio.' },
            { quoted: message }
        );
    }
}

module.exports = viewonceCommand;

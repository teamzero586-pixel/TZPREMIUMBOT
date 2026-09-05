import { downloadMediaMessage } from 'baileys'
import stylizedChar from '../utils/fancy.js'

/**
 * Re-sends a quoted sticker using Baileys' native sticker buffer support.
 * The old metadata wrapper depended on an unmaintained native sharp build.
 */
export async function take(client, message) {
    const remoteJid = message.key.remoteJid
    const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage

    if (!quotedMessage?.stickerMessage) {
        return client.sendMessage(remoteJid, {
            text: stylizedChar('❌ Reply to a sticker to use .take.')
        })
    }

    try {
        const stickerBuffer = await downloadMediaMessage(
            { message: quotedMessage },
            'buffer',
            {},
            { logger: console }
        )
        if (!stickerBuffer) {
            return client.sendMessage(remoteJid, { text: '❌ Failed to download sticker.' })
        }
        await client.sendMessage(remoteJid, { sticker: stickerBuffer })
    } catch (error) {
        console.error('Sticker resend failed:', error.message)
        await client.sendMessage(remoteJid, {
            text: `⚠️ Sticker error: ${error.message}`
        })
    }
}

export default take
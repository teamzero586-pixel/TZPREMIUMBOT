import {
    makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion
} from 'baileys'
import configmanager from '../utils/configmanager.js'
import pino from 'pino'
import fs from 'fs'

const data = 'sessionData'
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

function clearSession() {
    try {
        fs.rmSync(data, { recursive: true, force: true })
        console.log('🧹 Cleared stale WhatsApp session. Ready for a fresh /pair request.')
    } catch (error) {
        console.error('Could not clear WhatsApp session:', error.message)
    }
}

async function connectToWhatsapp(handleMessage, options = {}) {
    const { version } = await fetchLatestBaileysVersion()
    const { state, saveCreds } = await useMultiFileAuthState(data)
    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        syncFullHistory: true,
        markOnlineOnConnect: true,
        logger: pino({ level: 'silent' }),
        keepAliveIntervalMs: 10000,
        connectTimeoutMs: 60000,
        generateHighQualityLinkPreview: true
    })

    let connectionState = 'connecting'
    options.onSocket?.(sock)
    options.onPairingReady?.(async (number) => {
        if (state.creds.registered) {
            throw new Error('WhatsApp session already registered. Use /status first.')
        }
        if (connectionState === 'close') {
            throw new Error('WhatsApp is reconnecting. Try /pair again in a few seconds.')
        }
        const normalized = configmanager.normalizeNumber(number)
        if (!normalized) throw new Error('Valid WhatsApp number required.')
        // Let WhatsApp generate the real, one-time pairing code.
        return sock.requestPairingCode(normalized)
    })
    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update

        if (connection === 'close') {
            connectionState = 'close'
            const statusCode = lastDisconnect?.error?.output?.statusCode
            const reason = lastDisconnect?.error?.toString() || 'unknown'
            console.log('❌ WhatsApp disconnected:', reason, 'StatusCode:', statusCode)

            if (statusCode === DisconnectReason.loggedOut) {
                clearSession()
            }

            console.log('🔄 Reconnecting in 5 seconds...')
            setTimeout(() => connectToWhatsapp(handleMessage, options), 5000)
        } else if (connection === 'connecting') {
            connectionState = 'connecting'
            console.log('⏳ Connecting WhatsApp...')
        } else if (connection === 'open') {
            connectionState = 'open'
            console.log('✅ WhatsApp connection established')

            try {
                const chatId = process.env.WELCOME_CHAT_ID
                const imagePath = './database/LuminX.jpg'
                if (chatId && fs.existsSync(imagePath)) {
                    await sock.sendMessage(chatId, {
                        image: { url: imagePath },
                        caption: '✅ 𝐀𝐌𝐀𝐍 𝐔𝐋𝐋𝐀𝐇 BUG MD connected successfully.',
                        footer: 'Powered by 𝗔𝗠𝗔𝗡 𝗧𝗘𝗖𝗛 𝗭𝗢𝗡𝗘'
                    })
                }
            } catch (error) {
                console.error('Welcome message failed:', error.message)
            }

            sock.ev.on('messages.upsert', async (msg) => handleMessage(sock, msg))
        }
    })

    // Pairing is intentionally user-triggered through Telegram /pair <number>.
    // This prevents an old session from showing a code before the owner asks.
    if (!state.creds.registered) {
        await sleep(100)
        console.log('📲 WhatsApp is ready for Telegram /pair <number>.')
    }

    return sock
}

export default connectToWhatsapp
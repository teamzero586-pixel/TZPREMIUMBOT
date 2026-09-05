import {
    makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion
} from 'baileys'
import pino from 'pino'
import fs from 'fs'

const SESSION_DIR = 'sessionData'

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

function clearSession() {
    try {
        fs.rmSync(SESSION_DIR, { recursive: true, force: true })
        console.log('🧹 Cleared stale WhatsApp session.')
    } catch (error) {
        console.error('Could not clear WhatsApp session:', error.message)
    }
}

// Connects to WhatsApp and exposes a requestPairingCode(number) function
// through the onPairingReady callback. No commands, no auto-responses —
// this module only exists to establish the connection needed for pairing.
export async function connectToWhatsapp(options = {}) {
    const { version } = await fetchLatestBaileysVersion()
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR)
    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' })
    })

    let connectionState = 'connecting'
    options.onSocket?.(sock)
    options.onPairingReady?.(async (number) => {
        if (state.creds.registered) {
            throw new Error('WhatsApp session already registered.')
        }
        if (connectionState === 'close') {
            throw new Error('WhatsApp is reconnecting. Try again in a few seconds.')
        }
        const normalized = number.replace(/[^0-9]/g, '')
        if (!normalized) throw new Error('Valid WhatsApp number required.')
        return sock.requestPairingCode(normalized)
    })

    sock.ev.on('creds.update', saveCreds)
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update
        if (connection === 'close') {
            connectionState = 'close'
            const statusCode = lastDisconnect?.error?.output?.statusCode
            if (statusCode === DisconnectReason.loggedOut) clearSession()
            console.log('🔄 Reconnecting in 5 seconds...')
            setTimeout(() => connectToWhatsapp(options), 5000)
        } else if (connection === 'connecting') {
            connectionState = 'connecting'
        } else if (connection === 'open') {
            connectionState = 'open'
            console.log('✅ WhatsApp connection established')
        }
    })

    if (!state.creds.registered) {
        await sleep(100)
        console.log('📲 WhatsApp is ready to pair.')
    }

    return sock
}

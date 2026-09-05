import { connectDB } from './db.js'
import { connectToWhatsapp } from './whatsapp.js'
import { startPairingWebsite } from './pairing.js'

(async () => {
    await connectDB()

    let requestPairingCode
    await connectToWhatsapp({
        onPairingReady(handler) {
            requestPairingCode = handler
        }
    })

    startPairingWebsite({
        requestPairingCode: async (number) => {
            if (!requestPairingCode) throw new Error('WhatsApp pairing is not ready yet.')
            return requestPairingCode(number)
        }
    })

    console.log('✅ TZ PREMIUM BOT pairing service started')
})()

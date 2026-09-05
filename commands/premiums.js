import configmanager from '../utils/configmanager.js'

function getTarget(message) {
    const body = message.message?.extendedTextMessage?.text ||
        message.message?.conversation || ''
    const args = body.trim().split(/\s+/).slice(1)
    const quoted = message.message?.extendedTextMessage?.contextInfo?.participant
    return quoted || args[0] || ''
}

export async function addprem(client, message) {
    const target = getTarget(message)
    const added = configmanager.addPremium(target)
    await client.sendMessage(message.key.remoteJid, {
        text: added
            ? `✅ Premium enabled for ${configmanager.normalizeNumber(target)}`
            : '❌ Provide a valid WhatsApp number or reply to a user.'
    })
}

export async function delprem(client, message) {
    const target = getTarget(message)
    const removed = configmanager.removePremium(target)
    await client.sendMessage(message.key.remoteJid, {
        text: removed
            ? `✅ Premium removed for ${configmanager.normalizeNumber(target)}`
            : '⚠️ That number is not in the premium list.'
    })
}

export default { addprem, delprem }
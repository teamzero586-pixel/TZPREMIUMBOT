import fs from 'fs'
import path from 'path'
import configmanager from '../utils/configmanager.js'

const configPath = path.join(process.cwd(), 'telegram-config.json')
const menuImagePath = path.join(process.cwd(), 'database', 'menu.jpg')
const config = readConfig()
const PLACEHOLDER = /^(?:PASTE_|REPLACE_|YOUR_|CHANGE_ME|TODO)|(?:_HERE$)/i
function readConfig() {
    try {
        return JSON.parse(fs.readFileSync(configPath, 'utf8'))
    } catch (error) {
        console.error('Telegram config could not be read:', error.message)
        return { enabled: false }
    }
}

function configured(value) {
    const text = String(value ?? '').trim()
    return Boolean(text && !PLACEHOLDER.test(text))
}

function number(value) {
    return String(value ?? '').replace(/\D/g, '')
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

async function telegramApi(method, body = {}) {
    const isMultipart = typeof FormData !== 'undefined' && body instanceof FormData
    const response = await fetch(`https://api.telegram.org/bot${config.botToken}/${method}`, {
        method: 'POST',
        ...(isMultipart ? {} : { headers: { 'content-type': 'application/json' } }),
        body: isMultipart ? body : JSON.stringify(body)
    })
    const result = await response.json()
    if (!response.ok || !result.ok) {
        throw new Error(result.description || `Telegram ${method} failed`)
    }
    return result.result
}

function channelItems() {
    return (config.membership?.channels || [])
        .map((item) => ({ ...item, kind: 'channel' }))
        .filter((item) => configured(item.url) || configured(item.chatId))
}

function contactKeyboard() {
    const username = String(config.ownerUsername || 'amaanullah42').replace(/^@/, '')
    return {
        inline_keyboard: [
            [{ text: '👤 CONTACT OWNER', url: `https://t.me/${username}` }]
        ]
    }
}

function membershipKeyboard() {
    const rows = channelItems().map((item, index) => [{
        text: `📢 ${item.title || `CHANNEL ${index + 1}`}`,
        ...(configured(item.url)
            ? { url: item.url }
            : { callback_data: `missing_link:${index}` })
    }])
    rows.push([{ text: '✅ CHECK MEMBERSHIP', callback_data: 'check_membership' }])
    rows.push([{ text: '👤 CONTACT OWNER', url: `https://t.me/${String(config.ownerUsername || 'amaanullah42').replace(/^@/, '')}` }])
    return { inline_keyboard: rows }
}

function ownerKeyboard() {
    return {
        inline_keyboard: [
            [
                { text: '📊 STATUS', callback_data: 'owner_status' },
                { text: '📲 PAIRING', callback_data: 'owner_pair_help' }
            ],
            [
                { text: '💎 PREMIUM', callback_data: 'owner_premium_help' },
                { text: '⚙️ MEMBERSHIP', callback_data: 'owner_membership' }
            ],
            [
                { text: '👤 CONTACT OWNER', url: `https://t.me/${String(config.ownerUsername || 'amaanullah42').replace(/^@/, '')}` }
            ]
        ]
    }
}

function ownerPanel() {
    return [
        '👑 𝙰𝙼𝙰𝙽 𝚄𝙻𝙻𝙰𝙷 𝙱𝚄𝙶 𝙼𝙳 𝙾𝚆𝙽𝙴𝚁 𝙿𝙰𝙽𝙴𝙻',
        '',
        '✨ Welcome back, Owner',
        '🛡️ Full admin control is enabled for your Telegram ID.',
        '',
        '📌 Commands:',
        '/premium add <number> — premium add',
        '/premium del <number> — premium delete',
        '/premium list — premium users',
        '/free on|off — free/public mode',
        '/pair <number> — WhatsApp pairing code',
        '/pair mode on|off — pairing allow/stop',
        '/pair status — pairing status',
        '/status — bot status',
        '/membership — configured channels',
        '/help — show this panel'
    ].join('\n')
}

function userPanel() {
    return [
        '✨ 𝙰𝙼𝙰𝙽 𝚄𝙻𝙻𝙰𝙷 𝙱𝚄𝙶 𝙼𝙳',
        '',
        '✅ Channel membership verified.',
        '',
        '📲 Pair your WhatsApp:',
        '/pair <WhatsApp number>',
        '',
        'Example: /pair 923xxxxxxxxx',
        '',
        '⚠️ Only the pairing command is available for users.'
    ].join('\n')
}

function joinText(missing = []) {
    const owner = `@${String(config.ownerUsername || 'amaanullah42').replace(/^@/, '')}`
    return [
        '⛔ ACCESS LOCKED',
        '',
        'Bot use karne se pehle neeche diye gaye channels join karein.',
        'Join karne ke baad CHECK MEMBERSHIP press karein.',
        '',
        missing.length ? `Missing: ${missing.join(', ')}` : '',
        `Need help? Contact owner: ${owner}`
    ].filter(Boolean).join('\n')
}

async function membershipStatus(userId) {
    const items = channelItems()
    if (!items.length || items.some((item) => !configured(item.chatId))) {
        return {
            configured: false,
            missing: ['Owner ne channel usernames/chat IDs set nahi kiye.']
        }
    }

    const missing = []
    for (const item of items) {
        try {
            const member = await telegramApi('getChatMember', {
                chat_id: item.chatId,
                user_id: userId
            })
            const active = ['creator', 'administrator', 'member'].includes(member.status) ||
                (member.status === 'restricted' && member.is_member)
            if (!active) missing.push(item.title)
        } catch (error) {
            console.error(`Membership check failed for ${item.title}:`, error.message)
            missing.push(`${item.title} (bot admin/chat ID check)`)
        }
    }
    return { configured: true, missing }
}

async function send(chatId, text, extra = {}) {
    return telegramApi('sendMessage', {
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
        ...extra
    })
}

async function sendPanel(chatId, text, replyMarkup) {
    if (fs.existsSync(menuImagePath) && typeof FormData !== 'undefined' && typeof Blob !== 'undefined') {
        try {
            const form = new FormData()
            form.append('chat_id', String(chatId))
            form.append('photo', new Blob([fs.readFileSync(menuImagePath)], { type: 'image/jpeg' }), 'menu.jpg')
            form.append('caption', text)
            form.append('reply_markup', JSON.stringify(replyMarkup))
            return await telegramApi('sendPhoto', form)
        } catch (error) {
            console.error('Telegram panel image failed, sending text panel:', error.message)
        }
    }
    return send(chatId, text, { reply_markup: replyMarkup })
}

function ownerOnly(message) {
    return configured(config.ownerId) &&
        String(message.from?.id) === String(config.ownerId).trim()
}

async function requestPairingCodeFromRuntime(getWhatsappSocket, requestPairingCode, target) {
    let lastError
    for (let attempt = 0; attempt < 10; attempt += 1) {
        try {
            configmanager.setOwnerNumber(target)
            if (typeof requestPairingCode === 'function') {
                return await requestPairingCode(target)
            }
            const socket = getWhatsappSocket()
            if (!socket?.requestPairingCode) throw new Error('WhatsApp socket is not ready')
            return await socket.requestPairingCode(target)
        } catch (error) {
            lastError = error
            await sleep(3000)
        }
    }
    throw lastError || new Error('WhatsApp pairing is not ready')
}

async function handlePairCommand(message, action, getWhatsappSocket, requestPairingCode) {
    if (!configmanager.isPairingEnabled()) {
        return send(message.chat.id, '⚠️ Pairing mode is OFF. Contact owner.')
    }
    const target = number(action)
    if (target.length < 7) {
        return send(message.chat.id, 'Use: /pair <WhatsApp number>', { reply_markup: contactKeyboard() })
    }
    try {
        const code = await requestPairingCodeFromRuntime(getWhatsappSocket, requestPairingCode, target)
        return send(message.chat.id, [
            '✅ Pairing code generated',
            '',
            `📲 Code: ${code}`,
            '',
            'WhatsApp > Linked devices > Link with phone number',
            '',
            'Code valid for a short time. Use it now.'
        ].join('\n'))
    } catch (error) {
        return send(message.chat.id, `❌ Pairing failed: ${error.message}\n\nTry /pair again after WhatsApp reconnects.`, {
            reply_markup: contactKeyboard()
        })
    }
}

async function handleOwnerCommand(message, text, getWhatsappSocket, requestPairingCode) {
    const [command, action, rawValue] = text.split(/\s+/)

    if (command === '/help' || command === '/panel' || command === '/start') {
        return sendPanel(message.chat.id, ownerPanel(), ownerKeyboard())
    }

    if (command === '/status') {
        const socket = getWhatsappSocket()
        const connected = Boolean(socket?.user?.id)
        const users = Object.keys(configmanager.config.users || {}).length
        return send(message.chat.id, [
            '📊 STATUS',
            `WhatsApp: ${connected ? 'connected' : 'not connected'}`,
            `Free mode: ${configmanager.isFreeMode() ? 'ON' : 'OFF'}`,
            `Pairing: ${configmanager.isPairingEnabled() ? 'ON' : 'OFF'}`,
            `Premium users: ${configmanager.getPremiumNumbers().length}`,
            `Profiles: ${users}`
        ].join('\n'), { reply_markup: ownerKeyboard() })
    }

    if (command === '/free') {
        if (!['on', 'off'].includes(action)) return send(message.chat.id, 'Use: /free on or /free off')
        configmanager.setFreeMode(action === 'on')
        return send(message.chat.id, `✅ Free mode ${action.toUpperCase()}`)
    }

    if (command === '/premium' || command === '/addpremium' || command === '/delpremium') {
        const operation = command === '/addpremium' ? 'add' : command === '/delpremium' ? 'del' : action
        const target = command === '/premium' ? rawValue : action
        if (!['add', 'del', 'remove', 'list'].includes(operation)) {
            return send(message.chat.id, 'Use: /premium add|del|list <WhatsApp number>')
        }
        if (operation === 'list') {
            const users = configmanager.getPremiumNumbers()
            return send(message.chat.id, users.length
                ? `💎 Premium users:\n${users.map((item, i) => `${i + 1}. ${item}`).join('\n')}`
                : '💎 Premium list empty.')
        }
        const normalized = number(target)
        if (normalized.length < 7) return send(message.chat.id, '❌ Valid WhatsApp number required.')
        const changed = operation === 'add'
            ? configmanager.addPremium(normalized)
            : configmanager.removePremium(normalized)
        return send(message.chat.id, operation === 'add'
            ? `✅ Premium enabled: ${normalized}`
            : changed ? `✅ Premium removed: ${normalized}` : `⚠️ Not found: ${normalized}`)
    }

    if (command === '/membership') {
        const items = channelItems()
        return send(message.chat.id, items.map((item, index) =>
            `${index + 1}. ${item.title}: ${configured(item.url) ? 'link set' : 'link missing'} / ${configured(item.chatId) ? 'chat ID set' : 'chat ID missing'}`
        ).join('\n') || 'No channels configured.', { reply_markup: ownerKeyboard() })
    }

    if (command === '/pair') {
        if (action === 'status') return send(message.chat.id, `Pairing mode: ${configmanager.isPairingEnabled() ? 'ON' : 'OFF'}`)
        if (action === 'mode') {
            if (!['on', 'off'].includes(rawValue)) return send(message.chat.id, 'Use: /pair mode on or /pair mode off')
            configmanager.setPairingEnabled(rawValue === 'on')
            return send(message.chat.id, `✅ Pairing mode ${rawValue.toUpperCase()}`)
        }
        return handlePairCommand(message, action, getWhatsappSocket, requestPairingCode)
    }

    return sendPanel(message.chat.id, ownerPanel(), ownerKeyboard())
}

async function handleMessage(message, getWhatsappSocket, requestPairingCode) {
    if (!message?.chat?.id || !message.from) return
    if (message.chat.type !== 'private') {
        return send(message.chat.id, 'Bot commands private chat mein use karein.')
    }

    const text = String(message.text || '').trim()
    if (ownerOnly(message)) return handleOwnerCommand(message, text, getWhatsappSocket, requestPairingCode)

    const status = await membershipStatus(message.from.id)
    if (status.missing.length) {
        return send(message.chat.id, joinText(status.missing), {
            reply_markup: membershipKeyboard()
        })
    }

    const [command, action] = text.split(/\s+/)
    if (command === '/pair') {
        return handlePairCommand(message, action, getWhatsappSocket, requestPairingCode)
    }
    if (command === '/start' || command === '/check') {
        return sendPanel(message.chat.id, userPanel(), contactKeyboard())
    }
    return send(message.chat.id, 'Only pairing is available for users:', {
        reply_markup: {
            inline_keyboard: [
                [{ text: '📲 HOW TO PAIR', callback_data: 'user_pair_help' }],
                [{ text: '👤 CONTACT OWNER', url: `https://t.me/${String(config.ownerUsername || 'amaanullah42').replace(/^@/, '')}` }]
            ]
        }
    })
}

async function handleCallback(callback, getWhatsappSocket, requestPairingCode) {
    await telegramApi('answerCallbackQuery', { callback_query_id: callback.id })
    const message = callback.message
    if (!message?.chat?.id) return

    if (callback.data?.startsWith('missing_link:')) {
        return send(message.chat.id, '⚠️ Owner ne abhi is channel ka link set nahi kiya.')
    }

    if (callback.data === 'check_membership') {
        const status = await membershipStatus(callback.from.id)
        if (status.missing.length) {
            return send(message.chat.id, joinText(status.missing), { reply_markup: membershipKeyboard() })
        }
        return sendPanel(message.chat.id, userPanel(), contactKeyboard())
    }

    if (ownerOnly({ from: callback.from })) {
        if (callback.data === 'owner_status') {
            return handleOwnerCommand({ chat: message.chat, from: callback.from }, '/status', getWhatsappSocket, requestPairingCode)
        }
        if (callback.data === 'owner_pair_help') {
            return send(message.chat.id, '📲 Use /pair <WhatsApp number> to request a real one-time WhatsApp pairing code.')
        }
        if (callback.data === 'owner_premium_help') {
            return send(message.chat.id, '💎 Use /premium add <number>, /premium del <number>, or /premium list.')
        }
        if (callback.data === 'owner_membership') {
            return handleOwnerCommand({ chat: message.chat, from: callback.from }, '/membership', getWhatsappSocket, requestPairingCode)
        }
    }

    if (callback.data === 'user_pair_help') {
        const status = await membershipStatus(callback.from.id)
        if (status.missing.length) {
            return send(message.chat.id, joinText(status.missing), { reply_markup: membershipKeyboard() })
        }
        return send(message.chat.id, '📲 Send: /pair <WhatsApp number>\n\nExample: /pair 923xxxxxxxxx', {
            reply_markup: contactKeyboard()
        })
    }
}

export function startTelegramBot({ getWhatsappSocket, requestPairingCode }) {
    if (!config.enabled || !configured(config.botToken) || !configured(config.ownerId)) {
        console.log('ℹ️ Telegram control disabled: fill telegram-config.json botToken and ownerId.')
        return { stop() {} }
    }

    let stopped = false
    let offset = 0
    const timeout = Math.max(1, Number(config.pollingTimeoutSeconds) || 25)

    const poll = async () => {
        console.log('✅ Telegram owner control started')
        while (!stopped) {
            try {
                const updates = await telegramApi('getUpdates', {
                    offset,
                    timeout,
                    allowed_updates: ['message', 'callback_query']
                })
                for (const update of updates) {
                    offset = update.update_id + 1
                    if (update.callback_query) {
                        await handleCallback(update.callback_query, getWhatsappSocket, requestPairingCode)
                    } else if (update.message) {
                        await handleMessage(update.message, getWhatsappSocket, requestPairingCode)
                    }
                }
            } catch (error) {
                console.error('Telegram polling error:', error.message)
                await sleep(5000)
            }
        }
    }

    poll().catch((error) => console.error('Telegram controller stopped:', error.message))
    return {
        stop() {
            stopped = true
        }
    }
}
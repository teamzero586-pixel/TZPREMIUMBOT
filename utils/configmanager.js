import fs from 'fs'
import path from 'path'

const root = process.cwd()
const configPath = path.join(root, 'config.json')
const premiumPath = path.join(root, 'db.json')

const DEFAULT_USER = {
    sudoList: [],
    tagAudioPath: 'database/DevWeed.mp3',
    antilink: true,
    response: true,
    autoreact: false,
    prefix: '.',
    reaction: '⏳️',
    welcome: false,
    record: true,
    type: false,
    publicMode: false
}

function readJson(filePath, fallback) {
    if (!fs.existsSync(filePath)) return fallback
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'))
    } catch (error) {
        console.error(`Could not read ${path.basename(filePath)}. Using defaults.`, error.message)
        return fallback
    }
}

const config = readJson(configPath, {
    ownerNumber: 'PASTE_WHATSAPP_OWNER_NUMBER_HERE',
    runtime: { freeMode: false, pairingEnabled: true },
    users: {}
})

config.users ??= {}
config.runtime ??= {}
config.runtime.freeMode = Boolean(config.runtime.freeMode)
config.runtime.pairingEnabled = config.runtime.pairingEnabled !== false

for (const [number, user] of Object.entries(config.users)) {
    config.users[number] = { ...DEFAULT_USER, ...user }
}

const loadedPremiums = readJson(premiumPath, {
    premiumUser: { creator: '', users: [] }
})

const legacyPremiums = loadedPremiums?.premiumUser ?? {}
const legacyUsers = Array.isArray(legacyPremiums.users)
    ? legacyPremiums.users
    : Object.values(legacyPremiums)
        .map((value) => value?.premium || value?.creator)
        .filter(Boolean)

const premiums = {
    premiumUser: {
        creator: String(legacyPremiums.creator || ''),
        users: [...new Set(legacyUsers.map(toNumber).filter(Boolean))]
    }
}

function toNumber(value) {
    const digits = String(value ?? '').replace(/\D/g, '')
    if (!digits || digits.startsWith('PASTE') || digits.length < 7) return ''
    return digits
}

function toJid(value) {
    const number = toNumber(value)
    return number ? `${number}@s.whatsapp.net` : ''
}

function saveConfig() {
    fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`)
}

function savePremium() {
    fs.writeFileSync(premiumPath, `${JSON.stringify(premiums, null, 2)}\n`)
}

function ensureUser(number) {
    const normalized = toNumber(number)
    if (!normalized) return ''
    config.users[normalized] = {
        ...DEFAULT_USER,
        ...config.users[normalized],
        sudoList: Array.isArray(config.users[normalized]?.sudoList)
            ? config.users[normalized].sudoList
            : [toJid(normalized)]
    }
    return normalized
}

const configmanager = {
    config,
    premiums,

    save() {
        saveConfig()
    },

    saveP() {
        savePremium()
    },

    normalizeNumber: toNumber,
    toJid,

    getOwnerNumber() {
        return toNumber(config.ownerNumber)
    },

    setOwnerNumber(number) {
        const normalized = ensureUser(number)
        if (!normalized) return false
        config.ownerNumber = normalized
        config.users[normalized].sudoList = [
            ...new Set([...(config.users[normalized].sudoList || []), toJid(normalized)])
        ]
        saveConfig()
        return true
    },

    ensureUser,

    getPremiumNumbers() {
        return [...premiums.premiumUser.users]
    },

    getPremiumJids() {
        return this.getPremiumNumbers().map(toJid)
    },

    isPremium(value) {
        const number = toNumber(value)
        return Boolean(number && premiums.premiumUser.users.includes(number))
    },

    addPremium(value) {
        const number = toNumber(value)
        if (!number) return false
        if (!premiums.premiumUser.users.includes(number)) {
            premiums.premiumUser.users.push(number)
            savePremium()
        }
        return true
    },

    removePremium(value) {
        const number = toNumber(value)
        const before = premiums.premiumUser.users.length
        premiums.premiumUser.users = premiums.premiumUser.users.filter((item) => item !== number)
        if (before !== premiums.premiumUser.users.length) savePremium()
        return before !== premiums.premiumUser.users.length
    },

    isFreeMode() {
        return Boolean(config.runtime.freeMode)
    },

    setFreeMode(enabled) {
        config.runtime.freeMode = Boolean(enabled)
        for (const user of Object.values(config.users)) {
            user.publicMode = config.runtime.freeMode
        }
        saveConfig()
    },

    isPairingEnabled() {
        return config.runtime.pairingEnabled !== false
    },

    setPairingEnabled(enabled) {
        config.runtime.pairingEnabled = Boolean(enabled)
        saveConfig()
    }
}

export default configmanager
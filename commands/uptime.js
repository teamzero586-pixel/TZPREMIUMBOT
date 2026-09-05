export async function uptime(client, message) {
    const remoteJid = message.key.remoteJid
    const uptime = process.uptime()
    
    const days = Math.floor(uptime / 86400)
    const hours = Math.floor((uptime % 86400) / 3600)
    const minutes = Math.floor((uptime % 3600) / 60)
    const seconds = Math.floor(uptime % 60)
    
    const text = `┌─⏰️ 𝗔𝗠𝗔𝗡 𝗕𝗨𝗚 𝗠𝗗 🚀─┐
│
│ ⏱️ Uptime: ${days}d ${hours}h ${minutes}m
│ 💾 RAM: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1)}MB
│
│ "Beyond limits, we rise."
│     - Lumina-
└────────────────────┘`
    
    await client.sendMessage(remoteJid, { text: text })
}

export default uptime

import stylizedChar from "../utils/fancy.js"

export async function pingTest(client, message) {
    const remoteJid = message.key.remoteJid
    const start = Date.now()

    await client.sendMessage(remoteJid, { text: "📡 Pinging..." }, { quoted: message })

    const latency = Date.now() - start

    await client.sendMessage(remoteJid, {
        text: stylizedChar(
            `🚀 AMAN bug Md Network\n\n` +
            `Latency: ${latency} ms\n\n` +
            `𝗜'𝙼 𝗔𝗠𝗔𝗡 𝗧𝗘𝗖𝗛`
        )
    }, { quoted: message })
}

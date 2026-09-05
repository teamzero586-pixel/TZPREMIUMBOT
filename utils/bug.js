async function bug(message, client, texts, num) {
    try {
        const remoteJid = message.key?.remoteJid;
        await client.sendMessage(remoteJid, {
            image: { url: `database/${num}.jpg` },
            caption: `> ${texts}`,
            contextInfo: {
                externalAdReply: {
                    title: "Join Our WhatsApp Channel",
                    body: " 𝗜'𝗠 𝗔𝗠𝗔𝗡 𝗧𝗘𝗖𝗛 𝗭𝗢𝗡𝗘 ",
                    mediaType: 1,
                    thumbnailUrl: `https://whatsapp.com/channel/0029Vb8Hsxs72WU1Dx57eu1q`,
                    renderLargerThumbnail: false,
                    mediaUrl: `${num}.jpg`,
                    sourceUrl: `${num}.jpg`
                }
            }
        });
    } catch (e) {
        console.log(e);
    }
}

export default bug;

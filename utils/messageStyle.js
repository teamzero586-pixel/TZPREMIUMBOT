import fs from "fs"
import stylizedChar from "./fancy.js"

export default function stylizedCardMessage(text) {
  return {
    text: stylizedChar(text),
    contextInfo: {
      externalAdReply: {
        title: "Amanullah bug Md",
        body: "𝗜'𝙼 𝗔𝗠𝗔𝗡 𝗧𝗘𝗖𝗛 𝗭𝗢𝗡𝗘",
        thumbnail: fs.readFileSync("./database/Lumix.jpg"),
        sourceUrl: "https://whatsapp.com/channel/0029Vb8Hsxs72WU1Dx57eu1q",
        mediaType: 1,
        renderLargerThumbnail: false
      }
    }
  }
}

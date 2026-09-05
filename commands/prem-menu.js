/*
export async function prem(client, message) {

    const remoteJid = message.key.remoteJid;

    const today = new Date();

    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    const currentDay = daysOfWeek[today.getDay()];

    const currentDate = today.getDate();

    const currentMonth = today.getMonth() + 1; 

    const currentYear = today.getFullYear();

    const owner = " ☆𝗔𝗠𝗔𝗡 𝗧𝗘𝗖𝗛☆ ? ";

    const username = message.pushName || "Unknown";

    const prefix = configmanager.config.users[number]?.prefix || '!'; // Default prefix if not found
    

    const t = ` 
╭─────────────────╮
     𝗔𝗠𝗔𝗡 𝗕𝗨𝗚 𝐌𝐃
╰─────────────────╯
╭─────────────────╮
│ ❏Prefix : ${prefix}  
│ ❏User : ${username}  
│ ❏Day : ${currentDay}
│ ❏Date : ${currentDate}/${currentMonth}/${currentYear} 
│ ❏Version : 3
│ ❏Plugins : 2
│ ❏Type : MD 
╰─────────────────╯

╭────[ PREMIUM CMDS ]─────╮
│      
│ 💎⬢ connect 221xxxxx
│ 💎⬢ reconnect 221xxxxx            
│ 💎⬢ disconnect 221xxxxx        
╰─────────────────╯        

© made by ☆𝗔𝗠𝗔𝗡 𝐃𝙴𝚅☆
    `
;

    await client.sendMessage(remoteJid, {

        image: { url: "database/menu1.jpg" },

        caption: t,

        contextInfo: {

            participant: '0@s.whatsapp.net',

            remoteJid: 'status@broadcast',

            quotedMessage: { conversation:" ☆𝗔𝗠𝗔𝗡 𝐓𝐞𝐜𝐡☆ "}, 

            isForwarded: true,
        },


    });
}   

export default prem;
*/

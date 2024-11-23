exports.zuna = {
    name: ['tiktok', 'tt'],
    exec: async(m, zuna, name) => {
        try {
            console.log(name)
            if (name.includes(m.text)) {
                if (!m.text.split(' ')[1]) return zuna.sendMessage(m.chat, { text: 'Send command with url!'}, { quoted: m })
                const reactionMessage = {
                    react: {
                        text: "🕑",
                        key: m.key
                    }
                }
                await zuna.sendMessage(m.chat, reactionMessage)
                const json = await Api.nazuna('/download/tiktokv2', { url: m.text.split(' ')[1] })
                if (!json.status) return zuna.sendMessage(m.chat, { text: 'Wrong fetch from data!'}, { quoted: m })
            }
        } catch (e) {
            console.log(e)
        }
    },
    error: false,
}
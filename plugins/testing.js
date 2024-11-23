exports.zuna = {
    name: ['helo', 'hello'],
    exec: async(m, zuna) => {
        await zuna.sendMessage(m.chat, { text: 'Haii!' }, { quoted: m });
    },
    error: false
}
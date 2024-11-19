const { makeWASocket, DisconnectReason, useMultiFileAuthState, Browsers } = require('@whiskeysockets/baileys')
const pino = require('pino')
const env = require('./config.json')

async function connectToWhatsapp() {
    let checkStatusPiring;
    if (env.pairing.status == true) {
        checkStatusPiring = false
    } else {
        checkStatusPiring = true
    }
    const { state, saveCreds } = await useMultiFileAuthState('nazuna');
    const sock = makeWASocket({
        logger: pino({
            level: "fatal"
        }),
        printQRInTerminal: checkStatusPiring,
        auth: state,
        defaultQueryTimeoutMs: undefined,
        keepAliveIntervalMs: 30000,
        browser: Browsers.macOS("Edge"),
        shouldSyncHistoryMessage: () => true,
        markOnlineOnConnect: true,
        syncFullHistory: false,
        generateHighQualityLinkPreview: true
    })
    if (env.pairing.status && !sock.authState.creds.registered) {
        // let phoneNumber = "";
        // if (!phoneNumber) {
        //     phoneNumber = await new Promise((resolve) => require('readline').createInterface({ 
        //         input: process.stdin,
        //         output: process.stdout
        //     }).question('Input your phone number: ', resolve))
        // }
        console.log("Get code...")
        setTimeout(async () => {
            const code = await sock.requestPairingCode(env.pairing.number)
            console.log(code)
        }, 5000);
    }
    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;
        if ( connection === "close" ) {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
            if ( shouldReconnect ) {
                console.log("Running Kembali")
                connectToWhatsapp()
            }
        }

        if ( connection === "open" ) {
            console.log("Success Connect")
        }
    })
    sock.ev.on("creds.update", saveCreds);

    // Event Messages
    sock.ev.on("messages.upsert", async ({ messages }) => {
        global.m = messages[0];
        if (!m.message) return;
        // Message Jid
        m.jid = m.key.remoteJid;
        // Jika Sebuah Status Kita Tambahkan Auto Read Status
        if (m.jid === "status@broadcast") return sock.readMessages([m.key]);
        // Message From Group
        m.isGroup = m.jid.endsWith("@g.us");
        // User Jid || Jika Dari Group Kita Ambil Dari Participant Namun Jika Bukan Dari Group, Kita Ambil Dari remoteJid
        m.userJid = m.isGroup ? m.key.participant : m.key.remoteJid // Atau m.jid
        // Nmae Dari Profile Pengirim
        m.userName = m.pushName
        // Jika Pesan Dari Bot
        m.fromMe = m.key.fromMe
        // Type Dari Sebuah Pesan
        m.type = Object.keys(m.message)[0]
        // Pesan Text & Jika Pesan extendedTextMessage Kita Ambil Textnya & Jika Pesan Conversation Kita Ambil Conversation
        m.text = m.type === "extendedTextMessage" 
        ? m.message.extendedTextMessage.text 
        : m.type === "conversation" 
        ? m.message.conversation 
        : m.type === "imageMessage" 
        ? m.message.imageMessage.caption 
        : "";
        if (!m.fromMe || m.text !== 'p') return
        const sendMessage = await sock.sendMessage(m.jid, { text: 'https://github.com/zeyndvp'}, { quoted: m })
        console.log(m)
    })

    sock.ev.on("group-participants.update", (group) => {
        // if (group || group.action == "add") {
        //     sock.sendMessage(group.id, { text: "Selamat datang di indomaret @" + group.participants[0]})
        // }
        console.log(group)
    })
    
    sock.ev.on("call", (call) => {
        if (call[0].status === "offer") {
            sock.rejectCall(call[0].id, call[0].from)
            console.log(call)
        }
    })
}

module.exports = connectToWhatsapp();
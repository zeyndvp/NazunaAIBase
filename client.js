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
        const msg = messages[0];
        if (!msg.message) return;
        // Message Jid
        msg.jid = msg.key.remoteJid;
        // Jika Sebuah Status Kita Tambahkan Auto Read Status
        if (msg.jid === "status@broadcast") return sock.readMessages([msg.key]);
        // Message From Group
        msg.isGroup = msg.jid.endsWith("@g.us");
        // User Jid || Jika Dari Group Kita Ambil Dari Participant Namun Jika Bukan Dari Group, Kita Ambil Dari remoteJid
        msg.userJid = msg.isGroup ? msg.key.participant : msg.key.remoteJid // Atau msg.jid
        // Nmae Dari Profile Pengirim
        msg.userName = msg.pushName
        // Jika Pesan Dari Bot
        msg.fromMe = msg.key.fromMe
        // Type Dari Sebuah Pesan
        msg.type = Object.keys(msg.message)[0]
        // Pesan Text & Jika Pesan extendedTextMessage Kita Ambil Textnya & Jika Pesan Conversation Kita Ambil Conversation
        msg.text = msg.type === "extendedTextMessage" 
        ? msg.message.extendedTextMessage.text 
        : msg.type === "conversation" 
        ? msg.message.conversation 
        : msg.type === "imageMessage" 
        ? msg.message.imageMessage.caption 
        : "";
        if (!msg.fromMe || msg.text !== 'p') return
        const sendMessage = await sock.sendMessage(msg.jid, { text: 'https://github.com/zeyndvp'}, { quoted: msg })
        console.log(msg)
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
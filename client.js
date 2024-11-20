const { makeWASocket, DisconnectReason, useMultiFileAuthState, Browsers } = require('@whiskeysockets/baileys')
const pino = require('pino')
const path = require('path')
const fs = require('fs')
const env = require('./config.json')
const plugins = {};

function loadPlugins() {
    const pluginDir = path.join(__dirname, "plugins");
    fs.readdirSync(pluginDir).forEach(file => {
        if (file.endsWith(".js")) {
            const pluginName = path.basename(file, ".js");
            plugins[pluginName] = require(path.join(pluginDir, file));
            console.log(`Plugin ${pluginName} telah dimuat.`);
        }
    });
}

loadPlugins();
plugins[out.type](m, nazu)
async function connectToWhatsapp() {
    let checkStatusPiring;
    if (env.pairing.status == true) {
        checkStatusPiring = false
    } else {
        checkStatusPiring = true
    }
    const { state, saveCreds } = await useMultiFileAuthState('nazuna');
    global.zuna  = makeWASocket({
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
    if (env.pairing.status && !nazu.authState.creds.registered) {
        // let phoneNumber = "";
        // if (!phoneNumber) {
        //     phoneNumber = await new Promise((resolve) => require('readline').createInterface({ 
        //         input: process.stdin,
        //         output: process.stdout
        //     }).question('Input your phone number: ', resolve))
        // }
        console.log("Get code...")
        setTimeout(async () => {
            const code = await nazu.requestPairingCode(env.pairing.number)
            console.log(code)
        }, 5000);
    }
    nazu.ev.on("connection.update", (update) => {
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
    nazu.ev.on("creds.update", saveCreds);

    // Event Messages
    nazu.ev.on("messages.upsert", async ({ messages }) => {
        global.m = messages[0];
        if (!m.message) return;
        // Message Jid
        m.chat = m.key.remoteJid;
        // Jika Sebuah Status Kita Tambahkan Auto Read Status
        if (m.chat === "status@broadcast") return nazu.readMessages([m.key]);
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
        const sendMessage = await nazu.sendMessage(m.chat, { text: 'https://github.com/zeyndvp'}, { quoted: m })
        console.log(m)
    })

    nazu.ev.on("group-participants.update", (group) => {
        // if (group || group.action == "add") {
        //     nazu.sendMessage(group.id, { text: "Selamat datang di indomaret @" + group.participants[0]})
        // }
        console.log(group)
    })
    
    nazu.ev.on("call", (call) => {
        if (call[0].status === "offer") {
            nazu.rejectCall(call[0].id, call[0].from)
            console.log(call)
        }
    })
}

module.exports = connectToWhatsapp();
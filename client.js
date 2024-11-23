const { makeWASocket, DisconnectReason, useMultiFileAuthState, Browsers } = require('@whiskeysockets/baileys')
const pino = require('pino')
const path = require('path')
const fs = require('fs')
const env = require('./config.json')
// const Loader = new(require('./lib/system/loader'))()
let features = {};

const loadFeatures = (dir = 'plugins') => {
    const pluginsPath = path.resolve(__dirname, dir);
    fs.readdirSync(pluginsPath).forEach((file) => {
        const fullPath = path.join(pluginsPath, file);
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
            loadFeatures(path.join(dir, file));
        } else if (file.endsWith('.js')) {
            const plugin = require(fullPath);
            if (plugin.zuna) {
                const { name, exec } = plugin.zuna;
                if (!name || !exec) {
                    console.warn(`Feature in ${file} is missing "name" or "execute".`);
                    return
                }

                if (Array.isArray(name)) {
                    for (const keyword of name) {
                        features[keyword] = { exec, name };
                    }
                } else {
                    features[name] = { exec, name };
                }
                console.log(`Plugin "${file}" dari "${dir}" berhasil dimuat.`);
            }
        }
    });
};

loadFeatures()
async function connectToWhatsapp() {
    let checkStatusPiring;
    if (env.pairing.status == true) {
        checkStatusPiring = false
    } else {
        checkStatusPiring = true
    }
    const { state, saveCreds } = await useMultiFileAuthState('nazuna');
    const zuna  = makeWASocket({
        logger: pino({
            level: "fatal"
        }),
        printQRInTerminal: checkStatusPiring,
        auth: state,
        defaultQueryTimeoutMs: undefined,
        keepAliveIntervalMs: 30000,
        browser: Browsers.macOS("Edge"),
        shouldSyncHistoryMessage: () => false,
        markOnlineOnConnect: true,
        syncFullHistory: false,
        generateHighQualityLinkPreview: true
    })
    if (env.pairing.status && !zuna.authState.creds.registered) {
        // let phoneNumber = "";
        // if (!phoneNumber) {
        //     phoneNumber = await new Promise((resolve) => require('readline').createInterface({ 
        //         input: process.stdin,
        //         output: process.stdout
        //     }).question('Input your phone number: ', resolve))
        // }
        console.log("Get code...")
        setTimeout(async () => {
            const code = await zuna.requestPairingCode(env.pairing.number)
            console.log(code)
        }, 5000);
    }
    zuna.ev.on("connection.update", (update) => {
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
    zuna.ev.on("creds.update", saveCreds);

    // Event Messages
    zuna.ev.on("messages.upsert", async ({ messages }) => {
        const m = messages[0];
        if (!m.message) return;
        // Message Jid
        m.chat = m.key.remoteJid;
        // Jika Sebuah Status Kita Tambahkan Auto Read Status
        if (m.chat === "status@broadcast") return zuna.readMessages([m.key]);
        // Message From Group
        m.isGroup = m.chat.endsWith("@g.us");
        // User Jid || Jika Dari Group Kita Ambil Dari Participant Namun Jika Bukan Dari Group, Kita Ambil Dari remoteJid
        m.userJid = m.isGroup ? m.key.participant : m.key.remoteJid // Atau m.chat
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
        if (features[m.text]) {
            // console.log(features)
            try {
                const name = features[m.text].name
                console.log(name)
                await features[m.text].exec(m, zuna, name);
            } catch (err) {
                console.error('Error executing feature:', err);
            }
        }

        // for (const keyword in features) {
        //     const feature = features[keyword];
    
        //     if (Array.isArray(feature.name) && feature.name.includes(m.text.split(' ')[0])) {
        //         try {
        //             await feature.exec(m, zuna, feature.name);
        //             break;
        //         } catch (err) {
        //             console.error(`Error executing feature "${keyword}":`, err);
        //         }
        //     }
        // }

        console.log(m)
    })

    zuna.ev.on("group-participants.update", (group) => {
        // if (group || group.action == "add") {
        //     zuna.sendMessage(group.id, { text: "Selamat datang di indomaret @" + group.participants[0]})
        // }
        console.log(group)
    })
    
    zuna.ev.on("call", (call) => {
        if (call[0].status === "offer") {
            zuna.rejectCall(call[0].id, call[0].from)
            console.log(call)
        }
    })
}

module.exports = connectToWhatsapp();
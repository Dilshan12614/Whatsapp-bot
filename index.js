const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const config = require("./config");

// ==========================================
// OWNER SETTINGS
// ==========================================

const OWNER_NUMBER = "94740534738";
const OWNER_NAME = "Dilshan";

// ==========================================
// START BOT
// ==========================================

async function startBot() {
  const { state, saveCreds } =
    await useMultiFileAuthState("./sessions");

  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: "silent" }),
    browser: [config.BOT_NAME, "Chrome", "1.0.0"],
    markOnlineOnConnect: false
  });

  // Save authentication credentials
  sock.ev.on("creds.update", saveCreds);

  // ==========================================
  // CONNECTION
  // ==========================================

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "connecting") {
      console.log("⏳ Connecting to WhatsApp...");
    }

    if (connection === "open") {
      console.log("=================================");
      console.log(`✅ ${config.BOT_NAME} CONNECTED`);
      console.log(`👑 Owner: ${OWNER_NAME}`);
      console.log(`📱 Number: ${OWNER_NUMBER}`);
      console.log("=================================");
    }

    if (connection === "close") {
      const statusCode =
        lastDisconnect?.error?.output?.statusCode;

      const shouldReconnect =
        statusCode !== DisconnectReason.loggedOut;

      console.log("❌ Connection closed");

      if (shouldReconnect) {
        console.log("🔄 Reconnecting...");
        startBot();
      } else {
        console.log("🚫 WhatsApp logged out.");
      }
    }
  });

  // ==========================================
  // MESSAGE HANDLER
  // ==========================================

  sock.ev.on("messages.upsert", async ({ messages }) => {
    try {
      const msg = messages[0];

      if (!msg.message) return;
      if (msg.key.fromMe) return;

      const jid = msg.key.remoteJid;

      if (jid === "status@broadcast") return;

      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        "";

      if (!text) return;

      // Auto read
      if (config.AUTO_READ) {
        await sock.readMessages([msg.key]);
      }

      // Only commands
      if (!text.startsWith(config.PREFIX)) return;

      const body = text
        .slice(config.PREFIX.length)
        .trim();

      if (!body) return;

      const args = body.split(/\s+/);
      const command = args.shift().toLowerCase();

      // ==========================================
      // GET SENDER NUMBER
      // ==========================================

      const sender =
        msg.key.participant ||
        msg.key.remoteJid;

      const senderNumber =
        sender.split("@")[0].split(":")[0];

      // ==========================================
      // OWNER CHECK
      // ==========================================

      const isOwner =
        senderNumber === OWNER_NUMBER;

      console.log(
        `📩 Command: ${command} | From: ${senderNumber} | Owner: ${isOwner}`
      );

      // ==========================================
      // PING
      // ==========================================

      if (command === "ping") {
        await sock.sendMessage(jid, {
          text:
            "╭━━〔 DILA-MD 〕━━╮\n" +
            "┃ 🏓 Pong!\n" +
            "┃ ⚡ Bot is working!\n" +
            "╰━━━━━━━━━━━━━━╯"
        });
      }

      // ==========================================
      // ALIVE
      // ==========================================

      else if (command === "alive") {
        await sock.sendMessage(jid, {
          text:
            `╭━━〔 ${config.BOT_NAME} 〕━━╮\n` +
            `┃ 🤖 Status : Online\n` +
            `┃ 👑 Owner  : ${OWNER_NAME}\n` +
            `┃ 📱 Number : ${OWNER_NUMBER}\n` +
            `┃ ⚡ Mode   : ${config.MODE}\n` +
            `╰━━━━━━━━━━━━━━━━╯`
        });
      }

      // ==========================================
      // MENU
      // ==========================================

      else if (command === "menu") {
        await sock.sendMessage(jid, {
          text:
            `╭━━〔 ${config.BOT_NAME} 〕━━╮\n\n` +
            `┃ 📌 GENERAL\n` +
            `┃ ${config.PREFIX}ping\n` +
            `┃ ${config.PREFIX}alive\n` +
            `┃ ${config.PREFIX}menu\n\n` +
            `┃ 👑 OWNER\n` +
            `┃ ${config.PREFIX}owner\n\n` +
            `╰━━━━━━━━━━━━━━━━╯`
        });
      }

      // ==========================================
      // OWNER INFO
      // ==========================================

      else if (command === "owner") {
        await sock.sendMessage(jid, {
          text:
            `╭━━〔 👑 OWNER 〕━━╮\n\n` +
            `┃ 👤 Name : ${OWNER_NAME}\n` +
            `┃ 📱 Number : +${OWNER_NUMBER}\n\n` +
            `╰━━━━━━━━━━━━━━━━╯`
        });
      }

      // ==========================================
      // OWNER TEST COMMAND
      // ==========================================

      else if (command === "ownertest") {

        if (!isOwner) {
          return await sock.sendMessage(jid, {
            text:
              "❌ This command is only available to the bot owner."
          });
        }

        await sock.sendMessage(jid, {
          text:
            "👑 Owner verified successfully!\n\n" +
            "✅ You are the bot owner."
        });
      }

    } catch (error) {
      console.error("❌ Message Error:", error);
    }
  });
}

// ==========================================
// RUN BOT
// ==========================================

startBot();

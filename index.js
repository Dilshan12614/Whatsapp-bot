const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const config = require("./config");

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

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "connecting") {
      console.log("⏳ Connecting to WhatsApp...");
    }

    if (connection === "open") {
      console.log(`✅ ${config.BOT_NAME} Connected Successfully!`);
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
        console.log("🚫 Logged out.");
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    try {
      const msg = messages[0];

      if (!msg.message || msg.key.fromMe) return;

      const jid = msg.key.remoteJid;

      if (jid === "status@broadcast") return;

      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        "";

      if (config.AUTO_READ) {
        await sock.readMessages([msg.key]);
      }

      if (!text.startsWith(config.PREFIX)) return;

      const args = text
        .slice(config.PREFIX.length)
        .trim()
        .split(/\s+/);

      const command = args.shift().toLowerCase();

      console.log(`📩 Command: ${command}`);

      // .ping
      if (command === "ping") {
        await sock.sendMessage(jid, {
          text: "🏓 Pong!\n\n⚡ Bot is running successfully."
        });
      }

      // .alive
      else if (command === "alive") {
        await sock.sendMessage(jid, {
          text:
            `╭━━━〔 ${config.BOT_NAME} 〕━━━╮\n` +
            `┃ 🤖 Status: Online\n` +
            `┃ 👤 Owner: ${config.OWNER_NAME}\n` +
            `┃ ⚡ Mode: ${config.MODE}\n` +
            `╰━━━━━━━━━━━━━━━━━━╯`
        });
      }

      // .menu
      else if (command === "menu") {
        await sock.sendMessage(jid, {
          text:
            `╭━━━〔 ${config.BOT_NAME} MENU 〕━━━╮\n\n` +
            `┃ ${config.PREFIX}ping\n` +
            `┃ ${config.PREFIX}alive\n` +
            `┃ ${config.PREFIX}menu\n\n` +
            `╰━━━━━━━━━━━━━━━━━━━━╯\n\n` +
            `🤖 Powered by ${config.BOT_NAME}`
        });
      }

    } catch (error) {
      console.error("Message Error:", error);
    }
  });
}

startBot();

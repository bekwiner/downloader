import "dotenv/config";
import { Telegraf } from "telegraf";
import { request } from "undici";

const bot = new Telegraf(process.env.BOT_TOKEN);

async function fetchApi(url) {
  try {
    const { statusCode, body } = await request(url);
    if (statusCode !== 200) return null;
    return await body.json();
  } catch (err) {
    console.error("API error:", err);
    return null;
  }
}

bot.start((ctx) =>
  ctx.reply("👋 Salom! Menga YouTube, Instagram yoki TikTok link yuboring, men esa yuklab beraman 🚀")
);

bot.on("text", async (ctx) => {
  const link = ctx.message.text.trim();

  try {
    // === YouTube ===
    if (link.includes("youtube.com") || link.includes("youtu.be")) {
      let videoId;

      // Shorts yoki oddiy videoni ajratish
      if (link.includes("shorts/")) {
        videoId = link.split("shorts/")[1].split("?")[0];
      } else if (link.includes("v=")) {
        videoId = link.split("v=")[1].split("&")[0];
      } else {
        videoId = link.split("/").pop().split("?")[0];
      }

      const apiUrl = `https://fastsaverapi.com/download?video_id=${videoId}&format=720p&bot_username=@${process.env.BOT_USERNAME}&token=${process.env.FASTSAVER_TOKEN}`;
      const data = await fetchApi(apiUrl);

      console.log("YouTube API javobi:", data);

      if (!data || data.error || !data.file_id) {   
        return ctx.reply("❌ YouTube yuklab bo‘lmadi.");
      }

      return ctx.replyWithVideo(data.file_id, {
        caption: "✅ YouTube video yuklab olindi!",
      });
    }

    // === Boshqa platformalar (Instagram, TikTok, Facebook va h.k.) ===
    else {
      const apiUrl = `https://fastsaverapi.com/get-info?url=${encodeURIComponent(link)}&token=${process.env.FASTSAVER_TOKEN}`;
      const data = await fetchApi(apiUrl);

      console.log("Get-Info API javobi:", data);

      if (!data || data.error || !data.download_url) {
        return ctx.reply("❌ Yuklab bo‘lmadi.");
      }

      // Media turi
      if (data.type === "video") {
        return ctx.replyWithVideo(data.download_url, {
          caption: "✅ Video yuklab olindi!",
        });
      } else if (data.type === "image") {
        return ctx.replyWithPhoto(data.download_url, {
          caption: "✅ Rasm yuklab olindi!",
        });
      } else {
        return ctx.reply("❌ Ushbu fayl turi qo‘llab-quvvatlanmaydi.");
      }
    }
  } catch (err) {
    console.error("Bot error:", err);
    return ctx.reply("❌ Xatolik yuz berdi, qaytadan urinib ko‘ring.");
  }
});

bot.launch();
console.log("✅ Bot ishga tushdi!");

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

      if (link.includes("shorts/")) {
        videoId = link.split("shorts/")[1].split("?")[0];
      } else if (link.includes("v=")) {
        videoId = link.split("v=")[1].split("&")[0];
      } else {
        videoId = link.split("/").pop().split("?")[0];
      }

      const apiUrl = `https://fastsaverapi.com/download?video_id=${videoId}&format=720p&bot_username=@${process.env.BOT_USERNAME}&token=${process.env.FASTSAVER_TOKEN}`;
      const data = await fetchApi(apiUrl);

      if (!data || data.error) {
        return ctx.reply("❌ YouTube yuklab bo‘lmadi.");
      }

      // file_id bo‘lsa
      if (data.file_id) {
        return ctx.replyWithVideo(data.file_id, {
          caption: "✅ YouTube video yuklab olindi!",
        });
      }

      // medias massiv bo‘lsa
      if (data.medias && Array.isArray(data.medias)) {
        for (const media of data.medias) {
          if (media.type === "video" && media.url) {
            await ctx.replyWithVideo(media.url, {
              caption: "✅ YouTube video yuklab olindi!",
            });
          }
        }
        return;
      }

      return ctx.reply("❌ YouTube videosi topilmadi.");
    }

    // === Instagram, TikTok, Facebook va boshqalar ===
    else {
      const apiUrl = `https://fastsaverapi.com/get-info?url=${encodeURIComponent(
        link
      )}&token=${process.env.FASTSAVER_TOKEN}`;
      const data = await fetchApi(apiUrl);

      if (!data || data.error) {
        return ctx.reply("❌ Yuklab bo‘lmadi.");
      }

      // === Agar medias massiv bo‘lsa (album, stories va h.k.) ===
      if (data.medias && Array.isArray(data.medias)) {
        for (const media of data.medias) {
          if (media.type === "video" && media.download_url) {
            await ctx.replyWithVideo(media.download_url, {
              caption: "✅ Video yuklab olindi!",
              thumbnail: media.thumb || undefined,
            });
          } else if (media.type === "image" && media.download_url) {
            await ctx.replyWithPhoto(media.download_url, {
              caption: "✅ Rasm yuklab olindi!",
            });
          }
        }
        return;
      }

      // === Oddiy rasm yoki video ===
      if (data.download_url) {
        if (data.type === "video") {
          return ctx.replyWithVideo(data.download_url, {
            caption: "✅ Video yuklab olindi!",
          });
        } else if (data.type === "image") {
          return ctx.replyWithPhoto(data.download_url, {
            caption: "✅ Rasm yuklab olindi!",
          });
        }
      }

      return ctx.reply("❌ Ushbu fayl turi qo‘llab-quvvatlanmaydi.");
    }
  } catch (err) {
    console.error("Bot error:", err);
    return ctx.reply("❌ Xatolik yuz berdi, qaytadan urinib ko‘ring.");
  }
});

bot.launch();
console.log("✅ Bot ishga tushdi!");

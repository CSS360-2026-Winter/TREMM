import { EmbedBuilder, userMention } from "discord.js";

const CHANNEL_NAME = process.env.CHANNEL_NAME;
const MEME_URL = process.env.MEME_URL || "";

const event = {
  name: "guildMemberAdd",
  async execute(member) {
    const channel = member.guild.channels.cache.find(
      (channel) => channel.name === CHANNEL_NAME
    );

    // Safety check: channel not found
    if (!channel) return;

    // ✅ Use the meme version (this fixes the TODO + removes unused warning)
    const welcomeMessage = await getWelcomeMessageWithMeme(member.id);
    await channel.send(welcomeMessage);
  },
};


const getWelcomeMessageWithMeme = async (userId) => {
  const meme = await getWelcomeMeme();

  return {
    content: `Welcome ${userMention(userId)},
Here's a meme for you to enjoy!`,
    embeds: [meme],
  };
};

const getWelcomeMeme = async () => {
  return new EmbedBuilder().setImage(MEME_URL);
};

export default event;

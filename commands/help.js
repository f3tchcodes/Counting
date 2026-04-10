const { EmbedBuilder, PermissionFlags } = require("@fluxerjs/core");

module.exports = {
    name: "help",

    async execute(message) {

        const client = message.client;

        // get prefix
        const [rows] = await client.db.query(
            "SELECT prefix FROM community_settings WHERE community_id = ?",
            [message.guild.id]
        );

        const prefix = rows[0]?.prefix || ".";

        const embed = new EmbedBuilder()
            .setTitle("📖 Counting Bot Help")
            .setColor(0x4641D9)
            .setDescription(
`🚀 **Getting Started**
Before anything, you MUST setup the bot:

\`${prefix}setup #channel\`
→ Sets the counting channel and initializes everything.

------------------------------------

⚙️ **Admin Commands**
\`${prefix}settings list\`
View current settings

\`${prefix}settings channel <#channel>\`
Set counting channel

\`${prefix}settings arithmetic <enable/disable>\`
Allow math expressions as valid counts

\`${prefix}settings lb <enable/disable>\`
Toggle community leaderboard visibility

\`${prefix}settings numbersonly <enable/disable>\`
Only allow pure numbers (no text)

\`${prefix}settings hardcore <enable/disable>\`
Wrong number resets count (must be 0 to enable)

\`${prefix}settings reset\`
Reset the count (requires confirmation)

\`${prefix}settings prefix <prefix>\`
Change bot prefix (1 character only)

------------------------------------

👤 **User Commands**
\`${prefix}lb com\`
Community leaderboard

\`${prefix}lb com hardcore\`
Hardcore community leaderboard

\`${prefix}lb com user\`
Top users in this community

\`${prefix}lb user\`
Global user leaderboard

\`${prefix}comstats\`
View stats for this community

\`${prefix}globalstats\`
View global bot statistics

------------------------------------

ℹ️ **Other**
\`${prefix}help\`
Show this help menu

------------------------------------

🧠 **Notes**
• Counting must be done in the configured channel  
• The same user cannot count again (partner required)
• Hardcore mode resets on mistakes (Optional)
• Leaderboards require enabling in settings  

Good luck climbing the leaderboard 🚀`
            ).addFields({
                name: "🔗 Links",
                value: "[Invite me](https://web.fluxer.app/oauth2/authorize?client_id=1484113258352640042&scope=bot&permissions=76864)  •  [Support server](https://fluxer.gg/s3MEFBfB)"
            }).setFooter({ text: "Counting Bot • Made by f3tch#0001" })
            .setTimestamp();

        await message.send({ embeds: [embed] });
    }
};
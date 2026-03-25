const { EmbedBuilder, PermissionFlags } = require("@fluxerjs/core");
const { hasPermission } = require("../utils/permissions.js");

module.exports = {
    name: "setup",

    async execute(message, args) {
        const client = message.client;

        if (!(await hasPermission(message, PermissionFlags.ManageGuild, "ManageGuild"))) return;

        const [rows] = await client.db.query(
            "SELECT * FROM community_settings WHERE community_id = ?",
            [message.guild.id]
        );

        const settings = rows[0];

        if (!args || !args[0]) {
            return message.send(`Please provide a channel!
Usage: \`${settings?.prefix ?? process.env.PREFIX}setup <ID/#channel>\``);
        }

        const channelId = args[0].replace(/[<#>]/g, '');

        const targetChannel = message.guild.channels.get(channelId);

        if (!targetChannel || !targetChannel.isTextBased()) {
            return message.send("Please provide a valid text channel in this community!");
        }

        try {
            const [rows0] = await client.db.query(
                "SELECT * FROM community_settings WHERE community_id = ?",
                [message.guild.id]
            );

            if(rows0.length > 0){
                console.log(channelId)
                console.log(rows0[0].channel_id)

                if(rows0[0].channel_id){
                    return message.send(`Counting channel already exists: <#${String(rows0[0].channel_id)}>
Use \`${rows0[0]?.prefix ?? "."}settings channel <ID/#channel>\` to change the counting channel.`);
                }
            }

            await client.db.query(
                `INSERT INTO community_settings (community_id, channel_id, arithmetic_toggle, leaderboard_toggle) 
                VALUES (?, ?, false, false)
                ON DUPLICATE KEY UPDATE 
                channel_id = VALUES(channel_id), 
                arithmetic_toggle = false, 
                leaderboard_toggle = false`,
                [message.guild.id, targetChannel.id]
            );

            const [rows] = await client.db.query(
                "SELECT * FROM community_settings WHERE community_id = ?",
                [message.guild.id]
            );

            const settings = rows[0];

            await targetChannel.send(`📢 <#${settings.channel_id}> has been set as the counting channel for this community!`);

            const settingsEmbed = new EmbedBuilder()
                .setTitle("⚙️ Default Settings")
                .setColor(0x4641D9)
                .setDescription(`Settings for **${message.guild.name}**`)
                .addFields(
                { name: "📍 Counting Channel", value: `<#${settings.channel_id}>`, inline: false },
                { name: "🧮 Arithmetic Mode", value: settings.arithmetic_toggle ? "✅ Enabled" : "❌ Disabled", inline: false },
                { name: "🏆 Leaderboard", value: settings.leaderboard_toggle ? "✅ Enabled" : "❌ Disabled", inline: false },
                { name: "🔢 Numbers Only Mode", value: settings.numbers_only_toggle ? "✅ Enabled" : "❌ Disabled", inline: false },
                { name: "🔥 Hardcore Mode", value: settings.hardcore_toggle ? "✅ Enabled" : "❌ Disabled", inline: false },
                { name: "🤖 Prefix", value: `${settings?.prefix ?? process.env.PREFIX}`, inline: false }
                )
                .setFooter({ text: `Community ID: ${settings.community_id}` })
                .setTimestamp();

            await message.send({ embeds: [settingsEmbed] });

        } catch (err) {
            console.error("Setup Error:", err);
            await message.send("Error occured, please try again later.");
        }
    }
};
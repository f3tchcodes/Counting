const { EmbedBuilder, PermissionFlags } = require("@fluxerjs/core");

module.exports = {
    name: "comstats",

    async execute(message) {
        const client = message.client;
        const communityId = message.guild.id;

        try {

            // community data
            const [[community]] = await client.db.query(
                "SELECT * FROM community_count WHERE community_id = ?",
                [communityId]
            );

            // community settings
            const [[settings]] = await client.db.query(
                "SELECT * FROM community_settings WHERE community_id = ?",
                [communityId]
            );

            if (!settings){
                return message.send(`Use \`${settings?.prefix ?? process.env.PREFIX}setup\` to setup the bot before you run other commands!`)
            }

            // top user in this community
            const [[topUser]] = await client.db.query(
                `SELECT user_id, total_user_count
                 FROM user_count
                 WHERE community_id = ?
                 ORDER BY total_user_count DESC
                 LIMIT 1`,
                [communityId]
            );

            // total contributions in server
            const [[total]] = await client.db.query(
                `SELECT SUM(total_user_count) AS total
                 FROM user_count
                 WHERE community_id = ?`,
                [communityId]
            );

            // server rank globally
            const [[rankRow]] = await client.db.query(
                `SELECT COUNT(*) + 1 AS server_rank
                 FROM community_count
                 WHERE current_count > ?`,
                [community.current_count]
            );

            const embed = new EmbedBuilder()
                .setTitle(`📊 ${message.guild.name} Stats`)
                .setColor(0x4641D9)
                .addFields(
                    {
                        name: "Current Count",
                        value: `${community.current_count}`,
                        inline: true
                    },
                    {
                        name: "Last Counter",
                        value: community.last_count_userid
                            ? `<@${community.last_count_userid}>`
                            : "Unavailable",
                        inline: true
                    },
                    {
                        name: "Top User",
                        value: topUser
                            ? `<@${topUser.user_id}> (${topUser.total_user_count})`
                            : "None",
                        inline: true
                    },
                    {
                        name: "Server Rank",
                        value: `#${rankRow.server_rank}`,
                        inline: true
                    },
                    {
                        name: "Total Contributions",
                        value: `${total.total || 0}`,
                        inline: true
                    },
                    // Settings
                    {
                        name: "Counting Channel",
                        value: settings.channel_id
                            ? `<#${settings.channel_id}>`
                            : "Not set",
                        inline: true
                    },
                    {
                        name: "Arithmetic Mode",
                        value: settings.arithmetic_toggle ? "✅ Enabled" : "❌ Disabled",
                        inline: true
                    },
                    {
                        name: "Leaderboard",
                        value: settings.leaderboard_toggle ? "✅ Enabled" : "❌ Disabled",
                        inline: true
                    },
                    {
                        name: "Numbers Only Mode",
                        value: settings.numbers_only_toggle ? "✅ Enabled" : "❌ Disabled",
                        inline: true
                    },
                    {
                        name: "Hardcore Mode",
                        value: settings.hardcore_toggle ? "🔥 Enabled" : "❌ Disabled",
                        inline: true
                    },
                    {
                        name: "Prefix",
                        value: settings?.prefix ?? process.env.PREFIX,
                        inline: true
                    }
                )
                .setFooter({ text: `Community ID: ${communityId}` })
                .setTimestamp();

            await message.send({ embeds: [embed] });
        } catch(err) {
            console.error("comstats Error:", err);
            await message.send("Error occurred, please try again later.");
        }
    }
};
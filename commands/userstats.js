module.exports = {
    name: "userstats",

    async execute(message, args) {
        try {
            const client = message.client;

            // target user
            let target = null;

            // mention target user, get it's id and fetch the user
            if (args[0]) {
                const match = args[0].match(/^<@!?(\d+)>$/);
                if (match) {
                    try {
                        target = await client.users.fetch(match[1]);
                    } catch {}
                }
            }

            // use user's id for stats
            if (!target && args[0]) {
                try {
                    target = await client.users.fetch(args[0]);
                } catch {}
            }

            // if target doesn't exist target is the author
            if (!target) target = message.author;

            const userId = target.id;
            const guildId = message.guild.id;

            // total counts globally
            const [[globalTotalRow]] = await client.db.query(`
                SELECT SUM(total_user_count) AS total
                FROM user_count
                WHERE user_id = ?
            `, [userId]);

            // total community counts
            const [[communityTotalRow]] = await client.db.query(`
                SELECT total_user_count
                FROM user_count
                WHERE user_id = ? AND community_id = ?
            `, [userId, guildId]);

            // global rank
            const [[globalRankRow]] = await client.db.query(`
                SELECT COUNT(*) + 1 AS user_rank
                FROM (
                    SELECT user_id, SUM(total_user_count) AS total
                    FROM user_count
                    GROUP BY user_id
                ) t
                WHERE t.total > (
                    SELECT SUM(total_user_count)
                    FROM user_count
                    WHERE user_id = ?
                )
            `, [userId]);

            // community rank
            const [[communityRankRow]] = await client.db.query(`
                SELECT COUNT(*) + 1 AS user_rank
                FROM user_count
                WHERE community_id = ?
                AND total_user_count > (
                    SELECT total_user_count
                    FROM user_count
                    WHERE user_id = ? AND community_id = ?
                )
            `, [guildId, userId, guildId]);

            // null or not applicable
            const globalTotal = globalTotalRow?.total || 0;
            const communityTotal = communityTotalRow?.total_user_count || 0;

            const globalRank = globalTotal > 0 ? globalRankRow?.user_rank : "N/A";
            const communityRank = communityTotal > 0 ? communityRankRow?.user_rank : "N/A";

            // embed reply
            const embed = {
                color: 0x4641D9,
                title: `📊 ${target.username}'s Counting Stats`,
                fields: [
                    {
                        name: "🌍 Global",
                        value: `• Total Counts: **${globalTotal}**\n• Rank: **#${globalRank}**`,
                        inline: false
                    },
                    {
                        name: `🏠 ${message.guild.name}`,
                        value: `• Counts: **${communityTotal}**\n• Rank: **#${communityRank}**`,
                        inline: false
                    }
                ],
                footer: {
                    text: `Requested by ${message.author.username}`
                },
                timestamp: new Date()
            };

            await message.send({ embeds: [embed] });

        } catch (err) {
            console.error("UserStats Error:", err);

            try {
                await message.send("Failed to fetch stats. Try again later.");
            } catch (err) {
                console.log(err);
            }
        }
    }
};
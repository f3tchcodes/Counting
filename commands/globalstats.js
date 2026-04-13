const { EmbedBuilder, PermissionFlags } = require("@fluxerjs/core");

module.exports = {
    name: "globalstats",

    async execute(message) {

        const client = message.client;

        const [rows] = await client.db.query(
            "SELECT * FROM community_settings WHERE community_id = ?",
            [message.guild.id]
        );

        const settings = rows[0];

        if (!settings){
            return message.send(`Use \`${settings?.prefix ?? process.env.PREFIX}setup\` to setup the bot before you run other commands!`)
        }

        // total global count
        const [[global]] = await client.db.query(
            "SELECT total_count FROM global_stats WHERE id = 1"
        );

        // total servers
        const [[servers]] = await client.db.query(
            "SELECT COUNT(*) AS total FROM community_count"
        );

        // top server normal
        const [[topServerNormal]] = await client.db.query(
            `SELECT cc.community_id, cc.current_count
            FROM community_count cc
            JOIN community_settings cs ON cc.community_id = cs.community_id
            WHERE cs.hardcore_toggle = 0
            ORDER BY cc.current_count DESC
            LIMIT 1`
        );

        // top server hardcore
        const [[topServerHardcore]] = await client.db.query(
            `SELECT cc.community_id, cc.current_count
            FROM community_count cc
            JOIN community_settings cs ON cc.community_id = cs.community_id
            WHERE cs.hardcore_toggle = 1
            ORDER BY cc.current_count DESC
            LIMIT 1`
        );

        // top user globally
        const [[topUser]] = await client.db.query(
            `SELECT user_id, SUM(total_user_count) AS total
             FROM user_count
             GROUP BY user_id
             ORDER BY total DESC
             LIMIT 1`
        );

        const guild = client.guilds.cache.get(topServerNormal?.community_id);
        const guildHardcore = client.guilds.cache.get(topServerHardcore?.community_id);

        const topUserFetch = await client.users.fetch(topUser.user_id);

        const embed = new EmbedBuilder()
            .setTitle("🌍 Global Stats")
            .setColor(0x4641D9)
            .addFields(
                {
                    name: "Total Counts Ever",
                    value: `${global.total_count}`,
                    inline: true
                },
                {
                    name: "Total Communities",
                    value: `${servers.total}`,
                    inline: true
                },
                {
                    name: "Top Community Normal",
                    value: topServerNormal
                        ? `${guild ? guild.name : "Unknown"} (${topServerNormal.current_count})`
                        : "None",
                    inline: false
                },
                {
                    name: "Top Community Hardcore",
                    value: topServerHardcore
                        ? `${guildHardcore ? guildHardcore.name : "Unknown"} (${topServerHardcore.current_count})`
                        : "None",
                    inline: false
                },
                {
                    name: "Top User",
                    value: topUser
                        ? `${topUserFetch.username} (${topUser.total})`
                        : "None",
                    inline: false
                }
            )
            .setFooter({ text: `Requested by ${message.author.username}` })
            .setTimestamp( new Date() );

        await message.send({ embeds: [embed] });
    }
};
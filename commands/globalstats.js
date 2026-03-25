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

        // top server
        const [[topServer]] = await client.db.query(
            `SELECT community_id, current_count
             FROM community_count
             ORDER BY current_count DESC
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

        const guild = client.guilds.cache.get(topServer?.community_id);

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
                    name: "Top Community",
                    value: topServer
                        ? `${guild ? guild.name : "Unknown"} (${topServer.current_count})`
                        : "None",
                    inline: false
                },
                {
                    name: "Top User",
                    value: topUser
                        ? `<@${topUser.user_id}> (${topUser.total})`
                        : "None",
                    inline: false
                }
            );

        await message.send({ embeds: [embed] });
    }
};
const { EmbedBuilder } = require("@fluxerjs/core");

module.exports = {
    name: "lb",

    async execute(message, args) {
        const client = message.client;
        const communityId = message.guild.id;

        const [rowsSettings] = await client.db.query(
            "SELECT * FROM community_settings WHERE community_id = ?",
            [communityId]
        );

        const settings = rowsSettings[0];
        
        if (!settings){
            return message.send(`Use \`${settings?.prefix ?? process.env.PREFIX}setup\`...`)
        }

        const medals = ["🥇", "🥈", "🥉"];

        if (args[0] === "com" && args[1] !== "user" && args[1] !== "hardcore" && args[1] !== "total") {
            const [rowsCom] = await client.db.query(
                `SELECT cc.community_name, cc.current_count
                FROM community_count cc
                JOIN community_settings cs ON cc.community_id = cs.community_id
                WHERE cs.leaderboard_toggle = TRUE AND cs.hardcore_toggle = FALSE
                ORDER BY cc.current_count DESC
                LIMIT 10`
            );

            if (!rowsCom.length) return message.send("No community leaderboard data yet.");

            let description = rowsCom.map((row, i) => {
                const prefix = medals[i] || `**${i + 1}.**`;
                return `${prefix} ${row.community_name} - \`${row.current_count}\``;
            }).join("\n");

            const embed = new EmbedBuilder()
                .setTitle("🌍 Global Community Leaderboard")
                .setDescription(description)
                .setColor(0x4641D9)
                .setFooter({ text: `Requested by ${message.author.username}` })
                .setTimestamp( new Date() );

            return message.send({ embeds: [embed] });
        }

        if (args[0] === "com" && args[1] === "hardcore") {
            const [rowsHardcore] = await client.db.query(
                `SELECT cc.community_name, cc.current_count
                FROM community_count cc
                JOIN community_settings cs ON cc.community_id = cs.community_id
                WHERE cs.hardcore_toggle = TRUE AND cs.leaderboard_toggle = TRUE
                ORDER BY cc.current_count DESC
                LIMIT 10`
            );

            if (!rowsHardcore.length) return message.send("No hardcore leaderboard data yet.");

            let description = rowsHardcore.map((row, i) => {
                const prefix = medals[i] || `**${i + 1}.**`;
                return `${prefix} ${row.community_name} - \`${row.current_count}\``;
            }).join("\n");

            const embed = new EmbedBuilder()
                .setTitle("🔥 Hardcore Leaderboard")
                .setDescription(description)
                .setColor(0xFF4500)
                .setFooter({ text: `Requested by ${message.author.username}` })
                .setTimestamp( new Date() );

            return message.send({ embeds: [embed] });
        }

        if (args[0] === "com" && args[1] === "total") {

            const [rows] = await client.db.query(`
                SELECT 
                    uc.community_id,
                    cc.community_name,
                    SUM(uc.total_user_count) AS total
                FROM user_count uc
                JOIN community_count cc 
                    ON uc.community_id = cc.community_id
                JOIN community_settings cs
                    ON uc.community_id = cs.community_id
                WHERE cs.leaderboard_toggle = TRUE
                GROUP BY uc.community_id, cc.community_name
                ORDER BY total DESC
                LIMIT 10;
            `);

            if (!rows.length) {
                return message.send("No community leaderboard data yet.");
            }

            const description = rows.map((row, i) => {
                const prefix = medals[i] || `**${i + 1}.**`;
                return `${prefix} ${row.community_name} - \`${row.total}\``;
            }).join("\n");

            const embed = new EmbedBuilder()
                .setTitle("🌍 Total Community Contributions Leaderboard")
                .setDescription(description)
                .setColor(0x4641D9)
                .setFooter({ text: `Requested by ${message.author.username}` })
                .setTimestamp(new Date());

            return message.send({ embeds: [embed] });
        }

        if (args[0] === "com" && args[1] === "user") {
            const [rowsUser] = await client.db.query(
                `SELECT user_id, username, total_user_count
                FROM user_count 
                WHERE community_id = ?
                ORDER BY total_user_count DESC
                LIMIT 10`,
                [communityId]
            );

            if (!rowsUser.length) return message.send("No leaderboard data yet for this server.");

            let description = rowsUser.map((user, i) => {
                const prefix = medals[i] || `**${i + 1}.**`;
                return `${prefix} ${user.username} - \`${user.total_user_count}\``;
            }).join("\n");

            const embed = new EmbedBuilder()
                .setTitle(`🏆 ${message.guild.name} Leaderboard`)
                .setDescription(description)
                .setColor(0x4641D9)
                .setFooter({ text: `Requested by ${message.author.username}` })
                .setTimestamp( new Date() );

            return message.send({ embeds: [embed] });
        }

        if (args[0] === "user") {
            const [rowsGlobal] = await client.db.query(
                `SELECT user_id, username, SUM(total_user_count) AS total
                FROM user_count
                GROUP BY user_id, username
                ORDER BY total DESC
                LIMIT 10`
            );

            if (!rowsGlobal.length) return message.send("No global user data yet.");

            let description = rowsGlobal.map((user, i) => {
                const prefix = medals[i] || `**${i + 1}.**`;
                return `${prefix} ${user.username} - \`${user.total}\``;
            }).join("\n");

            const embed = new EmbedBuilder()
                .setTitle("🌍 Global User Leaderboard")
                .setDescription(description)
                .setColor(0x4641D9)
                .setFooter({ text: `Requested by ${message.author.username}` })
                .setTimestamp( new Date() );

            return message.send({ embeds: [embed] });
        }
    }
};
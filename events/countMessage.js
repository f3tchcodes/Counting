require("dotenv").config();
const { Events, PermissionFlags } = require("@fluxerjs/core");
const math = require('mathjs');

module.exports = {
    name: Events.MessageCreate,
    async execute(client, message) {
        try {
            if (!message.guild) return;
            if (message.author.bot) return;
            
            const [rowsSettings] = await client.db.query(
                "SELECT * FROM community_settings WHERE community_id = ?",
                [message.guild.id]
            );

            const [rowsCount] = await client.db.query(
                "SELECT * FROM community_count WHERE community_id = ?",
                [message.guild.id]
            );

            const settings = rowsSettings[0];
            const count = rowsCount[0];

            if (!settings) return;
            if (message.channel.id !== settings.channel_id) return;

            if (settings.arithmetic_toggle) {
                try {
                    number = math.evaluate(message.content);
                } catch (err) {
                    number = Number(message.content);
                }
            } else {
                number = Number(message.content);
            }

            if (!number && !settings.numbers_only_toggle) return;
            if (number && number != 0) {

                if (message.author.id === count.last_count_userid) {
                    if (settings.hardcore_toggle) {
                        await client.db.query(`
                                UPDATE community_count
                                SET current_count = 0,
                                last_count_userid = NULL
                                WHERE community_id = ?;`,
                                [message.guild.id]);

                        try {
                            return await message.reply("❌ **COUNT RESET!** The same user cannot count twice in a row... Start from 1.");
                        } catch (err) {
                            await message.send("❌ **COUNT RESET!** The same user cannot count twice in a row... Start from 1.")
                            return console.log(err)
                        }
                    }
                    
                    client.deletedByBot.add(message.id);
                    return await message.delete();
                }

                current_count = count.current_count;
                next_count = current_count + 1;
                last_count_userid = count.last_count_userid;

                const user = await client.users.fetch(message.author.id);
                console.log(current_count)
                console.log(number)
                if (number === next_count) {
                    await client.db.query(`
                        UPDATE community_count
                        SET current_count = ?,
                        last_count_userid = ?
                        WHERE community_id = ?;`,
                        [next_count, message.author.id, message.guild.id]);

                    await client.db.query(`
                        INSERT INTO user_count (community_id, user_id, username, total_user_count)
                        VALUES (?, ?, ?, 1)
                        ON DUPLICATE KEY UPDATE
                        total_user_count = total_user_count + 1,
                        username = ?;
                        `,
                        [message.guild.id, message.author.id, user.username, user.username]);

                    await client.db.query("UPDATE global_stats SET total_count = total_count + 1 WHERE id = 1;")

                    return message.react("✅");
                } else {
                    if (settings.hardcore_toggle){
                        await client.db.query(`
                                UPDATE community_count
                                SET current_count = 0,
                                last_count_userid = NULL
                                WHERE community_id = ?;`,
                                [message.guild.id]);

                        return await message.reply("❌ **WRONG NUMBER!** Resetting the count... Start from 1.");
                    }

                    client.deletedByBot.add(message.id);
                    return await message.delete();
                    
                }
            } else {
                if (settings.numbers_only_toggle){
                    if (settings.hardcore_toggle){
                        await client.db.query(`
                                UPDATE community_count
                                SET current_count = 0,
                                last_count_userid = NULL
                                WHERE community_id = ?;`,
                                [message.guild.id]);

                        return await message.reply("❌ **WRONG NUMBER!** Resetting the count... Start from 1.");
                    }

                    client.deletedByBot.add(message.id);
                    return await message.delete();
                }
            }
        } catch (err) {
            console.log(err);
            await message.send("Error occured, check bot's permissions (common issue is embed permission) or ask help in the support community!").catch(console.log);
        }
    }
};
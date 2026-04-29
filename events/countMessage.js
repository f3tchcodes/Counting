require("dotenv").config();
const { Events, PermissionFlags } = require("@fluxerjs/core");
const math = require('mathjs');

module.exports = {
    name: Events.MessageCreate,
    async execute(client, message) {
        try {
            if (!message.guild) return;
            if (message.author.bot || message.author.system) return;
            
            const [rowsSettings] = await client.db.query(
                "SELECT * FROM community_settings WHERE community_id = ?",
                [message.guild.id]
            );

            const settings = rowsSettings[0];

            if (!settings) return;
            if (message.channel.id !== settings.channel_id) return;

            if (settings.arithmetic_toggle) {
                try {
                    number = await math.evaluate(message.content);
                } catch (err) {
                    number = Number(message.content);
                }
            } else {
                number = Number(message.content);
            }

            if (!number && !settings.numbers_only_toggle) return;
            if (number && number != 0) {

                const [rowsCount] = await client.db.query(
                    "SELECT * FROM community_count WHERE community_id = ?",
                    [message.guild.id]
                );
                
                const count = rowsCount[0];

                if (message.author.id === count.last_count_userid) {
                    if (settings.hardcore_toggle) {
                        await client.db.query(`
                                UPDATE community_count
                                SET current_count = 0,
                                last_count_userid = NULL
                                WHERE community_id = ?;`,
                                [message.guild.id]);

                        return await message.reply("❌ **COUNT RESET!** The same user cannot count twice in a row... Start from 1.");
                    }
                    
                    client.deletedByBot.add(message.id);
                    return await message.delete();
                }

                current_count = count.current_count;
                next_count = current_count + 1;
                last_count_userid = count.last_count_userid;

                const user = await client.users.fetch(message.author.id);
                if (number === next_count) {
                    const conn = await client.db.getConnection();

                    try {
                        await conn.beginTransaction();

                        const [updateResult] = await conn.query(`
                            UPDATE community_count
                            SET current_count = current_count + 1,
                                last_count_userid = ?
                            WHERE community_id = ?
                            AND current_count = ?;
                        `, [message.author.id, message.guild.id, current_count]);

                        if (updateResult.affectedRows === 0) {
                            await conn.rollback();

                            try {
                                client.deletedByBot.add(message.id);
                                await message.delete();
                                return console.log(`ALREADY COUNTED: Guild ID: ${message.guild.id},
Author ID: ${message.author.id},
Author Username: ${message.author.username},
Current Count: ${current_count};`);
                            } catch (err) {
                                return console.log(err);
                            }
                        }

                        await conn.query(`
                            INSERT INTO user_count (community_id, user_id, username, total_user_count)
                            VALUES (?, ?, ?, 1)
                            ON DUPLICATE KEY UPDATE
                                total_user_count = total_user_count + 1,
                                username = ?;
                        `, [message.guild.id, message.author.id, user.username, user.username]);

                        await conn.query(`
                            UPDATE global_stats 
                            SET total_count = total_count + 1 
                            WHERE id = 1;
                        `);

                        await conn.commit();

                        client.messageCache.set(message.id, message.content);
                        return message.react("✅");

                    } catch (err) {
                        await conn.rollback();

                        console.error("Transaction failed:", err);

                        return await message.reply("❌ Something went wrong while updating the count. Please try again.");

                    } finally {
                        conn.release();
                    }
                } else {
                    if (settings.hardcore_toggle){
                        await client.db.query(`
                                UPDATE community_count
                                SET current_count = 0,
                                last_count_userid = NULL
                                WHERE community_id = ?;`,
                                [message.guild.id]);

                        return await message.reply("❌ **WRONG NUMBER!** Resetting the count... Start from 1.");
                        console.log(`WRONG NUMBER: Guild ID: ${message.guild.id},
Author ID: ${message.author.id},
Author Username: ${message.author.username},
Current Count: ${current_count}`);
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
                        console.log(`WRONG NUMBER: Guild ID: ${message.guild.id},
Author ID: ${message.author.id},
Author Username: ${message.author.username},
Current Count: ${current_count}`);
                    }

                    client.deletedByBot.add(message.id);
                    return await message.delete();
                }
            }
        } catch (err) {
            console.log(err);
            return await message.send("Error occured, check bot's permissions (common issue is embed permission) or ask help in the support community!").catch(console.log);
        }
    }
};
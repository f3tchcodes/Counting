require("dotenv").config();
const { Events } = require("@fluxerjs/core");
const math = require("mathjs");
const { buildLogs, resetCount } = require("../utils/common")
const { setTimeout } = require('node:timers/promises');

module.exports = {
    name: Events.MessageCreate,
    async execute(client, message) {
        // put basic checks
        if (!client.db || 
            !message.guild || 
            message.author.bot || 
            message.author.system) 
        return;

        
        // fetching settings and count
        const [rowsSettings] = await client.db.query("SELECT * FROM community_settings WHERE community_id = ?", [message.guild.id]);
        const [rowsCount] = await client.db.query("SELECT * FROM community_count WHERE community_id = ?", [message.guild.id]);

        const settings = rowsSettings[0];
        const countData = rowsCount[0];

        if (message.channel.id !== settings.channel_id) return;

        // create a lock
        const lockKey = `lock:count:${message.guild.id}`;
        const lockValue = Date.now() + 10000; // after 5 seconds, redis automatically deletes the key and let's the code go through
        
        // set the lock, if it exists (meaning a query is still out there and hasn't updated the count)
        // then try again 10 times every 300ms for the previous query to go through completely
        let acquired = false;
        for (let i = 0; i < 30; i++) {
            acquired = await client.redis.set(lockKey, lockValue, "PX", 10000, "NX");
            if (acquired) break;
            buildLogs(client, message, "SETTLING DOUBLE COUNT").catch(err => console.log(err));
            await setTimeout(300);
        }

        // if key is not acquired after 9 seconds of retrying
        if (!acquired) return await buildLogs(client, message, "KEY NOT ACQUIRED AFTER 9 SECONDS");

        try {
            if (!settings || message.channel.id !== settings.channel_id) return;

            // evaluate number
            let number;
            const content = message.content.trim();

            if (settings.arithmetic_toggle) {
                try {
                    number = math.evaluate(content);
                } catch {
                    number = Number(content);
                }
            } else {
                number = Number(content);
            }

            // validating number
            const current_count = countData.current_count;
            const next_count = current_count + 1;

            // if numbers-only is on and it's not a number, delete it, if hardcore, reset count.
            if (isNaN(number) || number === null) {
                if (settings.numbers_only_toggle) {
                    if (settings.hardcore_toggle) {
                        await resetCount(client, message.guild.id);
                        await message.reply(`❌ **WRONG NUMBER!** ${message.author.username} messed up at **${current_count}**. Resetting to 1.`);
                        return await buildLogs(client, message, "WRONG NUMBER WITH NUMBERS-ONLY", current_count, content, next_count);
                    }
                    client.deletedByBot.add(message.id);
                    return await message.delete().catch(() => {});
                }
                return;
            }

            // check if the user counted twice
            if (message.author.id === countData.last_count_userid) {
                if (settings.hardcore_toggle) {
                    await resetCount(client, message.guild.id);
                    return await message.reply("❌ **COUNT RESET!** You cannot count twice in a row. Start from 1.");
                }
                client.deletedByBot.add(message.id);
                return await message.delete().catch(() => {});
            }

            // check if the number is wrong
            if (number !== next_count) {
                if (settings.hardcore_toggle) {
                    await resetCount(client, message.guild.id);
                    await message.reply(`❌ **WRONG NUMBER!** ${message.author.username} messed up at **${current_count}**. Resetting to 1.`);
                    return await buildLogs(client, message, "WRONG NUMBER", current_count, content, next_count);
                } else {
                    // tell the user why it's deleted
                    const warn = await message.reply(`❌ Wrong number! Next count is **${next_count}**.`);
                    setTimeout(() => warn.delete().catch(() => {}), 3000); // delete after letting the user know
                    client.deletedByBot.add(message.id);
                    return await message.delete().catch(() => {});
                }
            }

            // proceed with valid count
            const conn = await client.db.getConnection();
            try {
                await conn.beginTransaction();

                const [updateResult] = await conn.query(
                    `UPDATE community_count 
                    SET current_count = current_count + 1, 
                    last_count_userid = ? 
                    WHERE community_id = ? AND current_count = ?`,
                    [message.author.id, message.guild.id, current_count]
                );

                if (updateResult.affectedRows === 0) {
                    await buildLogs(client, message, "UPDATERESULT.AFFECTEDROWS FAILED", current_count, content, next_count);
                    throw new Error("Error occured while updating result");
                }

                await conn.query(
                    `INSERT INTO user_count 
                    (community_id, user_id, username, total_user_count) 
                    VALUES (?, ?, ?, 1) 
                    ON DUPLICATE KEY UPDATE 
                    total_user_count = total_user_count + 1, 
                    username = ?`,
                    [message.guild.id, message.author.id, message.author.username, message.author.username]
                );

                await conn.commit();
                await message.react("✅").catch(() => {});
            } catch (err) {
                await conn.rollback();
                throw err;
            } finally {
                conn.release();
            }

        } catch (err) {
            console.error(err);
        } finally {
            // release redis lock
            await client.redis.del(lockKey);
        }
    }
};
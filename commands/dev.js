/*

    .dev update
    .dev execute

*/

const { promisify } = require("util");
const { exec } = require("child_process");

const { shutdown } = require("../utils/shutdown")

const execAsync = promisify(exec);

module.exports = {
    name: "dev",

    async execute(message, args) {
        const client = message.client;
        if (message.author.id !== process.env.OWNERID) return;

        if (args[0] === "update") {
            await message.send("SHUTTING DOWN THE BOT...");

            try {
                console.log("Shutting down, waiting for all messages to be sent!");

                await message.send("```UPDATING...```")
                let result = await execAsync("git pull && npm install", { timeout: 60000 })
                            .catch(error => ({ stdout: null, stderr: error }));
                let resultFormated = [result.stdout, result.stderr].join("\n");
                if (resultFormated.length > 2000) return message.send("Output too long");
                console.log(`RESULT: ${resultFormated}`);
                await message.send(`\`\`\`${resultFormated}\`\`\``);

                await client.db.end();
                console.log("Database closed. Goodbye!");
                await message.send("Shutdown successful!");
                process.exit(); // if you're not using pm2, this command would simply stop the bot rather than restarting
            } catch (err) {
                await message.reply("Error occured while running the command");
                return console.log(err);
            }
        }

        if (args[0] === "execute") {
            try {
                const command = args.slice(1).join(" ");
                try {
                    let result = await execAsync(command, { timeout: 60000 })
                                .catch(error => ({ stdout: null, stderr: error }));
                    let resultFormated = [result.stdout, result.stderr].join("\n");
                    if (resultFormated.length > 2000) return message.send("Output too long");
                    console.log(`COMMAND RAN: ${command}\nRESULT: ${resultFormated}`);
                    await message.send(`\`\`\`${resultFormated}\`\`\``)
                } catch (err) {
                    await message.send(`The command \`${command}\` does not exist.`);
                    return console.log(err)
                }
            } catch (err) {
                await message.reply("Error occured. The command could not run!")
                console.log(err)
            }
        }

        if (args[0] === "shutdown") {
            try {
                const [rows] = await client.db.query(
                    "SELECT * FROM community_settings"
                );

                if (rows && rows.length > 0) {
                    for (const row of rows) {
                        try {
                            await client.channels.send(row.channel_id, "⚠️ **The bot will be offline for maintenance/updates. Halt counting!**")
                            const guild = client.guilds.cache.get(row.community_id);
                            console.log(`Sent message for: ${guild ? guild.name : row.community_id}`);
                        } catch (err) {
                            console.log(err)
                        }
                    }
                }
            } catch (err) {
                console.log(err);
            }

            // updating flag to 1 so the next time we start the bot, it sends start up message
            await client.db.query(`
                INSERT INTO bot_settings (id, startup_msg_flag)
                VALUES (1, 1)
                ON DUPLICATE KEY UPDATE
                startup_msg_flag = 1;
            `);

            try {
                return shutdown(message);
            } catch (err) {
                console.log(err);
                process.exit();
            }
        }

    }
}
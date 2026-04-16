/*

    .dev shutdown
    .dev update
    .dev execute <command>
    .dev announce <message>

*/

const { promisify } = require("util");
const { exec } = require("child_process");

const { shutdown } = require("../utils/shutdown");
const { announce } = require("../utils/announce");

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
                await message.reply("Error occured while running the command.");
                return console.log(err);
            }
        }

        if (args[0] === "execute") {
            try {
                const command = args.slice(1).join(" ");
                let result = await execAsync(command, { timeout: 60000 })
                            .catch(error => ({ stdout: null, stderr: error }));
                let resultFormated = [result.stdout, result.stderr].join("\n");
                if (resultFormated.length > 2000) return message.send("Output too long");
                console.log(`COMMAND RAN: ${command}\nRESULT: ${resultFormated}`);
                await message.send(`\`\`\`${resultFormated}\`\`\``)
            } catch (err) {
                await message.reply("Error occured while running the command.")
                console.log(err)
            }
        }

        if (args[0] === "shutdown") {
            console.log("Sending shutdown messages to all communities...");
            await message.send("Sending shutdown messages to all communities...");

            await announce(client, "⚠️ **The bot will be offline for maintenance/updates. Halt counting!**");

            // updating flag to 1 so the next time we start the bot, it sends start up message
            await client.db.query(`
                INSERT INTO bot_settings (id, startup_msg_flag)
                VALUES (1, 1)
                ON DUPLICATE KEY UPDATE
                startup_msg_flag = 1;
            `);

            try {
                console.log("Shutting down the bot...");
                await message.send("Shutting down the bot...");
                return shutdown();
            } catch (err) {
                message.send("Error occured while shutting down! Shutdown failed.");
                console.log(err);
                process.exit(1);
            }
        }

        if (args[0] === "announce") {
            const message = args.slice(1).join(" ");
            await announce(client, message);
        }
    }
}
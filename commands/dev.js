/*

    .dev update
    .dev execute

*/


const { execSync } = require('child_process');

module.exports = {
    name: "dev",

    async execute(message, args) {
        const client = message.client;

        if (message.author.id === process.env.OWNERID) {
            if (args[0] === "update") {
                await message.send("SHUTTING DOWN THE BOT...");

                try {
                    console.log("Shutting down, waiting for all messages to be sent!");

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

                    await message.send("```UPDATING...```")
                    const gitPullResult = execSync("git pull");
                    await message.send(`\`\`\`${gitPullResult}\`\`\``);

                    await client.db.end();
                    console.log("Database closed. Goodbye!");
                    process.exit(); // if you're not using pm2, this command would simply stop the bot rather than restarting
                } catch (err) {
                    await message.reply("Error occured while running the command");
                    return console.log(err);
                }
            }

            if (args[0] === "execute") {
                try {
                    const command = args.slice(1).join(" ");
                    let result;
                    try {
                        result = execSync(command);
                    } catch (err) {
                        await message.send(`The command \`${command}\` either does not exist or could not be run.`);
                        return console.log(err)
                    }
                    if (result.length > 0) {
                        console.log(result);
                        await message.send(`\`\`\`${result}\`\`\``)
                    } else {
                        await message.send("Done!")
                    }
                } catch (err) {
                    await message.reply("Error occured. The command could not run!")
                    console.log(err)
                }
            }
        } else {
            try {
                await message.reply("Oh man, you are not the owner of this bot :(")
            } catch (err) {
                await message.send("Oh man, you are not the owner of this bot :(")
                console.log(err)
            }
        }
    }
}
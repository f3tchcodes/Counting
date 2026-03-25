require("dotenv").config()

const { Client } = require("@fluxerjs/core")
const loadEvents = require("./handlers/loadEvents")
const loadCommands = require("./handlers/loadCommands")

const client = new Client({ 
    intents: 0,
    presence: {
        status: "online",
        custom_status: {
            text: "Counting in communities!"
        }
    }
})

client.commands = new Map()

loadCommands(client)
loadEvents(client)


// BOT SHUTDOWN MESSAGE
const shutdown = async () => {
    console.log("Shutting down, waiting for all messages to be sent!");
    
    try {
        const [rows] = await client.db.query("SELECT channel_id FROM community_settings");

        for (const row of rows) {
            try {
                const channel = client.channels.cache.get(row.channel_id);
                if (channel) {
                    await channel.send("⚠️ **The bot will be offline for maintenance/updates. Halt counting!**");
                }
            } catch (err) {
                console.log(err)
            }
        }
    } catch (err) {
        console.error("Error during shutdown broadcast:", err);
    }

    await client.db.end();
    console.log("Database closed. Goodbye!");
    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);


client.login(process.env.FLUXER_BOT_TOKEN)
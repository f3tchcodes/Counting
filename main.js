require("dotenv").config()

const { Client } = require("@fluxerjs/core")
const loadEvents = require("./handlers/loadEvents")
const loadCommands = require("./handlers/loadCommands")

BOT_PRESENCE = {
    status: "online",
    custom_status: {
        text: "Counting in communities!"
    }
}

const client = new Client({ 
    intents: 0,
    waitForGuilds: true,
    presence: BOT_PRESENCE
})

client.commands = new Map()

loadCommands(client)
loadEvents(client)

client.login(process.env.FLUXER_BOT_TOKEN)
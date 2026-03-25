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

client.login(process.env.FLUXER_BOT_TOKEN)
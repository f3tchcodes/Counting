require("dotenv").config()

const { Client } = require("@fluxerjs/core")
const loadEvents = require("./handlers/loadEvents")
const loadCommands = require("./handlers/loadCommands")
const { GatewayOpcodes } = require('@erinjs/core');

BOT_PRESENCE = {
    status: "online",
    custom_status: {
        text: "Counting in communities!"
    }
}

const client = new Client({ 
    intents: 0,
    presence: BOT_PRESENCE
})

client.commands = new Map()

function pushPresenceUpdate(BOT_PRESENCE) {
  try {
    client.ws?.send(0, {
      op: GatewayOpcodes.PresenceUpdate,
      d: BOT_PRESENCE,
    });
  } catch {}
}

module.exports = { pushPresenceUpdate }

loadCommands(client)
loadEvents(client)

client.login(process.env.FLUXER_BOT_TOKEN)
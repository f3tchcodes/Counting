require("dotenv").config();

const { Client } = require("@fluxerjs/core");
const Redis = require("ioredis");
const loadEvents = require("./handlers/loadEvents");
const loadCommands = require("./handlers/loadCommands");

BOT_PRESENCE = {
    status: "online",
    custom_status: {
        text: "Counting in communities!",
    },
};

const client = new Client({
    intents: 0,
    waitForGuilds: true,
    presence: BOT_PRESENCE,
});

client.redis = new Redis({
    host: process.env.REDIS_IP || "127.0.0.1",
    port: process.env.REDIS_PORT || 6379,
});

client.commands = new Map();

loadCommands(client);
loadEvents(client);

client.login(process.env.FLUXER_BOT_TOKEN);

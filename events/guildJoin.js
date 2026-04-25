const { Events } = require("@fluxerjs/core");
const { pushPresenceUpdate } = require("../utils/pushPresenceUpdate");
const { guildSize } = require("../utils/guildSize");

module.exports = {
    name: Events.GuildCreate,
    async execute(client, guild) {
        try {
            if (!client.db) return;

            /* DB UPDATE */            
            const [rows] = await client.db.query(
                "SELECT community_id FROM community_count WHERE community_id = ?",
                [guild.id]
            );

            if (rows.length > 0) return;

            const ownerId = guild.ownerId;
            const owner = await client.users.fetch(ownerId);

            console.log(`New guild joined: ${guild.name} (${guild.id}) | Owner: ${owner.username} (${ownerId})`);
            
            await client.db.query(
                "INSERT INTO community_count (community_id, community_name, owner_id, owner_username) VALUES (?, ?, ?, ?)",
                [guild.id, guild.name, ownerId, owner.username]
            );

            /* PRESENCE UPDATE */
            BOT_PRESENCE = {
                status: "online",
                custom_status: {
                    text: `Counting in ${await guildSize(client)} communities!`
                }
            }

            pushPresenceUpdate(client, BOT_PRESENCE)

        } catch (error) {
            console.error("Database error during guild join:", error);
        }
    }
};
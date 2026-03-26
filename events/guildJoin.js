const { Events } = require("@fluxerjs/core");

module.exports = {
    name: Events.GuildCreate,

    async execute(client, guild) {
        try {
            if (!client.db) return;
            
            const [rows] = await client.db.query(
                "SELECT community_id FROM community_count WHERE community_id = ?",
                [guild.id]
            );

            if (rows.length > 0) return;

            const ownerId = await guild.ownerId;
            const owner = await client.users.fetch(ownerId);

            console.log(`New guild joined: ${guild.name} (${guild.id}) | Owner: ${owner.username} (${ownerId})`);
            
            await client.db.query(
                "INSERT INTO community_count (community_id, community_name, owner_id, owner_username) VALUES (?, ?, ?, ?)",
                [guild.id, guild.name, ownerId, owner.username]
            );

        } catch (error) {
            console.error("Database error during guild join:", error);
        }
    }
};
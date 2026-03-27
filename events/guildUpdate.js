const { Events } = require("@fluxerjs/core");

module.exports = {
    name: Events.GuildUpdate,
    async execute(client, oldGuild, newGuild) {
        try {
            if (!client.db) return;

            const nameChanged = oldGuild.name !== newGuild.name;
            const ownerChanged = oldGuild.ownerId !== newGuild.ownerId;

            if (!nameChanged && !ownerChanged) return;

            let ownerUsername = null;

            if (ownerChanged) {
                try {
                    const owner = await client.users.fetch(newGuild.ownerId);
                    ownerUsername = owner.username;
                } catch (fetchError) {
                    console.error(`Failed to fetch new owner for ${newGuild.id}`);
                }
            }

            await client.db.query(
                `UPDATE community_count 
                SET community_name = ?, 
                    owner_id = ?, 
                    owner_username = IFNULL(?, owner_username)
                WHERE community_id = ?`,
                [
                    newGuild.name, 
                    newGuild.ownerId, 
                    ownerUsername, 
                    newGuild.id
                ]
            );

            console.log(`Updated info for ${newGuild.name} (${newGuild.id})`);
            if (ownerChanged) console.log(`New Owner: ${ownerUsername}`);
        } catch (err) {
            console.error("Database error during GuildUpdate:", err);
        }
    }
};
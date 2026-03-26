const { Events } = require("@fluxerjs/core");

module.exports = {
    name: Events.GuildUpdate,

    async execute(client, oldGuild, newGuild) {
        try {

        
            if (!client.db) return;

            const nameChanged = oldGuild.name !== newGuild.name;
            const ownerChanged = oldGuild.ownerId !== newGuild.ownerId;

            if (!nameChanged && !ownerChanged) return;

            try {
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

            } catch (error) {
                console.error("Database error during GuildUpdate:", error);
            }
        } catch (err) {
            try {
                console.log(err);
                return await message.send("Error occured, check bot's permissions (common issue is embed permission) or ask help in the support community!");
            } catch (err) {
                return console.log(err);
            }
        }
    }
};
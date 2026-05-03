require("dotenv").config();
const { Events, PermissionFlags } = require("@fluxerjs/core");
const math = require('mathjs');

module.exports = {
    name: Events.MessageDelete,
    async execute(client, message) {

        try {            
            if (!client.db) return
            const [rowsSettings] = await client.db.query(
                "SELECT * FROM community_settings WHERE community_id = ?",
                [message.channel.guildId]
            );

            const [rowsCount] = await client.db.query(
                "SELECT * FROM community_count WHERE community_id = ?",
                [message.channel.guildId]
            );

            const settings = rowsSettings[0];
            const count = rowsCount[0];

            if (!settings) return;

            if (message.channel.id === settings.channel_id) {
                let number;
                try {
                    number = await math.evaluate(message.content);
                } catch (err) {
                    number = Number(message.content);
                }
                if (number === Number(count.current_count) && !client.deletedByBot.has(message.id)) {
                    const channel = message.channel ?? await client.channels.fetch(message.channelId);
                    const user = await client.users.fetch(message.authorId);

                    if (!channel) return;
                    await channel.send(`⚠️ Count sent by the user **${user.username}** has been deleted! 
Restoring: **${message.content}**
Next count: **${count.current_count+1}**`);
                    return client.deletedByBot.has(message.id);
                }
            }
        } catch (err) {
            console.log(err);
            await message.send("Error occured, check bot's permissions (common issue is embed permission) or ask help in the support community!").catch(console.log);
        }
    }
}


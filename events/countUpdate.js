require("dotenv").config();
const { Events, PermissionFlags } = require("@fluxerjs/core");
const math = require('mathjs');

module.exports = {
    name: Events.MessageUpdate,
    async execute(client, oldMessage, newMessage) {

        try {            
            const [rowsSettings] = await client.db.query(
                "SELECT * FROM community_settings WHERE community_id = ?",
                [newMessage.channel.guildId]
            );

            const [rowsCount] = await client.db.query(
                "SELECT * FROM community_count WHERE community_id = ?",
                [newMessage.channel.guildId]
            );

            const settings = rowsSettings[0];
            const count = rowsCount[0];

            if (!settings) return;

            if (newMessage.channel.id === settings.channel_id) {

                const oldContent = client.messageCache.get(newMessage.id);
                
                let number;
                try {
                    number = await math.evaluate(oldContent);
                } catch (err) {
                    number = Number(oldContent);
                }
                if (number === Number(count.current_count)) {
                    const channel = newMessage.channel ?? await client.channels.fetch(newMessage.channelId);
                    const user = await client.users.fetch(newMessage.author.id);

                    if (!channel) return;
                    await channel.send(`⚠️ Count sent by the user **${user.username}** has been edited! 
Restoring: **${oldContent}**
Next count: **${count.current_count+1}**`);
                }
            }
        } catch (err) {
            console.log(err);
            await newMessage.send("Error occured, check bot's permissions (common issue is embed permission) or ask help in the support community!").catch(console.log);
        }
    }
}


require("dotenv").config();
const { Events } = require("@fluxerjs/core");

module.exports = {
  name: Events.MessageCreate,

  async execute(client, message) {

    if (!message.guild) return;

    const [rows] = await client.db.query(
        "SELECT * FROM community_settings WHERE community_id = ?",
        [message.guild.id]
    );

    const settings = rows[0];

    if (!message.content.startsWith(settings?.prefix ?? process.env.PREFIX)) return

    const args = message.content.slice(1).split(" ")
    const commandName = args.shift().toLowerCase()

    const command = client.commands.get(commandName)
    if (!command) return

    command.execute(message, args, client)
  }
}
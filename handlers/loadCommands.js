const fs = require("fs")
const path = require("path")

module.exports = (client) => {
  const commandsPath = path.join(__dirname, "../commands")
  const commandFiles = fs.readdirSync(commandsPath)

  for (const file of commandFiles) {
    const command = require(`../commands/${file}`)
    client.commands.set(command.name, command)
  }
}
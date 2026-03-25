module.exports = {
    name: "ping",

    async execute(message) {
        await message.send("Pong!")
    }
}
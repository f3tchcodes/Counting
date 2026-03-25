module.exports = {
    name: "ping",

    async execute(message) {
        try {
            await message.send("Pong!")
        } catch (err) {
            console.log(err)
        }
    }
}
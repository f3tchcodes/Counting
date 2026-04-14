const pm2 = require("pm2");

async function shutdown(message) {
    try {
        console.log("Shutting down the bot...");
        message.send("Shutting down the bot...")

        pm2.connect((err) => {
            if (err) {
                console.log(err)
                process.exit(1)
            }

            const pmId = process.env.PM2_ID;

            pm2.stop(pmId, (stopErr) => {
                if (stopErr) return console.log(stopErr);
                pm2.disconnect;
            });
        });
    } catch (err) {
        message.send("Error occured while shutting down!");
        console.log(err);
    }
}

module.exports = { shutdown };
const pm2 = require("pm2");

async function shutdown() {
    try {
        pm2.connect((err) => {
            if (err) {
                console.log(err)
                process.exit(1)
            }

            try {
                const pmId = process.env.pm_id;

                pm2.stop(pmId, (stopErr) => {
                    if (stopErr) return console.log(stopErr);
                    pm2.disconnect();
                });
            } catch (err) {
                console.log("no worries brother, i caught it!")
                console.log(err);
                process.exit(1)
            }
        });
    } catch (err) {
        console.log(err);
    }
}

module.exports = { shutdown };
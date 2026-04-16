// announce given message in all communities

async function announce(client, customMSG) {
    const [rows] = await client.db.query(
        "SELECT * FROM community_settings;"
    );

    if (rows && rows.length > 0) {
        for (const row of rows) {
            try {
                await client.channels.send(row.channel_id, customMSG)
                const guild = client.guilds.cache.get(row.community_id);
                console.log(`Sent message for: ${guild ? guild.name : row.community_id}`);
            } catch (err) {
                console.log(err)
            }
        }
    }
}

module.exports = { announce };
async function guildSize(client) {
    const [[guildSize]] = await client.db.query("SELECT COUNT(*) FROM community_count;")
    return guildSize["COUNT(*)"];
}

module.exports = { guildSize }
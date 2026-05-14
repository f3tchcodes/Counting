// LOGS BUILDER
async function buildLogs(
    client,
    message,
    type,
    current = null,
    number = null,
    next = null,
) {
    try {
        // basic information that is always present
        const guildName =
            message.guild.name ||
            (await client.guilds.fetch(message.guild.id)).name;
        const time = new Date().toLocaleString();
        const channelName = message.channel.name || "Unknown Channel";

        // building the log message
        let logString = `\n[${type.toUpperCase()}]\n`;
        logString += `---------------------------------------\n`;
        logString += `Guild:   ${guildName} (${message.guild.id})\n`;
        logString += `Channel: #${channelName} (${message.channel.id})\n`;
        logString += `User:    ${message.author.username} (${message.author.id})\n`;
        logString += `Time:    ${time}\n`;
        logString += `Content: "${message.content}"\n`;

        // if counting parameters are provided, we add those as well
        if (current !== null || number !== null || next !== null) {
            logString += `---------------------------------------\n`;
            logString += `Current Count: ${current ?? "N/A"}\n`;
            logString += `Input:  ${number ?? "N/A"}\n`;
            logString += `Next Number:    ${next ?? "N/A"}\n`;
        }

        logString += `---------------------------------------\n`;

        console.log(logString);
    } catch (err) {
        console.error("Error while logging: ", err);
    }
}

// GUILD SIZE
async function guildSize(client) {
    const [[guildSize]] = await client.db.query(
        "SELECT COUNT(*) FROM community_count;",
    );
    return guildSize["COUNT(*)"];
}

// COUNT RESETTER
async function resetCount(client, guildId) {
    await client.db.query(
        "UPDATE community_count SET current_count = 0, last_count_userid = NULL WHERE community_id = ?",
        [guildId],
    );
}

module.exports = { guildSize, buildLogs, resetCount };

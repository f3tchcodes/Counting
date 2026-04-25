async function hasPermission(message, permissionFlag, permissionName = "the required") {
    const guild = message.guild ?? await message.client.guilds.resolve(message.guildId);
    if (!guild) {
        await message.reply("❌ This command can only be used inside a server.");
        return false;
    }

    const member = guild.members.get(message.author.id) ?? await guild.fetchMember(message.author.id);
    const perms = member?.permissions ?? null;

    if (!perms || !perms.has(permissionFlag)) {
        await message.reply(`❌ You need \`${permissionName}\` permissions to use this command.`);
        return false;
    }

    return true;
}

module.exports = { hasPermission };
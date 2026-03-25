// utils/permissions.js

async function hasPermission(message, permissionFlag, permissionName = "the required") {
    // 1. Resolve the guild (server)
    const guild = message.guild ?? await message.client.guilds.resolve(message.guildId);
    if (!guild) {
        await message.reply("❌ This command can only be used inside a server.");
        return false; // Returns false so the command knows to stop
    }

    // 2. Resolve the member who sent the message
    const member = guild.members.get(message.author.id) ?? await guild.fetchMember(message.author.id);
    const perms = member?.permissions ?? null;

    // 3. Check if they have the specific permission flag
    if (!perms || !perms.has(permissionFlag)) {
        await message.reply(`❌ You need \`${permissionName}\` permissions to use this command.`);
        return false; // Returns false so the command knows to stop
    }

    // 4. If everything passes, return true!
    return true;
}

module.exports = { hasPermission };
const { EmbedBuilder, PermissionFlags } = require("@fluxerjs/core");
const { hasPermission } = require("../utils/permissions.js");

module.exports = {
    name: "settings",

    async execute(message, args) {
        const client = message.client;

        if (!(await hasPermission(message, PermissionFlags.ManageGuild, "ManageGuild"))) return;

        try {

            const [rows] = await client.db.query(
                "SELECT * FROM community_settings WHERE community_id = ?",
                [message.guild.id]
            );

            const settings = rows[0];

            const [rowsCount] = await client.db.query(
                "SELECT * FROM community_count WHERE community_id = ?",
                [message.guild.id]
            );

            const count = rowsCount[0];

            if (!settings){
                return message.send(`Use \`${settings?.prefix ?? process.env.PREFIX}setup\` to setup the bot before you run other commands!`)
            }

            if (args[0] === "list") {
                const settingsEmbed = new EmbedBuilder()
                    .setTitle("⚙️ Settings")
                    .setColor(0x4641D9)
                    .setDescription(`Settings for **${message.guild.name}**`)
                    .addFields(
                    { name: "📍 Counting Channel", value: `<#${settings.channel_id}>`, inline: false },
                    { name: "🧮 Arithmetic Mode", value: settings.arithmetic_toggle ? "✅ Enabled" : "❌ Disabled", inline: false },
                    { name: "🏆 Leaderboard", value: settings.leaderboard_toggle ? "✅ Enabled" : "❌ Disabled", inline: false },
                    { name: "🔢 Numbers Only Mode", value: settings.numbers_only_toggle ? "✅ Enabled" : "❌ Disabled", inline: false },
                    { name: "🔥 Hardcore Mode", value: settings.hardcore_toggle ? "✅ Enabled" : "❌ Disabled", inline: false },
                    { name: "🤖 Prefix", value: `${settings?.prefix ?? process.env.PREFIX}`, inline: false }
                    )
                    .setFooter({ text: `Community ID: ${settings.community_id}` })
                    .setTimestamp();

                await message.send({ embeds: [settingsEmbed] });

            } else if (args[0] === "channel" && args[1]) {

                const channelId = args[1].replace(/[<#>]/g, '');
                const targetChannel = message.guild.channels.get(channelId);

                if (!targetChannel || !targetChannel.isTextBased()) {
                    return message.send("Please provide a valid text channel in this community!");
                }

                if (args[1] === settings.channel_id){
                    return message.send(`Counting channel is already: <#${args[1]}>`);
                }

                await client.db.query(
                    `UPDATE community_settings
                    SET channel_id = ?
                    WHERE community_id = ?;`,
                    [targetChannel.id, message.guild.id]
                );

                const [rows0] = await client.db.query(
                    "SELECT * FROM community_settings WHERE community_id = ?",
                    [message.guild.id]
                );

                const newSettings = rows0[0];

                await targetChannel.send(`📢 <#${newSettings.channel_id}> has been set as the counting channel for this community!`);
                await message.send(`Counting channel set to: <#${newSettings.channel_id}>`);

            } else if (args[0] === "arithmetic" && (args[1] === "enable" || args[1] === "disable")){

                toggle = false;

                if (args[1] === "enable"){
                    toggle = true;
                }

                await client.db.query(
                    `UPDATE community_settings
                    SET arithmetic_toggle = ?
                    WHERE community_id = ?`,
                    [toggle, message.guild.id]
                );

                if (toggle){
                    message.send(`Arithmetic Mode has been enabled! Any fundamental mathematical operation will be considered as a count!`)
                } else {
                    message.send(`Arithmetic Mode has been disabled!`)
                }

            } else if (args[0] === "lb" && (args[1] === "enable" || args[1] === "disable")){

                toggle = false;

                if (args[1] === "enable"){
                    toggle = true;
                }

                await client.db.query(
                    `UPDATE community_settings
                    SET leaderboard_toggle = ?
                    WHERE community_id = ?`,
                    [toggle, message.guild.id]
                );

                if (toggle){
                    message.send(`Leaderboard has been enabled!
Use \`${settings?.prefix ?? process.env.PREFIX}lb com\` or \`${settings?.prefix ?? process.env.PREFIX}lb com hardcore\` to view your community's rank.`)
                } else {
                    message.send(`Leaderboard has been disabled! Your community will no longer be shown on the leaderboard!`)
                }

            } else if (args[0] === "numbersonly" && (args[1] === "enable" || args[1] === "disable")) {

                toggle = false;

                if (args[1] === "enable"){
                    toggle = true;
                }

                await client.db.query(
                    `UPDATE community_settings
                    SET numbers_only_toggle = ?
                    WHERE community_id = ?`,
                    [toggle, message.guild.id]
                );

                if (toggle){
                    message.send(`Numbers Only Mode has been enabled! Any text that is not a number will be deleted (or reset the count if **hardcore mode** is **enabled**).`)
                } else {
                    message.send(`Numbers Only Mode has been disabled! Texting while counting is allowed.`)
                }

            } else if (args[0] === "hardcore" && (args[1] === "enable" || args[1] === "disable")) {

                if (count.current_count === 0){
                    toggle = false;

                    if (args[1] === "enable"){
                        toggle = true;
                    }

                    await client.db.query(
                        `UPDATE community_settings
                        SET hardcore_toggle = ?
                        WHERE community_id = ?`,
                        [toggle, message.guild.id]
                    );

                    if (toggle){
                        message.send(`Hardcore Mode has been enabled! Any number that is incorrect will reset the counting.`)
                    } else {
                        message.send(`Hardcore Mode only has been disabled!`)
                    }
                } else {
                    message.send(`Count must be set to \`0\` in order to initiate hardcore mode.
Type \`${settings?.prefix ?? process.env.PREFIX}settings reset\` to reset the count!`)
                }                

            } else if (args[0] === "reset" && args[1] != message.guild.id) {
                await message.send(`⚠️ **WARNING: ** This command would reset the count of \`${count.current_count}\` for the community **${message.guild.name}**. This command cannot be undone and will **affect your community's position on the leaderboard**!
If you wish to continue, please type \`${settings?.prefix ?? process.env.PREFIX}settings reset <CommunityID>\``)
            } else if (args[0] === "reset" && args[1] === message.guild.id) {

                await client.db.query(`
                        UPDATE community_count
                        SET current_count = 0,
                        last_count_userid = NULL
                        WHERE community_id = ?;`,
                        [message.guild.id]);
                return await message.send("The count has successfully been reset!");

            } else if (args[0] === "prefix" && args[1]) {
                if (args[1].length != 1) {
                    return message.send("Prefixes can only be 1 character long.");
                }
                await client.db.query(`
                        UPDATE community_settings
                        SET prefix = ?
                        WHERE community_id = ?;`,
                        [args[1], message.guild.id]);

                return await message.send(`The prefix has successfully been set to ${args[1]}`);
            } else {

                const settingsEmbed = new EmbedBuilder()
                    .setTitle("⚙️ Settings Usage")
                    .setColor(0x4641D9)
                    .setDescription(`Guide to settings command:`)
                    .addFields(
                    { name: "📝 View Current Settings", value: `\`${settings?.prefix ?? process.env.PREFIX}settings list\` - View settings`, inline: false },
                    { name: "📍 Change Channel", value: `\`${settings?.prefix ?? process.env.PREFIX}settings channel <ID/#channel>\` - Change counting channel`, inline: false },
                    { name: "🧮 Arithmetic Mode", value: `\`${settings?.prefix ?? process.env.PREFIX}settings arithmetic <disable/enable>\` - Toggle maths operations`, inline: false },
                    { name: "🏆 Leaderboard", value: `\`${settings?.prefix ?? process.env.PREFIX}settings lb <disable/enable>\` - Toggle public community leaderboard`, inline: false },
                    { name: "🔢 Numbers Only Mode", value: `\`${settings?.prefix ?? process.env.PREFIX}settings numbersonly <disable/enable>\` - Toggle chat while counting`, inline: false },
                    { name: "🔥 Hardcore Mode", value: `\`${settings?.prefix ?? process.env.PREFIX}settings hardcore <disable/enable>\` - Toggle reset at incorrect number (must be 0 to initiate)`, inline: false },
                    { name: "0️⃣ Reset Count", value: `\`${settings?.prefix ?? process.env.PREFIX}settings reset\` - Reset the counter`, inline: false },
                    { name: "🤖 Prefix", value: `\`${settings?.prefix ?? process.env.PREFIX}settings prefix <prefix>\` - Set a new prefix`, inline: false }
                    )
                    .setFooter({ text: `Community ID: ${settings.community_id}` })
                    .setTimestamp();

                await message.send({ embeds: [settingsEmbed] });

            }
        } catch(err){
            console.error("Setup Error:", err);
            await message.send("Error occured, please try again later.");
        }
        
    }
}
const { SlashCommandBuilder, EmbedBuilder } = require("@discordjs/builders");
const {PermissionFlagsBits} = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("help")
		.setDescription("Helps by listing out all commands.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	
    async execute(interaction) {
		const cmds = [
        '/help - Lists out all the different configuration commands for the bot.',
        '/blacklist show - Shows the current blacklisted user/roles',
        '/blacklist add (user/role) - Lets you add a specific user/role to a blacklist which makes them bypass the purges.',
        '/blacklist remove (user/role) - Lets you remove a specific user/role to a blacklist.',
        '/purge - Starts a manual purge which will gather all inactive users and send specified channel for confirmation.' +
        'Can be edited to remove certain users or aborted to prevent a purge.',
        '/roletimer (role name) (amount of time in days) - Sets the grace period for a certain role.',
        '/setpurge (time in days) - Sets the specified automated purge window (in days).',
        '/timer (role) (time) - Sets a time window (in days) for a role before considering them inactive.',
        '/show inactivity - Shows members who are considered "inactive" that are eligible to be purged.',
        '/warn - Warns all members that are eligible to be purged through a direct message.',
            'preview - Allows you to view users that are eligible to be purged, and edit/interact with the list.',
];

      const embed = new EmbedBuilder()
        .setTitle("Help")
        .setDescription("List of all available commands.")
        .setColor(0x0099FF)

        for (const cmd of cmds) {
          const cmdParts = cmd.split(' - ');
          const cmdName = cmdParts[0];
          const cmdDesc = cmdParts[1];
    
          embed.addFields({
            name: cmdName, 
            value: cmdDesc,
          });
        } 

		  interaction.reply({
			  //content: cmds.join('\n'),
        embeds: [embed],
        ephemeral: true
		  });
	  }
};

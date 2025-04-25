const { SlashCommandBuilder, EmbedBuilder } = require("@discordjs/builders");
const blacklistAdd = require("../functions/blacklistAdd");
const blacklistShow = require("../functions/blacklistShow");
const blacklistRemove = require("../functions/blacklistRemove");

const { channelMention, roleMention, userMention, PermissionFlagsBits } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName("blacklist")
		.setDescription("Adds or Removes people or roles from the blacklist.")
		.addSubcommand((subcommand) => 
			subcommand.setName("add")
			.setDescription("Adds User or Role")
			.addUserOption((option) =>
				option.setName("user")
					.setDescription("User you are adding")
					.setRequired(false)
			)
			.addRoleOption((option) =>
				option.setName("role")
					.setDescription("Role you are adding")
					.setRequired(false)
			)
		)
		.addSubcommand((subcommand) =>
			subcommand.setName("remove")
			.setDescription("Removes User or Role")
			.addUserOption((option) =>
				option.setName("user")
					.setDescription("User you are removing")
					.setRequired(false)
			)
			.addRoleOption((option) =>
				option.setName("role")
					.setDescription("Role you are removing")
					.setRequired(false)
			)
		)
		.addSubcommand((subcommand) =>
			subcommand.setName("show")
			.setDescription("Shows the current blacklisted users and roles.")
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

	async execute(interaction) {
		const subcommand = interaction.options.getSubcommand();

		switch (subcommand) {
			//here
			case "add": {
				const user = interaction.options.getUser("user");
				const role = interaction.options.getRole("role");
			
				if (!user && !role) {
					return interaction.reply({ content: "Please specify a user or a role to blacklist.", ephemeral: true });
				}
			
				// ✅ This now runs correctly only if a user or role exists
				console.log("📥 Slash Input Debug:", {
					userId: user?.id,
					username: user?.username,
					roleId: role?.id,
					rolename: role?.name,
				});
			
				if (user) {
					await blacklistAdd.insertBlacklistDB(user.id, user.username);
					const embed = new EmbedBuilder()
						.setDescription(`✅ Added ${userMention(user.id)} to the blacklist.`)
						.setColor(0x2ECC71);
					await interaction.reply({ embeds: [embed] });
				}
			
				if (role) {
					// ✅ Call the unified function and pass role data
					await blacklistAdd.insertBlacklistDB(null, null, role.id, role.name);
					const embed = new EmbedBuilder()
						.setDescription(`✅ Added role ${roleMention(role.id)} to the blacklist.`)
						.setColor(0x2ECC71);
					await interaction.reply({ embeds: [embed] });
				}
			
				break;
			}
		
case "remove": {
	const user = interaction.options.getUser("user");
	const role = interaction.options.getRole("role");

	if (!user && !role) {
		return interaction.reply({
			content: "❌ Please specify a user or a role to remove from the blacklist.",
			ephemeral: true
		});
	}

	try {
		// If user provided
		if (user) {
			const result = await blacklistRemove.removeBlacklistDB(user.id, user.username);
			const embed = new EmbedBuilder().setDescription(result).setColor(0xE74C3C);
			await interaction.reply({ embeds: [embed], ephemeral: true });
		}

		// If role provided
		if (role) {
			const result = await blacklistRemove.removeBlacklistRoleDB(role.id, role.name);
			const embed = new EmbedBuilder().setDescription(result).setColor(0xE74C3C);
			await interaction.reply({ embeds: [embed], ephemeral: true });
		}
	} catch (error) {
		console.error("Blacklist remove error:", error);
		await interaction.reply({
			content: "❌ An error occurred while trying to remove from the blacklist.",
			ephemeral: true
		});
	}

	break;
}

		}
	},
};

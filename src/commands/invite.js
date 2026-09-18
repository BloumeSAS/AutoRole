const { createEmbed } = require('../utils/embed');

module.exports = {
  name: 'invite',
  aliases: ['botinfo', 'info'],
  description: "Affiche le lien d'invitation pour ajouter le bot à votre serveur BloumeChat.",
  adminOnly: false,
  async execute(client, message, args) {
    const serverId = message.serverId;
    const botId = process.env.CLIENT_ID || (client.user ? client.user.id : '');
    
    // Constructing the BloumeChat OAuth2 invite URL with the bot ID
    const inviteUrl = `https://bloumechat.com/oauth2/authorize?client_id=${botId}&scope=identify+bot&permissions=2147483648`;

    const embed = createEmbed("📥 Inviter le AutoRole Bot", null, serverId)
      .setDescription(
        `Vous souhaitez utiliser le **AutoRole Bot** sur votre serveur BloumeChat ?\n\n` +
        `Cliquez sur le lien ci-dessous pour l'ajouter en quelques clics :\n\n` +
        `➡️ **[Inviter le bot sur votre serveur](${inviteUrl})**`
      );

    await message.reply({ embeds: [embed] });
  }
};

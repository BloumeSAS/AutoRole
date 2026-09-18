const { createEmbed } = require('../utils/embed');
const { getSettings } = require('../utils/settingsManager');

module.exports = {
  name: 'help',
  aliases: ['h', 'aide', 'commands'],
  description: 'Affiche le menu d\'aide et la liste des commandes.',
  async execute(client, message, args) {
    const settings = message.serverId ? getSettings(message.serverId) : {};
    const prefix = settings.prefix || process.env.PREFIX || '!';

    if (args[0]) {
      const commandName = args[0].toLowerCase();
      const command = client.commands.get(commandName) ||
                      Array.from(client.commands.values()).find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

      if (!command) {
        return message.reply(`❌ La commande \`${commandName}\` n'existe pas.`);
      }

      const detailEmbed = createEmbed(
        `📖 Aide - Commande ${prefix}${command.name}`,
        `**Description :** ${command.description || 'Aucune description'}\n` +
        `**Alias :** ${command.aliases ? command.aliases.map(a => `\`${prefix}${a}\``).join(', ') : 'Aucun'}\n` +
        `**Restreint aux administrateurs :** ${command.adminOnly ? 'Oui 🔒' : 'Non 🔓'}`,
        message.serverId
      );
      return message.reply({ embeds: [detailEmbed] });
    }

    const helpEmbed = createEmbed(
      "🤖 Menu d'Aide - BloumeChat AutoRole Bot",
      `Bienvenue sur le bot **BloumeChat AutoRole Bot** ! Voici la liste des commandes disponibles sur ce serveur :\n\n` +
      `🎭 **Reaction Roles** (\`${prefix}rr\`)\n` +
      `• \`${prefix}rr create #salon "Titre" "Description" <emoji> <@role>\` : Envoie un embed et lie la réaction au rôle.\n` +
      `• \`${prefix}rr add <messageId> <emoji> <@role>\` : Lie un Reaction Role sur un message existant.\n` +
      `• \`${prefix}rr remove <messageId> <emoji>\` : Retire un Reaction Role.\n` +
      `• \`${prefix}rr list\` : Affiche les Reaction Roles du serveur.\n` +
      `• \`${prefix}rr clear <messageId>\` : Efface les Reaction Roles d'un message.\n\n` +
      `⚙️ **Autorole à l'arrivée** (\`${prefix}autorole\`)\n` +
      `• \`${prefix}autorole user <@role|off>\` : Rôle attribué automatiquement aux membres humains.\n` +
      `• \`${prefix}autorole bot <@role|off>\` : Rôle attribué aux bots.\n` +
      `• \`${prefix}autorole toggle <on|off>\` : Active ou désactive l'autorole.\n` +
      `• \`${prefix}autorole status\` : Affiche la configuration.\n\n` +
      `🛠️ **Gestion des Rôles** (\`${prefix}role\`)\n` +
      `• \`${prefix}role add <@user> <@role>\` : Donne un rôle à un utilisateur.\n` +
      `• \`${prefix}role remove <@user> <@role>\` : Retire un rôle.\n` +
      `• \`${prefix}role all <@role>\` : Donne un rôle à tous les membres.\n` +
      `• \`${prefix}role humans <@role>\` : Donne un rôle à tous les humains.\n` +
      `• \`${prefix}role bots <@role>\` : Donne un rôle à tous les bots.\n\n` +
      `🔧 **Configuration & Bot**\n` +
      `• \`${prefix}settings\` : Modifier les paramètres (prefix, couleur, footer, permissions).\n` +
      `• \`${prefix}invite\` : Obtenir le lien d'invitation et les informations du bot.`,
      message.serverId
    );

    return message.reply({ embeds: [helpEmbed] });
  }
};

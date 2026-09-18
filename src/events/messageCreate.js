const { createEmbed } = require('../utils/embed');
const { hasAdminAccess } = require('../utils/permissionCheck');
const { getSettings } = require('../utils/settingsManager');

/**
 * @param {import('bloumechat').BloumeChat} client 
 * @param {import('bloumechat').Message} message 
 */
module.exports = async (client, message) => {
  // Ignore messages from bots
  if (message.author && message.author.bot) return;

  const settings = message.serverId ? getSettings(message.serverId) : {};
  const prefix = settings.prefix || process.env.PREFIX || '!';

  // Check if message starts with the prefix
  if (!message.content || !message.content.startsWith(prefix)) return;

  // Split content into command and args
  const args = message.content.slice(prefix.length).trim().split(/\s+/);
  const commandName = args.shift().toLowerCase();

  if (!client.commands) return;
  const command = client.commands.get(commandName) || 
                  Array.from(client.commands.values()).find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

  if (!command) return;

  console.log(`[Command Execution] ${prefix}${commandName} par ${message.author.username || 'Inconnu'}`);

  // Base permission check for the bot in the channel
  if (message.serverId) {
    try {
      const botMember = await client.members.fetch(message.serverId, client.user.id);
      const { PermissionFlags } = require('bloumechat');
      if (botMember) {
        const canView = botMember.hasPermission(PermissionFlags.VIEW_CHANNELS);
        const canSend = botMember.hasPermission(PermissionFlags.SEND_MESSAGES);
        if (!canView || !canSend) {
          console.warn(`[MessageCreate] Le bot manque de permissions sur le serveur ${message.serverId}`);
          try {
            const dm = await client.createDM(message.author.id);
            await dm.send(`⚠️ **Alerte Permission** : Je ne peux pas exécuter la commande \`${prefix}${commandName}\` car je n'ai pas les permissions de lire ce salon ou d'y envoyer des messages.`);
          } catch (dmErr) {
            console.error("[MessageCreate] Impossible d'envoyer l'alerte de permission en DM :", dmErr.message);
          }
          return;
        }
      }
    } catch (err) {
      console.warn(`[MessageCreate] Vérification permissions bot échouée :`, err.message);
    }
  }

  // Admin access check for adminOnly commands
  if (command.adminOnly) {
    const hasAccess = await hasAdminAccess(client, message);
    if (!hasAccess) {
      const denyEmbed = createEmbed(
        "❌ Accès refusé",
        "Vous n'avez pas la permission ou le rôle requis pour exécuter cette commande d'administration.",
        message.serverId
      );
      try {
        await message.reply({ embeds: [denyEmbed] });
      } catch (replyError) {
        console.error("[MessageCreate] Impossible de répondre Accès refusé :", replyError.message);
      }
      return;
    }
  }

  try {
    await command.execute(client, message, args);
  } catch (error) {
    console.error(`Erreur lors de l'exécution de la commande ${commandName} :`, error);
    
    const errorEmbed = createEmbed(
      "❌ Une erreur est survenue",
      `Une erreur interne est survenue lors de l'exécution de cette commande.\n\n\`\`\`js\n${error.message}\n\`\`\``,
      message.serverId
    );
    
    try {
      await message.reply({ embeds: [errorEmbed] });
    } catch (replyError) {
      console.error("[MessageCreate] Impossible d'envoyer l'embed d'erreur dans le salon :", replyError.message);
      try {
        const dm = await client.createDM(message.author.id);
        await dm.send(
          `⚠️ **Erreur lors de l'exécution** pour la commande \`${prefix}${commandName}\`.\n` +
          `*Erreur :* \`${error.message}\``
        );
      } catch (dmError) {
        console.error("[MessageCreate] Impossible d'envoyer le DM d'erreur :", dmError.message);
      }
    }
  }
};

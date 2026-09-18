const { createEmbed } = require('../utils/embed');
const { getJoinRoleConfig, setJoinRoleConfig } = require('../utils/autoRoleDb');

async function resolveRole(guild, input) {
  if (!input) return null;
  const cleanId = input.replace(/[<@&>]/g, '').trim();
  
  if (guild) {
    try {
      const roles = await guild.fetchRoles();
      const role = roles.find(r => r.id === cleanId || r.name.toLowerCase() === input.toLowerCase());
      if (role) return role;
    } catch (err) {
      console.warn("[Autorole Command] Erreur fetch roles :", err.message);
    }
  }

  return { id: cleanId, name: input };
}

module.exports = {
  name: 'autorole',
  aliases: ['joinrole', 'welcome-role'],
  adminOnly: true,
  description: 'Configure le rôle attribué automatiquement à l\'arrivée de nouveaux membres.',
  async execute(client, message, args) {
    const guild = message.serverId ? client.guilds.cache.get(message.serverId) : null;
    const prefix = process.env.PREFIX || '!';

    if (!args.length || args[0].toLowerCase() === 'status' || args[0].toLowerCase() === 'config') {
      const config = getJoinRoleConfig(message.serverId);
      
      const embed = createEmbed(
        "⚙️ Configuration Autorole (À l'arrivée)",
        `Statut global : **${config.enabled ? '🟢 Activé' : '🔴 Désactivé'}**\n\n` +
        `👤 **Rôle Utilisateurs humains :** ${config.userRoleId ? `**${config.userRoleName}** (\`${config.userRoleId}\`)` : '*Aucun*'}\n` +
        `🤖 **Rôle Bots :** ${config.botRoleId ? `**${config.botRoleName}** (\`${config.botRoleId}\`)` : '*Aucun*'}\n\n` +
        `**Commandes de configuration :**\n` +
        `• \`${prefix}autorole user <@role|off>\` : Définit le rôle pour les membres humains.\n` +
        `• \`${prefix}autorole bot <@role|off>\` : Définit le rôle pour les bots.\n` +
        `• \`${prefix}autorole toggle <on|off>\` : Active ou désactive le système d'autorole.`,
        message.serverId
      );
      return message.reply({ embeds: [embed] });
    }

    const subCommand = args[0].toLowerCase();

    // --- TOGGLE ---
    if (subCommand === 'toggle') {
      const state = args[1] ? args[1].toLowerCase() : null;
      if (!state || (state !== 'on' && state !== 'off')) {
        return message.reply(`❌ Syntaxe : \`${prefix}autorole toggle <on|off>\``);
      }

      const enabled = state === 'on';
      setJoinRoleConfig(message.serverId, 'toggle', enabled);

      const embed = createEmbed(
        "⚙️ Autorole Mis à Jour",
        `L'attribution d'autorole à l'arrivée a été **${enabled ? 'activée 🟢' : 'désactivée 🔴'}**.`,
        message.serverId
      );
      return message.reply({ embeds: [embed] });
    }

    // --- USER AUTOROLE ---
    if (subCommand === 'user' || subCommand === 'human') {
      const roleInput = args[1];

      if (!roleInput) {
        return message.reply(`❌ Syntaxe : \`${prefix}autorole user <@role|off>\``);
      }

      if (roleInput.toLowerCase() === 'off') {
        setJoinRoleConfig(message.serverId, 'user', null, null);
        const embed = createEmbed("✅ Autorole Désactivé", "L'autorole pour les nouveaux membres humains a été désactivé.", message.serverId);
        return message.reply({ embeds: [embed] });
      }

      const role = await resolveRole(guild, roleInput);
      if (!role) {
        return message.reply("❌ Rôle introuvable.");
      }

      setJoinRoleConfig(message.serverId, 'user', role.id, role.name);

      const embed = createEmbed(
        "✅ Autorole Utilisateur Configuré",
        `Les nouveaux membres humains recevront automatiquement le rôle **${role.name}** à leur arrivée !`,
        message.serverId
      );
      return message.reply({ embeds: [embed] });
    }

    // --- BOT AUTOROLE ---
    if (subCommand === 'bot' || subCommand === 'bots') {
      const roleInput = args[1];

      if (!roleInput) {
        return message.reply(`❌ Syntaxe : \`${prefix}autorole bot <@role|off>\``);
      }

      if (roleInput.toLowerCase() === 'off') {
        setJoinRoleConfig(message.serverId, 'bot', null, null);
        const embed = createEmbed("✅ Autorole Bot Désactivé", "L'autorole pour les bots a été désactivé.", message.serverId);
        return message.reply({ embeds: [embed] });
      }

      const role = await resolveRole(guild, roleInput);
      if (!role) {
        return message.reply("❌ Rôle introuvable.");
      }

      setJoinRoleConfig(message.serverId, 'bot', role.id, role.name);

      const embed = createEmbed(
        "✅ Autorole Bot Configuré",
        `Les nouveaux bots recevront automatiquement le rôle **${role.name}** à leur arrivée !`,
        message.serverId
      );
      return message.reply({ embeds: [embed] });
    }

    return message.reply(`❌ Sous-commande inconnue \`${subCommand}\`. Tapez \`${prefix}autorole\` pour voir la configuration.`);
  }
};

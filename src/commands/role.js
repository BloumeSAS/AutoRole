const { createEmbed } = require('../utils/embed');
const { safeAddRole, safeRemoveRole } = require('../utils/autoRoleManager');

async function resolveRole(guild, input) {
  if (!input) return null;
  const cleanId = input.replace(/[<@&>]/g, '').trim();
  
  if (guild) {
    try {
      let roles = [];
      if (typeof guild.fetchRoles === 'function') {
        roles = await guild.fetchRoles();
      } else if (guild.roles && guild.roles.cache) {
        roles = Array.from(guild.roles.cache.values());
      }

      let role = roles.find(r => r.id === cleanId);
      if (role) return role;

      role = roles.find(r => r.name.toLowerCase() === input.toLowerCase() || r.name.toLowerCase() === cleanId.toLowerCase());
      if (role) return role;
    } catch (err) {
      console.warn("[Role Command] Erreur fetch roles :", err.message);
    }
  }

  return { id: cleanId, name: input.replace(/[<@&>]/g, '').trim() };
}

module.exports = {
  name: 'role',
  aliases: ['roles', 'setrole'],
  adminOnly: true,
  description: 'Commande de gestion individuelle et de masse des rôles sur le serveur.',
  async execute(client, message, args) {
    let guild = message.serverId ? client.guilds.cache.get(message.serverId) : null;
    if (!guild && message.serverId) {
      try {
        guild = await client.guilds.fetch(message.serverId);
      } catch (e) {}
    }

    const prefix = process.env.PREFIX || '!';

    if (!args.length) {
      const embed = createEmbed(
        "🛠️ Gestion des Rôles - Aide",
        `**Utilisation des commandes de rôle :**\n\n` +
        `• \`${prefix}role add <@utilisateur> <@rôle>\` : Attribue un rôle à un utilisateur.\n` +
        `• \`${prefix}role remove <@utilisateur> <@rôle>\` : Retire un rôle à un utilisateur.\n` +
        `• \`${prefix}role all <@rôle>\` : Attribue un rôle à TOUS les membres du serveur.\n` +
        `• \`${prefix}role humans <@rôle>\` : Attribue un rôle à tous les utilisateurs humains.\n` +
        `• \`${prefix}role bots <@rôle>\` : Attribue un rôle à tous les bots.`,
        message.serverId
      );
      return message.reply({ embeds: [embed] });
    }

    const subCommand = args[0].toLowerCase();

    // --- ADD ROLE TO USER ---
    if (subCommand === 'add') {
      const userMention = args[1];
      const roleInput = args[2];

      if (!userMention || !roleInput) {
        return message.reply(`❌ Syntaxe : \`${prefix}role add <@utilisateur> <@rôle>\``);
      }

      const userId = userMention.replace(/[<@!>]/g, '').trim();
      const role = await resolveRole(guild, roleInput);

      if (!role) return message.reply("❌ Rôle introuvable.");

      try {
        const member = await client.members.fetch(message.serverId, userId);
        if (!member) return message.reply("❌ Membre introuvable sur le serveur.");

        await safeAddRole(client, message.serverId, member, role.id);

        const embed = createEmbed(
          "✅ Rôle Attribué",
          `Le rôle **${role.name}** a été attribué avec succès à **${member.user ? member.user.tagString : userId}**.`,
          message.serverId
        );
        return message.reply({ embeds: [embed] });
      } catch (err) {
        return message.reply(`❌ Erreur lors de l'attribution du rôle : \`${err.message}\``);
      }
    }

    // --- REMOVE ROLE FROM USER ---
    if (subCommand === 'remove') {
      const userMention = args[1];
      const roleInput = args[2];

      if (!userMention || !roleInput) {
        return message.reply(`❌ Syntaxe : \`${prefix}role remove <@utilisateur> <@rôle>\``);
      }

      const userId = userMention.replace(/[<@!>]/g, '').trim();
      const role = await resolveRole(guild, roleInput);

      if (!role) return message.reply("❌ Rôle introuvable.");

      try {
        const member = await client.members.fetch(message.serverId, userId);
        if (!member) return message.reply("❌ Membre introuvable sur le serveur.");

        await safeRemoveRole(client, message.serverId, member, role.id);

        const embed = createEmbed(
          "✅ Rôle Retiré",
          `Le rôle **${role.name}** a été retiré avec succès à **${member.user ? member.user.tagString : userId}**.`,
          message.serverId
        );
        return message.reply({ embeds: [embed] });
      } catch (err) {
        return message.reply(`❌ Erreur lors du retrait du rôle : \`${err.message}\``);
      }
    }

    // --- MASS ROLES (ALL / HUMANS / BOTS) ---
    if (subCommand === 'all' || subCommand === 'humans' || subCommand === 'bots') {
      const roleInput = args[1];
      if (!roleInput) {
        return message.reply(`❌ Syntaxe : \`${prefix}role ${subCommand} <@rôle>\``);
      }

      const role = await resolveRole(guild, roleInput);
      if (!role) return message.reply("❌ Rôle introuvable.");

      const statusEmbed = createEmbed(
        "⏳ Attribution de masse en cours...",
        `Attribution du rôle **${role.name}** aux membres ciblés (\`${subCommand}\`). Veuillez patienter...`,
        message.serverId
      );
      const statusMsg = await message.reply({ embeds: [statusEmbed] });

      try {
        const allMembers = await client.members.fetchAll(message.serverId);
        let targetMembers = allMembers;

        if (subCommand === 'humans') {
          targetMembers = allMembers.filter(m => !(m.user && m.user.bot));
        } else if (subCommand === 'bots') {
          targetMembers = allMembers.filter(m => m.user && m.user.bot);
        }

        let successCount = 0;
        let failCount = 0;

        for (const m of targetMembers) {
          try {
            await safeAddRole(client, message.serverId, m, role.id);
            successCount++;
          } catch (e) {
            failCount++;
          }
        }

        const doneEmbed = createEmbed(
          "✅ Attribution de Masse Terminée",
          `Résultat de l'attribution du rôle **${role.name}** :\n\n` +
          `• **Succès :** ${successCount} membres\n` +
          `• **Échecs :** ${failCount} membres`,
          message.serverId
        );

        return statusMsg.edit({ embeds: [doneEmbed] });
      } catch (err) {
        return statusMsg.edit({ embeds: [createEmbed("❌ Erreur", `Impossible d'effectuer l'attribution de masse : \`${err.message}\``, message.serverId)] });
      }
    }

    return message.reply(`❌ Sous-commande inconnue \`${subCommand}\`. Tapez \`${prefix}role\` pour afficher l'aide.`);
  }
};

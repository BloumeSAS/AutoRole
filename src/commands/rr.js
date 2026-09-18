const { createEmbed } = require('../utils/embed');
const {
  addOrUpdateReactionRole,
  removeReactionRoleMapping,
  clearReactionRoleByMessage,
  getReactionRoles
} = require('../utils/autoRoleDb');

/**
 * Helper to resolve a role by ID, mention or name on the server.
 */
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

      // 1. Match by exact ID
      let role = roles.find(r => r.id === cleanId);
      if (role) return role;

      // 2. Match by exact name (case-insensitive)
      role = roles.find(r => r.name.toLowerCase() === input.toLowerCase() || r.name.toLowerCase() === cleanId.toLowerCase());
      if (role) return role;

      // 3. Match by partial name
      role = roles.find(r => r.name.toLowerCase().includes(cleanId.toLowerCase()));
      if (role) return role;
    } catch (err) {
      console.warn("[RR Command] Erreur fetchRoles :", err.message);
    }
  }

  return { id: cleanId, name: input.replace(/[<@&>]/g, '').trim() };
}

/**
 * Helper to resolve target channel by mention, ID or name.
 */
async function resolveChannel(client, message, input) {
  if (!input || !message.serverId) return message.channel;

  const cleanId = input.replace(/[<#>]  */g, '').trim().replace(/^#/, '');

  try {
    const channels = await client.channels.fetchForGuild(message.serverId);
    const found = channels.find(c => c.id === cleanId || c.name.toLowerCase() === cleanId.toLowerCase());
    if (found) return found;
  } catch (err) {}

  return message.channel;
}

module.exports = {
  name: 'rr',
  aliases: ['reactionrole', 'reactionroles'],
  adminOnly: true,
  description: 'Gère la configuration des Reaction Roles sur le serveur.',
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
        "🎭 Aide - Reaction Roles",
        `Utilisez les sous-commandes suivantes pour configurer un Reaction Role :\n\n` +
        `• \`${prefix}rr create <#salon> <emoji> <@role> <Titre du message>\` : Crée un Reaction Role.\n` +
        `• \`${prefix}rr create #salon "Titre" "Description" <emoji> <@role>\` : Format détaillé avec description.\n` +
        `• \`${prefix}rr add <messageId> <emoji> <@role>\` : Ajoute un Reaction Role sur un message existant.\n` +
        `• \`${prefix}rr remove <messageId> <emoji>\` : Retire un Reaction Role d'un message.\n` +
        `• \`${prefix}rr list\` : Liste tous les Reaction Roles configurés sur ce serveur.\n` +
        `• \`${prefix}rr clear <messageId>\` : Efface tous les Reaction Roles d'un message.`,
        message.serverId
      );
      return message.reply({ embeds: [embed] });
    }

    const subCommand = args[0].toLowerCase();

    // --- SUBCOMMAND: LIST ---
    if (subCommand === 'list') {
      const allRR = getReactionRoles().filter(item => item.serverId === message.serverId);

      if (!allRR.length) {
        const embed = createEmbed("🎭 Reaction Roles", "Aucun Reaction Role n'est actuellement configuré sur ce serveur.", message.serverId);
        return message.reply({ embeds: [embed] });
      }

      let description = "Voici la liste des Reaction Roles actifs sur ce serveur :\n\n";
      for (const item of allRR) {
        description += `📌 **Message ID :** \`${item.messageId}\` (Salon : <#${item.channelId}>)\n`;
        for (const m of item.mappings) {
          description += `  • ${m.emoji} ➔ Rôle : **${m.roleName}** (\`${m.roleId}\`)\n`;
        }
        description += "\n";
      }

      const listEmbed = createEmbed("🎭 Reaction Roles du Serveur", description, message.serverId);
      return message.reply({ embeds: [listEmbed] });
    }

    // --- SUBCOMMAND: CLEAR ---
    if (subCommand === 'clear') {
      const messageId = args[1];
      if (!messageId) {
        return message.reply("❌ L'ID du message est requis. Syntaxe: `!rr clear <messageId>`");
      }

      clearReactionRoleByMessage(messageId);
      const embed = createEmbed("✅ Reaction Role Effacé", `Tous les Reaction Roles associés au message \`${messageId}\` ont été supprimés.`, message.serverId);
      return message.reply({ embeds: [embed] });
    }

    // --- SUBCOMMAND: REMOVE ---
    if (subCommand === 'remove') {
      const messageId = args[1];
      const emoji = args[2];

      if (!messageId || !emoji) {
        return message.reply("❌ Syntaxe incorrecte. Utilisation : `!rr remove <messageId> <emoji>`");
      }

      const success = removeReactionRoleMapping(messageId, emoji);
      if (success) {
        const embed = createEmbed("✅ Reaction Role Retiré", `La réaction ${emoji} sur le message \`${messageId}\` ne donnera plus de rôle.`, message.serverId);
        return message.reply({ embeds: [embed] });
      } else {
        return message.reply("❌ Aucun Reaction Role n'a été trouvé pour cet ID de message et cet emoji.");
      }
    }

    // --- SUBCOMMAND: ADD ---
    if (subCommand === 'add') {
      const messageId = args[1];
      const emoji = args[2];
      const roleInput = args[3];

      if (!messageId || !emoji || !roleInput) {
        return message.reply("❌ Syntaxe incorrecte. Utilisation : `!rr add <messageId> <emoji> <@role>`");
      }

      const role = await resolveRole(guild, roleInput);
      if (!role) {
        return message.reply("❌ Rôle introuvable. Veuillez mentionner le rôle ou fournir un ID valide.");
      }

      // Add reaction to the target message if available
      try {
        const targetMsg = await message.channel.fetchMessages(100).then(msgs => msgs.find(m => m.id === messageId));
        if (targetMsg && typeof targetMsg.react === 'function') {
          await targetMsg.react(emoji);
        }
      } catch (reactErr) {
        console.warn("[RR Add] N'a pas pu ajouter la réaction au message :", reactErr.message);
      }

      addOrUpdateReactionRole(messageId, message.channelId, message.serverId, emoji, role.id, role.name);

      const embed = createEmbed(
        "✅ Reaction Role Ajouté",
        `Réaction ${emoji} liée au rôle **${role.name}** sur le message \`${messageId}\`.`,
        message.serverId
      );
      return message.reply({ embeds: [embed] });
    }

    // --- SUBCOMMAND: CREATE ---
    if (subCommand === 'create') {
      let rawArgs = args.slice(1);
      if (!rawArgs.length) {
        return message.reply(
          "❌ Syntaxe : `!rr create <#salon> <emoji> <@role> <Titre du message>`\n" +
          "Exemple : `!rr create #verification ✅ @Membre Cliquez pour vous vérifier !`"
        );
      }

      // 1. Check if first argument is a channel mention or channel name
      let targetChannel = message.channel;
      const firstArg = rawArgs[0];
      if (firstArg.startsWith('<#') || firstArg.startsWith('#')) {
        targetChannel = await resolveChannel(client, message, firstArg);
        rawArgs.shift(); // remove channel arg
      }

      const fullText = rawArgs.join(' ');

      // Format 1: Quoted syntax: "Titre" "Description" <emoji> <@role>
      const quotedMatches = fullText.match(/^"([^"]+)"\s+"([^"]+)"\s+(\S+)\s+(\S+)/);

      let title = "";
      let description = "";
      let emoji = "";
      let roleInput = "";

      if (quotedMatches) {
        [, title, description, emoji, roleInput] = quotedMatches;
      } else {
        // Format 2: Unquoted syntax: <emoji> <@role> <Titre et description...>
        emoji = rawArgs[0];
        roleInput = rawArgs[1];
        title = rawArgs.slice(2).join(' ') || "Rôle par Réaction";

        if (!emoji || !roleInput) {
          return message.reply(
            "❌ Syntaxe : `!rr create <#salon> <emoji> <@role> <Titre>`\n" +
            "Exemple : `!rr create #salon ✅ @RoleAccès Titre du salon`"
          );
        }
      }

      const role = await resolveRole(guild, roleInput);
      if (!role || !role.id) {
        return message.reply(`❌ Rôle \`${roleInput}\` introuvable sur le serveur. Veuillez mentionner le rôle ou vérifier son nom/ID.`);
      }

      const descText = description ? `${description}\n\n${emoji} ➔ **${role.name}**` : `Réagissez avec ${emoji} pour obtenir ou retirer le rôle **${role.name}** !`;

      const rrEmbed = createEmbed(
        title,
        descText,
        message.serverId
      );

      let sentMsg = null;
      try {
        sentMsg = await targetChannel.send({ embeds: [rrEmbed] });
      } catch (sendErr) {
        console.error("[RR Create] Erreur envoi message dans le salon :", sendErr.message);
        return message.reply(`❌ Impossible d'envoyer le message dans le salon <#${targetChannel.id}>. Vérifiez les permissions du bot.`);
      }

      try {
        await sentMsg.react(emoji);
      } catch (e) {
        console.warn("[RR Create] N'a pas pu ajouter la réaction automatique :", e.message);
      }

      addOrUpdateReactionRole(sentMsg.id, targetChannel.id, message.serverId, emoji, role.id, role.name);

      const confirmEmbed = createEmbed(
        "✅ Reaction Role Créé",
        `Le Reaction Role pour **${role.name}** a été envoyé avec succès dans <#${targetChannel.id}> !\nID Message : \`${sentMsg.id}\``,
        message.serverId
      );
      return message.reply({ embeds: [confirmEmbed] });
    }

    return message.reply(`❌ Sous-commande inconnue \`${subCommand}\`. Tapez \`${prefix}rr\` pour voir l'aide.`);
  }
};

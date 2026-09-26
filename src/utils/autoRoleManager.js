const { getReactionRoleByMessage, getJoinRoleConfig } = require('./autoRoleDb');
const { createEmbed } = require('./embed');

// Deduplication locks map (key -> timestamp) to prevent duplicate processing from rapid/duplicate events
const processingLocks = new Map();

function isLocked(key) {
  const now = Date.now();
  if (processingLocks.has(key)) {
    const timestamp = processingLocks.get(key);
    if (now - timestamp < 1500) {
      return true;
    }
  }
  processingLocks.set(key, now);
  // Auto cleanup lock after 2 seconds
  setTimeout(() => {
    if (processingLocks.get(key) === now) {
      processingLocks.delete(key);
    }
  }, 2000);
  return false;
}

/**
 * Safely adds a role to a member using their user.id instead of membership publicId.
 */
async function safeAddRole(client, serverId, member, roleId) {
  const targetUserId = (member.user && member.user.id) ? member.user.id : member.id;

  let currentRoleIds = [];
  if (typeof member.roleIds === 'function') {
    currentRoleIds = member.roleIds();
  } else if (Array.isArray(member.roles)) {
    currentRoleIds = member.roles.map(r => typeof r === 'string' ? r : (r.id || r.publicId)).filter(Boolean);
  }

  if (currentRoleIds.includes(roleId)) return false;

  const newRoleIds = [...currentRoleIds, roleId];

  await client.apiCall(`/servers/${serverId}/members/${targetUserId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roles: newRoleIds })
  });

  return true;
}

/**
 * Safely removes a role from a member using their user.id.
 */
async function safeRemoveRole(client, serverId, member, roleId) {
  const targetUserId = (member.user && member.user.id) ? member.user.id : member.id;

  let currentRoleIds = [];
  if (typeof member.roleIds === 'function') {
    currentRoleIds = member.roleIds();
  } else if (Array.isArray(member.roles)) {
    currentRoleIds = member.roles.map(r => typeof r === 'string' ? r : (r.id || r.publicId)).filter(Boolean);
  }

  if (!currentRoleIds.includes(roleId)) return false;

  const newRoleIds = currentRoleIds.filter(id => id !== roleId);

  await client.apiCall(`/servers/${serverId}/members/${targetUserId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roles: newRoleIds })
  });

  return true;
}

/**
 * Handles real-time reaction role synchronization when reaction update payload is received.
 * @param {import('bloumechat').BloumeChat} client 
 * @param {object} rawData - Payload from messageReactionAdd event
 */
async function handleReactionRole(client, rawData) {
  if (!rawData) return;

  const messageId = String(rawData.messagePublicId || rawData.messageId || rawData.id || '');
  if (!messageId) return;

  const rrConfig = getReactionRoleByMessage(messageId);
  if (!rrConfig) return;

  const targetServerId = rawData.serverId || rawData.serverPublicId || rrConfig.serverId;
  if (!targetServerId) return;

  const rawReactions = Array.isArray(rawData.reactions) ? rawData.reactions : (rawData.emoji ? [rawData] : []);

  // Synchronize each role mapping configured for this message
  for (const mapping of rrConfig.mappings) {
    const roleId = mapping.roleId;

    // Active user IDs currently reacting with this mapping's emoji (excluding bot)
    const activeUserIds = new Set(
      rawReactions
        .filter(r => {
          const e = String(r.emoji || r.reaction || '').trim();
          if (!e) return false;
          return e === mapping.emoji || 
                 encodeURIComponent(e) === encodeURIComponent(mapping.emoji) ||
                 e.includes(mapping.emoji) || 
                 mapping.emoji.includes(e);
        })
        .map(r => String(r.userPublicId || r.userId || r.authorId || '').trim())
        .filter(uId => uId && (!client.user || uId !== client.user.id))
    );

    // 1. Give role to active reactors who don't have it yet
    for (const userId of activeUserIds) {
      const lockKey = `add:${messageId}:${userId}:${roleId}`;
      if (isLocked(lockKey)) continue;

      try {
        const member = await client.members.fetch(targetServerId, userId);
        if (!member) continue;

        let memberRoleIds = [];
        if (typeof member.roleIds === 'function') {
          memberRoleIds = member.roleIds();
        } else if (Array.isArray(member.roles)) {
          memberRoleIds = member.roles.map(item => typeof item === 'string' ? item : (item.id || item.publicId)).filter(Boolean);
        }

        if (!memberRoleIds.includes(roleId)) {
          const added = await safeAddRole(client, targetServerId, member, roleId);
          if (added) {
            console.log(`[AutoRoleManager] ✅ Réaction ajoutée : Rôle ${mapping.roleName} (${roleId}) attribué à ${member.user ? member.user.tagString : userId}`);
            try {
              const embed = createEmbed("🎭 Rôle Attribué", `Le rôle **${mapping.roleName}** vous a été attribué suite à votre réaction sur le serveur !`, targetServerId);
              if (typeof member.send === 'function') {
                await member.send({ embeds: [embed] });
              } else {
                const dm = await client.createDM(userId);
                await dm.send({ embeds: [embed] });
              }
            } catch (dmErr) {}
          }
        }
      } catch (err) {
        console.error(`[AutoRoleManager] Erreur attribution rôle ${mapping.roleName} à ${userId}:`, err.message);
      }
    }

    // 2. Remove role from members who currently have roleId but are NO LONGER in activeUserIds
    try {
      let guildMembers = [];
      try {
        guildMembers = await client.members.fetchAll(targetServerId);
      } catch (fErr) {
        guildMembers = Array.from(client.members.cache.values()).filter(m => m.serverId === targetServerId);
      }

      for (const member of guildMembers) {
        const userId = (member.user && member.user.id) ? member.user.id : member.id;

        // Skip bot itself
        if (client.user && userId === client.user.id) continue;

        let memberRoleIds = [];
        if (typeof member.roleIds === 'function') {
          memberRoleIds = member.roleIds();
        } else if (Array.isArray(member.roles)) {
          memberRoleIds = member.roles.map(item => typeof item === 'string' ? item : (item.id || item.publicId)).filter(Boolean);
        }

        // If member has role BUT is no longer in activeUserIds -> Remove role!
        if (memberRoleIds.includes(roleId) && !activeUserIds.has(userId)) {
          const lockKey = `remove:${messageId}:${userId}:${roleId}`;
          if (isLocked(lockKey)) continue;

          const removed = await safeRemoveRole(client, targetServerId, member, roleId);
          if (removed) {
            console.log(`[AutoRoleManager] ❌ Réaction retirée : Rôle ${mapping.roleName} (${roleId}) retiré à ${member.user ? member.user.tagString : userId}`);
            try {
              const embed = createEmbed("🎭 Rôle Retiré", `Le rôle **${mapping.roleName}** vous a été retiré suite au retrait de votre réaction sur le serveur.`, targetServerId);
              if (typeof member.send === 'function') {
                await member.send({ embeds: [embed] });
              } else {
                const dm = await client.createDM(userId);
                await dm.send({ embeds: [embed] });
              }
            } catch (dmErr) {}
          }
        }
      }
    } catch (removeErr) {
      console.error(`[AutoRoleManager] Erreur synchronisation retrait rôle ${mapping.roleName}:`, removeErr.message);
    }
  }
}

/**
 * Handles automatic join role assignment when a new member joins a server.
 * @param {import('bloumechat').BloumeChat} client 
 * @param {import('bloumechat').Member} member 
 */
async function handleJoinAutoRole(client, member) {
  if (!member || !member.serverId) return;

  const config = getJoinRoleConfig(member.serverId);
  if (!config || !config.enabled) return;

  const isBot = member.user && member.user.bot;
  const roleIdToAssign = isBot ? config.botRoleId : config.userRoleId;
  const roleName = isBot ? config.botRoleName : config.userRoleName;

  if (!roleIdToAssign) return;

  try {
    await safeAddRole(client, member.serverId, member, roleIdToAssign);
    console.log(`[AutoRoleManager] Autorole attribué au nouveau membre ${member.user ? member.user.tagString : member.id} : ${roleName} (${roleIdToAssign})`);
  } catch (error) {
    console.error(`[AutoRoleManager] Erreur attribution autorole à l'arrivée :`, error.message);
  }
}

module.exports = {
  handleReactionRole,
  handleJoinAutoRole,
  safeAddRole,
  safeRemoveRole
};

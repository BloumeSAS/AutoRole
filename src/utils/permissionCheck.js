const { PermissionFlags } = require('bloumechat');
const { getSettings } = require('./settingsManager');

const permissionMap = {
  'ADMINISTRATOR': PermissionFlags.ADMINISTRATOR,
  'MANAGE_SERVER': PermissionFlags.MANAGE_SERVER,
  'MANAGE_ROLES': PermissionFlags.MANAGE_ROLES,
  'MANAGE_CHANNELS': PermissionFlags.MANAGE_CHANNELS,
  'MANAGE_MESSAGES': PermissionFlags.MANAGE_MESSAGES,
  'KICK_MEMBERS': PermissionFlags.KICK_MEMBERS,
  'BAN_MEMBERS': PermissionFlags.BAN_MEMBERS,
  'VIEW_CHANNELS': PermissionFlags.VIEW_CHANNELS,
  'SEND_MESSAGES': PermissionFlags.SEND_MESSAGES
};

/**
 * Checks if the member who sent the message has permission to execute admin/configuration commands.
 * @param {import('bloumechat').BloumeChat} client 
 * @param {import('bloumechat').Message} message 
 * @returns {Promise<boolean>}
 */
async function hasAdminAccess(client, message) {
  if (!message.serverId) {
    return false;
  }

  // 1. Fetch guild from cache or API
  let guild = client.guilds.cache.get(message.serverId);
  if (!guild) {
    try {
      guild = await client.guilds.fetch(message.serverId);
    } catch (err) {
      console.warn(`[PermissionCheck] Impossible de fetch le serveur ${message.serverId} :`, err.message);
    }
  }

  // 2. Check Guild Owner
  if (guild) {
    const ownerId = guild.ownerId || (guild.rawData && (guild.rawData.ownerId || guild.rawData.ownerPublicId || guild.rawData.owner_id));
    if (ownerId && ownerId === message.author.id) {
      return true;
    }
  }

  // 3. Fetch Member
  let member = null;
  try {
    member = await client.members.fetch(message.serverId, message.author.id);
  } catch (error) {
    console.error("[PermissionCheck] Erreur lors du fetch du membre :", error.message);
  }

  if (member) {
    // Check if member is marked as owner
    if (member.isOwner === true || (member.rawData && member.rawData.isOwner === true)) {
      return true;
    }

    // Administrator or MANAGE_ROLES or MANAGE_SERVER permission check
    if (typeof member.hasPermission === 'function') {
      if (member.hasPermission(PermissionFlags.ADMINISTRATOR) || member.hasPermission(PermissionFlags.MANAGE_SERVER) || member.hasPermission(PermissionFlags.MANAGE_ROLES)) {
        return true;
      }
    }

    const settings = getSettings(message.serverId);

    // Check configured Permission
    if (settings.adminPermission && settings.adminPermission !== 'none') {
      const requiredFlag = permissionMap[settings.adminPermission.toUpperCase()];
      if (requiredFlag && typeof member.hasPermission === 'function' && member.hasPermission(requiredFlag)) {
        return true;
      }
    }
  }

  return false;
}

module.exports = {
  hasAdminAccess,
  permissionMap
};

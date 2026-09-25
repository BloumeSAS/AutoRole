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
    const ownerId = guild.ownerId || (guild.rawData && (guild.rawData.ownerId || guild.rawData.ownerPublicId || guild.rawData.owner_id || guild.rawData.owner?.publicId));
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

    // Direct SDK check
    if (typeof member.hasPermission === 'function') {
      if (member.hasPermission(PermissionFlags.ADMINISTRATOR) || 
          member.hasPermission(PermissionFlags.MANAGE_SERVER) || 
          member.hasPermission(PermissionFlags.MANAGE_ROLES)) {
        return true;
      }
    }

    // Comprehensive Fallback Permission Checking
    const requiredPermissions = [
      PermissionFlags.ADMINISTRATOR,
      PermissionFlags.MANAGE_SERVER,
      PermissionFlags.MANAGE_ROLES
    ];

    const settings = getSettings(message.serverId);
    if (settings.adminPermission && settings.adminPermission !== 'none') {
      const customFlag = permissionMap[settings.adminPermission.toUpperCase()];
      if (customFlag) {
        requiredPermissions.push(customFlag);
      }
    }

    if (member.roles && Array.isArray(member.roles)) {
      for (const roleItem of member.roles) {
        let roleObj = roleItem;
        if (typeof roleItem === 'string' && guild && guild.roles && guild.roles.cache) {
          roleObj = guild.roles.cache.get(roleItem);
        }
        if (roleObj && typeof roleObj === 'object') {
          const permVal = BigInt(roleObj.permissions || 0);
          for (const flag of requiredPermissions) {
            if ((permVal & flag) === flag) return true;
          }
        }
      }
    }
  }

  return false;
}

module.exports = {
  hasAdminAccess,
  permissionMap
};

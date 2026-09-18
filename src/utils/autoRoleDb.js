const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', '..', 'data');
const rrFilePath = path.join(dataDir, 'reaction_roles.json');
const joinRolesFilePath = path.join(dataDir, 'join_roles.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Ensure database files exist
if (!fs.existsSync(rrFilePath)) {
  fs.writeFileSync(rrFilePath, JSON.stringify([], null, 2), 'utf8');
}
if (!fs.existsSync(joinRolesFilePath)) {
  fs.writeFileSync(joinRolesFilePath, JSON.stringify({}, null, 2), 'utf8');
}

// Memory caches
let rrCache = null;
let joinRolesCache = null;

// --- REACTION ROLES DB ---

function getReactionRoles() {
  if (rrCache !== null) return rrCache;
  try {
    const raw = fs.readFileSync(rrFilePath, 'utf8');
    rrCache = JSON.parse(raw);
  } catch (err) {
    console.error("[AutoRoleDb] Erreur lecture reaction_roles.json:", err);
    rrCache = [];
  }
  return rrCache;
}

function saveReactionRoles(data) {
  rrCache = data;
  try {
    fs.writeFileSync(rrFilePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error("[AutoRoleDb] Erreur écriture reaction_roles.json:", err);
  }
}

function getReactionRoleByMessage(messageId) {
  const all = getReactionRoles();
  return all.find(item => item.messageId === messageId) || null;
}

function addOrUpdateReactionRole(messageId, channelId, serverId, emoji, roleId, roleName) {
  const all = getReactionRoles();
  let entry = all.find(item => item.messageId === messageId);

  if (!entry) {
    entry = {
      messageId,
      channelId,
      serverId,
      mappings: [],
      createdAt: new Date().toISOString()
    };
    all.push(entry);
  }

  // Check if emoji mapping already exists, replace or add
  const existingIndex = entry.mappings.findIndex(m => m.emoji === emoji);
  if (existingIndex >= 0) {
    entry.mappings[existingIndex] = { emoji, roleId, roleName };
  } else {
    entry.mappings.push({ emoji, roleId, roleName });
  }

  saveReactionRoles(all);
  return entry;
}

function removeReactionRoleMapping(messageId, emoji) {
  const all = getReactionRoles();
  const entry = all.find(item => item.messageId === messageId);
  if (!entry) return false;

  entry.mappings = entry.mappings.filter(m => m.emoji !== emoji);
  if (entry.mappings.length === 0) {
    // If no mappings left, remove entire entry
    const filtered = all.filter(item => item.messageId !== messageId);
    saveReactionRoles(filtered);
  } else {
    saveReactionRoles(all);
  }
  return true;
}

function clearReactionRoleByMessage(messageId) {
  const all = getReactionRoles();
  const filtered = all.filter(item => item.messageId !== messageId);
  saveReactionRoles(filtered);
  return true;
}

// --- JOIN AUTOROLES DB ---

function getJoinRolesData() {
  if (joinRolesCache !== null) return joinRolesCache;
  try {
    const raw = fs.readFileSync(joinRolesFilePath, 'utf8');
    joinRolesCache = JSON.parse(raw);
  } catch (err) {
    console.error("[AutoRoleDb] Erreur lecture join_roles.json:", err);
    joinRolesCache = {};
  }
  return joinRolesCache;
}

function saveJoinRolesData(data) {
  joinRolesCache = data;
  try {
    fs.writeFileSync(joinRolesFilePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error("[AutoRoleDb] Erreur écriture join_roles.json:", err);
  }
}

function getJoinRoleConfig(serverId) {
  const all = getJoinRolesData();
  return all[serverId] || { userRoleId: null, userRoleName: null, botRoleId: null, botRoleName: null, enabled: true };
}

function setJoinRoleConfig(serverId, key, roleId, roleName) {
  const all = getJoinRolesData();
  if (!all[serverId]) {
    all[serverId] = { userRoleId: null, userRoleName: null, botRoleId: null, botRoleName: null, enabled: true };
  }

  if (key === 'user') {
    all[serverId].userRoleId = roleId;
    all[serverId].userRoleName = roleName;
  } else if (key === 'bot') {
    all[serverId].botRoleId = roleId;
    all[serverId].botRoleName = roleName;
  } else if (key === 'toggle') {
    all[serverId].enabled = !!roleId; // boolean
  }

  saveJoinRolesData(all);
  return all[serverId];
}

module.exports = {
  getReactionRoles,
  getReactionRoleByMessage,
  addOrUpdateReactionRole,
  removeReactionRoleMapping,
  clearReactionRoleByMessage,
  getJoinRoleConfig,
  setJoinRoleConfig
};

const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', '..', 'data');

// Ensure the data directory exists
if (!fs.existsSync(dataDir)) {
  try {
    fs.mkdirSync(dataDir, { recursive: true });
  } catch (error) {
    console.error("[SettingsManager] Impossible de créer le dossier data/ :", error);
  }
}

// Default fallback settings
const defaultSettings = {
  footer: "AutoRole Bot • Fait avec ❤️ par BloumeChat",
  themeColor: "#3b82f6",
  adminPermission: "none",
  prefix: process.env.PREFIX || "!"
};

/**
 * Loads the settings from data/<serverId>.json or returns default settings.
 * @param {string} [serverId] The ID of the server
 * @returns {object} The settings for the server, merged with defaults
 */
function getSettings(serverId = null) {
  const defaultPath = path.join(dataDir, 'default.json');
  let def = { ...defaultSettings };
  try {
    if (fs.existsSync(defaultPath)) {
      const data = fs.readFileSync(defaultPath, 'utf8');
      def = { ...def, ...JSON.parse(data) };
    } else {
      fs.writeFileSync(defaultPath, JSON.stringify(def, null, 2), 'utf8');
    }
  } catch (error) {
    console.error("[SettingsManager] Erreur lors de la lecture des paramètres par défaut :", error);
  }

  if (!serverId || serverId === 'default') {
    return def;
  }

  const serverPath = path.join(dataDir, `${serverId}.json`);
  let serverSettings = {};
  try {
    if (fs.existsSync(serverPath)) {
      const data = fs.readFileSync(serverPath, 'utf8');
      serverSettings = JSON.parse(data);
    } else {
      fs.writeFileSync(serverPath, JSON.stringify({}, null, 2), 'utf8');
      console.log(`[SettingsManager] Fichier de configuration créé pour le serveur : ${serverId}`);
    }
  } catch (error) {
    console.error(`[SettingsManager] Erreur lors de la lecture/création pour le serveur ${serverId}:`, error);
  }

  return { ...def, ...serverSettings };
}

/**
 * Updates a setting key with a value and saves it under data/<serverId>.json.
 * @param {string} serverId The ID of the server to update settings for
 * @param {string} key 
 * @param {any} value 
 * @returns {object} updated settings for that server
 */
function updateSetting(serverId, key, value) {
  if (!serverId) {
    serverId = 'default';
  }

  const targetPath = path.join(dataDir, `${serverId}.json`);
  let settings = {};
  try {
    if (fs.existsSync(targetPath)) {
      const data = fs.readFileSync(targetPath, 'utf8');
      settings = JSON.parse(data);
    }
  } catch (error) {
    console.error(`[SettingsManager] Erreur lecture fichier serveur ${serverId}:`, error);
  }

  settings[key] = value;

  try {
    fs.writeFileSync(targetPath, JSON.stringify(settings, null, 2), 'utf8');
  } catch (error) {
    console.error(`[SettingsManager] Erreur écriture fichier serveur ${serverId}:`, error);
  }

  return getSettings(serverId);
}

module.exports = {
  getSettings,
  updateSetting
};

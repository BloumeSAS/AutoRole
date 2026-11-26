const { handleReactionRole } = require('./autoRoleManager');

/**
 * Attaches a raw 'message:reaction' socket listener to guarantee full reaction-list
 * synchronization (including when a pre-existing reaction is removed right after a bot restart).
 * @param {import('@bloume/chat').BloumeChat} client 
 */
function bindSocketListeners(client) {
  const socket = typeof client.getSocket === 'function' ? client.getSocket() : client.socket;
  if (!socket) return;

  if (client._rawReactionListener) {
    socket.off('message:reaction', client._rawReactionListener);
  }

  client._rawReactionListener = async (data) => {
    try {
      if (data && Array.isArray(data.reactions)) {
        await handleReactionRole(client, data);
      }
    } catch (error) {
      console.error("[SocketListener] Erreur lors du traitement de 'message:reaction' :", error);
    }
  };

  socket.on('message:reaction', client._rawReactionListener);
}

module.exports = {
  bindSocketListeners
};

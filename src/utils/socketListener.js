/**
 * Helper module for socket connection monitoring.
 * Note: bloumechat SDK already emits 'messageReactionAdd' when 'message:reaction' arrives from socket.
 * @param {import('bloumechat').BloumeChat} client 
 */
function bindSocketListeners(client) {
  // Kept clean to avoid duplicate event emissions from SDK socket binding
}

module.exports = {
  bindSocketListeners
};

const { GatewayOpcodes } = require('@erinjs/core');

function pushPresenceUpdate(client, BOT_PRESENCE) {
  try {
    client.ws?.send(0, {
      op: GatewayOpcodes.PresenceUpdate,
      d: BOT_PRESENCE,
    });
  } catch {}
}

module.exports = { pushPresenceUpdate }
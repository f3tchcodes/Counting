require("dotenv").config();
const { Events } = require("@fluxerjs/core");

module.exports = {
  name: Events.Error,
  async execute(client, err) {
    console.error("CLIENT ERROR: ", err);
  }
};
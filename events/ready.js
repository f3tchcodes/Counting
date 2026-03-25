require("dotenv").config();
const { Events } = require("@fluxerjs/core");
const mysql2 = require("mysql2/promise");
const { GatewayPresenceUpdateData } = require("@fluxerjs/types");

module.exports = {
  name: Events.Ready,
  async execute(client) {

    try {
      client.db = mysql2.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });
    } catch (err) {
      console.log(err)
    }
    
    client.deletedByBot = new Set();

    console.log("Ready and connected to database!")
  }
};
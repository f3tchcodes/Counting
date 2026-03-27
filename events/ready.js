require("dotenv").config();
const { Events } = require("@fluxerjs/core");
const mysql2 = require("mysql2/promise");

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

    try {
      const [rows] = await client.db.query(
          "SELECT * FROM community_settings"
      );

      if (rows && rows.length > 0) {
        for (const row of rows) {
          await client.channels.send(row.channel_id, "✅ **The bot is back online! You can continue to count. Thank you for waiting!**")
          const guild = client.guilds.cache.get(row.community_id);
          console.log(`Sent message for: ${guild ? guild.name : row.community_id}`);
        }
      }
    } catch (err) {
      console.log(err);
    } 
  }
};
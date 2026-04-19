require("dotenv").config();
const { Events } = require("@fluxerjs/core");
const mysql2 = require("mysql2/promise");
const { announce } = require("../utils/announce");

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
    client.messageCache = new Map();

    console.log("Ready and connected to database!")

    try {
      const [[flag]] = await client.db.query(
        `SELECT * FROM bot_settings WHERE id = 1`
      )
      console.log(flag.startup_msg_flag)
      if (!flag.startup_msg_flag) return;

      await announce(client, "✅ **The bot is back online! You can continue to count. Thank you for waiting!**");

      // update flag to 0 so we don't send the message at every update (updating flag to 1 when we use .dev shutdown)
      await client.db.query(`
        INSERT INTO bot_settings (id, startup_msg_flag)
        VALUES (1, 0)
        ON DUPLICATE KEY UPDATE
        startup_msg_flag = 0;
      `);

    } catch (err) {
      console.log(err);
    } 
  }
};
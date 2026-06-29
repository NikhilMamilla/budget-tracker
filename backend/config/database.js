const { Sequelize } = require('sequelize');
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const dialect = process.env.DB_DIALECT || 'mysql';
const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || 3306;
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASS || '';
const database = process.env.DB_NAME || 'expense_tracker_db';

// Use /tmp directory in serverless environments (e.g. Vercel)
const sqliteStoragePath = process.env.VERCEL || process.env.NODE_ENV === 'production'
  ? path.join('/tmp', 'database.sqlite')
  : path.join(__dirname, '../database.sqlite');

let sequelize;

if (dialect === 'mysql') {
  sequelize = new Sequelize(database, user, password, {
    host: host,
    port: port,
    dialect: 'mysql',
    logging: false,
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
    define: { timestamps: true, underscored: true }
  });
} else {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: sqliteStoragePath,
    logging: false,
    define: { timestamps: true, underscored: true }
  });
}

const connectDB = async () => {
  if (dialect === 'mysql') {
    try {
      const connection = await mysql.createConnection({ host, port, user, password, connectTimeout: 5000 });
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
      await connection.end();
      console.log(`[Database] MySQL schema \`${database}\` verified/created.`);

      await sequelize.authenticate();
      console.log(`[Database] Sequelize connected successfully via MySQL dialect.`);
    } catch (error) {
      console.warn(`[Database] MySQL connection failed (${error.message}). Swapping to SQLite fallback...`);
      sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: sqliteStoragePath,
        logging: false,
        define: { timestamps: true, underscored: true }
      });
      await sequelize.authenticate();
      console.log('[Database] SQLite database connected successfully.');
    }
  } else {
    await sequelize.authenticate();
    console.log('[Database] SQLite database connected successfully.');
  }
};

module.exports = {
  get sequelize() { return sequelize; },
  connectDB
};

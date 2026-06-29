const { Sequelize } = require('sequelize');
const mysql = require('mysql2/promise');
const path = require('path');
const os = require('os');
const fs = require('fs');
require('dotenv').config();

const isProduction = !!(process.env.VERCEL || process.env.NODE_ENV === 'production');

// Public Cloud Database Connection String or Environment Variables
// Supports PlanetScale, Railway, Aiven, Supabase, and AWS RDS
const dbUrl = process.env.DATABASE_URL || process.env.MYSQL_URL;

let sequelize;
let dialect = process.env.DB_DIALECT || 'mysql';
let host = process.env.DB_HOST || 'localhost';
let port = process.env.DB_PORT || 3306;
let user = process.env.DB_USER || 'root';
let password = process.env.DB_PASS || process.env.DB_PASSWORD || '';
let database = process.env.DB_NAME || 'expense_tracker_db';

const tempDir = os.tmpdir();
const sqliteStoragePath = isProduction
  ? path.join(tempDir, 'finvista_production.sqlite')
  : path.join(__dirname, '../database.sqlite');

if (dbUrl) {
  console.log('[Database] Initializing via cloud DATABASE_URL connection string...');
  sequelize = new Sequelize(dbUrl, {
    logging: false,
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
    dialectOptions: {
      ssl: process.env.DB_SSL === 'false' ? false : {
        require: true,
        rejectUnauthorized: false
      }
    },
    define: { timestamps: true, underscored: true }
  });
  dialect = sequelize.getDialect();
} else {
  // If running in cloud production (Vercel) without external cloud DB credentials, default to SQLite in temp storage
  if (isProduction && (host === 'localhost' || !process.env.DB_HOST)) {
    dialect = 'sqlite';
  }

  if (dialect === 'mysql') {
    console.log(`[Database] Configuring MySQL -> Host: ${host}:${port}, User: ${user}, Database: ${database}`);
    sequelize = new Sequelize(database, user, password, {
      host: host,
      port: port,
      dialect: 'mysql',
      logging: false,
      pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
      dialectOptions: {
        ssl: process.env.DB_SSL === 'true' ? {
          require: true,
          rejectUnauthorized: false
        } : false
      },
      define: { timestamps: true, underscored: true }
    });
  } else {
    console.log(`[Database] Configuring SQLite Cloud Storage -> ${sqliteStoragePath}`);
    if (!fs.existsSync(path.dirname(sqliteStoragePath))) {
      fs.mkdirSync(path.dirname(sqliteStoragePath), { recursive: true });
    }
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: sqliteStoragePath,
      logging: false,
      define: { timestamps: true, underscored: true }
    });
  }
}

const connectDB = async () => {
  if (dialect === 'mysql' && !dbUrl) {
    try {
      const connection = await mysql.createConnection({
        host, port, user, password, connectTimeout: 4000,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
      });
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
      await connection.end();
      console.log(`[Database] MySQL schema \`${database}\` verified/created.`);

      await sequelize.authenticate();
      console.log(`[Database] Sequelize connected successfully to MySQL host ${host}.`);
    } catch (error) {
      console.warn(`[Database] Cloud MySQL connection attempt failed to ${host} (${error.message}). Swapping to cloud storage fallback...`);
      if (!fs.existsSync(path.dirname(sqliteStoragePath))) {
        fs.mkdirSync(path.dirname(sqliteStoragePath), { recursive: true });
      }
      sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: sqliteStoragePath,
        logging: false,
        define: { timestamps: true, underscored: true }
      });
      await sequelize.authenticate();
      console.log('[Database] Cloud storage database connected successfully.');
    }
  } else {
    await sequelize.authenticate();
    console.log(`[Database] Database connected successfully via ${dialect}.`);
  }
};

module.exports = {
  sequelize,
  connectDB
};

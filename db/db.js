const { Pool } = require("pg");
require("dotenv").config();

const seaDb = new Pool({
    user: process.env.DB_SEA_USER,
    host: process.env.DB_SEA_HOST,
    database: process.env.DB_SEA_NAME,
    password: process.env.DB_SEA_PASSWORD,
    port: process.env.DB_SEA_PORT,
});

const middleDb = new Pool({
    user: process.env.DB_MID_USER,
    host: process.env.DB_MID_HOST,
    database: process.env.DB_MID_NAME,
    password: process.env.DB_MID_PASSWORD,
    port: process.env.DB_MID_PORT,
});

const landDb = new Pool({
    user: process.env.DB_LAND_USER,
    host: process.env.DB_LAND_HOST,
    database: process.env.DB_LAND_NAME,
    password: process.env.DB_LAND_PASSWORD,
    port: process.env.DB_LAND_PORT,
});



module.exports = { seaDb, middleDb, landDb };
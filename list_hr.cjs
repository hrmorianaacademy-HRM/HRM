const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function listHR() {
    try {
        const res = await pool.query(`SELECT email, role, full_name FROM users WHERE role = 'hr'`);
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

listHR();

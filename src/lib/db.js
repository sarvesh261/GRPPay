import pg from 'pg';

const pool = new pg.Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'grppay',
    password: 'Sarveshpsgit261', // Replace with your PostgreSQL password
    port: 5432,
});

// @ts-ignore
export async function query(text, params) {
    try {
        const result = await pool.query(text, params);
        return result;
    } catch (error) {
        console.error('Database Error:', error);
        throw error;
    }
}

export default {
    query
};
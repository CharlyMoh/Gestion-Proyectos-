import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Crear el pool de conexiones usando las variables del archivo .env
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Probar la conexión al iniciar
pool.getConnection()
    .then(connection => {
        console.log('Conexión exitosa a MySQL Workbench');
        connection.release();
    })
    .catch(err => {
        console.error('Error al conectar a la base de datos:', err.message);
    });

export default pool;
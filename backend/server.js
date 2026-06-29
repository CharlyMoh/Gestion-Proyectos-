import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

// Importar la instancia de la Base de Datos y las rutas de los módulos
import db from './config/db.js';
import usuariosRoutes from './routes/usuariosRoutes.js';
import clientesRoutes from './routes/clientesRoutes.js';
import solicitudesRoutes from './routes/solicitudesRoutes.js';
import proyectosRoutes from './routes/proyectosRoutes.js';

// 1. CARGAR VARIABLES DE ENTORNO (Debe ir al principio del flujo ejecutable)
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración obligatoria para emular __dirname en módulos de ECMAScript (ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 2. MIDDLEWARES OBLIGATORIOS
app.use(express.json());

// Servir de forma nativa todos los archivos estáticos del Frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// 3. CONFIGURACIÓN DE LOS ENDPOINTS DE LA API
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/solicitudes', solicitudesRoutes);
app.use('/api/proyectos', proyectosRoutes);
// 4. FUNCIÓN SEMILLA (Optimización: Se ejecuta de manera segura con el entorno ya cargado)
const crearUsuarioSemilla = async () => {
    try {
        // Verificar si ya existe el usuario supervisor administrador
        const [rows] = await db.query('SELECT * FROM usuarios WHERE username = "admin_super"');
        
        if (rows.length === 0) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('super123', salt);

            // Insertamos el catálogo mínimo de áreas primero para proteger la restricción de llave foránea
            await db.query('INSERT IGNORE INTO cat_areas (id_area, nombre_area) VALUES (1, "Administración")');

            // Insertamos el usuario con el hash generado nativamente en Node
            const query = `
                INSERT INTO usuarios (id_usuario, username, password, rol, nombre, apellido_paterno, curp, correo, telefono_1, fecha_contratacion, id_area, nss, fecha_alta_salud, direccion, colonia, municipio, estado, codigo_postal, activo)
                VALUES (1, 'admin_super', ?, 'Supervisor', 'Carlos', 'Ojeda', 'OJEC990101HDFLLL01', 'carlos@sistema.com', '2221234567', '2026-01-15', 1, '12345678901', '2026-01-16', 'Av. Benito Juárez 123', 'Centro', 'Puebla', 'Puebla', '72000', 1)
            `;
            await db.query(query, [hashedPassword]);
            console.log('👤 Usuario semilla "admin_super" verificado/creado con éxito desde Node.js.');
        }
    } catch (error) {
        console.error('Error al verificar/crear el usuario semilla:', error.message);
    }
};

// 5. INICIAR EL ESCUCHA DEL SERVIDOR
app.listen(PORT, async () => {
    console.log(`Servidor levantado perfectamente en http://localhost:${PORT}`);
    
    // Una vez que el servidor está arriba y conectado al entorno, disparamos la verificación de la BD
    await crearUsuarioSemilla();
});
import db from '../config/db.js';
import bcrypt from 'bcryptjs';

// 1. OBTENER USUARIOS (Con criterios de filtrado robustos)
// LISTAR USUARIOS CON FILTRADO CRUZADO ROBUSTO (Buscador, Área y Estado)
export const getUsuarios = async (req, res) => {
    try {
        // 1. Extraer los parámetros que manda el Frontend como Query Strings
        const { busqueda, id_area, estado } = req.query;

        // 2. Base de la consulta con el INNER JOIN correspondiente
        let query = `
            SELECT u.id_usuario, u.username, u.rol, u.nombre, u.apellido_paterno, u.apellido_materno,
                   u.curp, u.correo, u.telefono_1, u.telefono_2, u.fecha_contratacion, u.id_area,
                   u.direccion, u.colonia, u.municipio, u.estado, u.codigo_postal, u.nss, u.fecha_alta_salud,
                   a.nombre_area
            FROM usuarios u
            INNER JOIN cat_areas a ON u.id_area = a.id_area
            WHERE u.activo = 1
        `;
        const params = [];

        // 3. FILTRO A: Por caja de texto (Nombre, Apellido o CURP)
        if (busqueda && busqueda.trim() !== '') {
            // Usamos CONCAT_WS para unir virtualmente los campos con un espacio intermedio
            query += ` AND (
                CONCAT_WS(' ', u.nombre, u.apellido_paterno, u.apellido_materno) LIKE ? 
                OR u.curp LIKE ? 
                OR u.username LIKE ?
            )`;
            
            const value = `%${busqueda.trim()}%`;
            params.push(value, value, value);
        }

        // 4. FILTRO B: Por Área de contratación (Llave foránea numérica)
        if (id_area && id_area !== '') {
            query += ` AND u.id_area = ?`;
            params.push(Number(id_area)); // Forzamos que entre como entero numérico
        }

        // 5. FILTRO C: Por Estado federativo dinámico
        if (estado && estado !== '') {
            query += ` AND u.estado = ?`;
            params.push(estado);
        }

        // Ordenar siempre por los ingresos más recientes
        query += ` ORDER BY u.id_usuario DESC`;

        // 6. Ejecutar la consulta pasando el array de parámetros limpios
        const [rows] = await db.query(query, params);
        
        // Enviamos la respuesta limpia en un array JSON
        res.json(rows);

    } catch (error) {
        console.error("Error crítico en getUsuarios:", error);
        res.status(500).json({ mensaje: 'Error al consultar el personal con filtros', error: error.message });
    }
};

// 2. CREAR USUARIO (Alta)
export const createUsuario = async (req, res) => {
    try {
        const {
            username, password, rol, nombre, apellido_paterno, apellido_materno,
            curp, correo, telefono_1, telefono_2, fecha_contratacion, id_area,
            nss, fecha_alta_salud, direccion, colonia, municipio, estado, codigo_postal
        } = req.body;

        // 1. BLINDAJE DE CAMPOS OPCIONALES
        // Es mejor convertirlos a NULL para que MySQL no guarde textos vacíos.
        const limpioApellidoMaterno = apellido_materno?.trim() || null;
        const limpioTelefono2 = telefono_2?.trim() || null;

        // 2. ENCRIPTAR CONTRASEÑA
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const query = `
            INSERT INTO usuarios (username, password, rol, nombre, apellido_paterno, apellido_materno,
                curp, correo, telefono_1, telefono_2, fecha_contratacion, id_area,
                nss, fecha_alta_salud, direccion, colonia, municipio, estado, codigo_postal)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await db.query(query, [
            username.trim(), 
            hashedPassword, 
            rol, 
            nombre.trim(), 
            apellido_paterno.trim(), 
            limpioApellidoMaterno,
            curp.trim().toUpperCase(), 
            correo.trim(), 
            telefono_1.trim(), 
            limpioTelefono2, 
            fecha_contratacion, 
            Number(id_area), // Nos aseguramos doblemente de que entre como un entero a la FK
            nss.trim(), 
            fecha_alta_salud, 
            direccion.trim(), 
            colonia, 
            municipio, 
            estado, 
            codigo_postal
        ]);

        res.status(201).json({ mensaje: 'Colaborador dado de alta exitosamente en el sistema.' });

    } catch (error) {
        // 3. CAPTURA INTELIGENTE DE DUPLICADOS (Evita romper el servidor con Error 500)
        if (error.code === 'ER_DUP_ENTRY') {
            const mensajeError = error.message.toLowerCase();
            
            if (mensajeError.includes('username')) {
                return res.status(400).json({ mensaje: 'El nombre de usuario ya está ocupado por otro miembro del personal.' });
            }
            if (mensajeError.includes('curp')) {
                return res.status(400).json({ mensaje: 'La CURP ingresada ya se encuentra registrada en el sistema.' });
            }
            if (mensajeError.includes('correo')) {
                return res.status(400).json({ mensaje: 'Este correo electrónico ya está asignado a otro usuario.' });
            }
            
            return res.status(400).json({ mensaje: 'Clave o registro duplicado en la base de datos.' });
        }

        // Si es otro tipo de error (ej. desconexión o fallo crítico), arrojamos el 500
        res.status(500).json({ mensaje: 'Error interno al procesar el alta del usuario', error: error.message });
    }
};

// 3. ELIMINACIÓN LÓGICA (Requiere Validación de Supervisor en sitio)
export const eliminarUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { super_username, super_password } = req.body; 

        if (!super_username || !super_password) {
            return res.status(400).json({ mensaje: 'Se requiere autorización de un supervisor' });
        }

        // Buscar al supervisor en la base de datos
        const [users] = await db.query('SELECT * FROM usuarios WHERE username = ? AND activo = 1', [super_username]);
        const supervisor = users[0];

        if (!supervisor || supervisor.rol !== 'Supervisor') {
            return res.status(403).json({ mensaje: 'El usuario autorizador no existe o no es Supervisor' });
        }

        // Validar contraseña del supervisor
        const esValida = await bcrypt.compare(super_password, supervisor.password);
        if (!esValida) {
            return res.status(401).json({ mensaje: 'Contraseña de supervisor incorrecta' });
        }

        // Si la validación pasa, procedemos al borrado lógico (activo = 0)
        await db.query('UPDATE usuarios SET activo = 0 WHERE id_usuario = ?', [id]);

        res.json({ mensaje: 'Usuario eliminado lógicamente con éxito bajo supervisión' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al eliminar el usuario', error: error.message });
    }
};

// 4. LOGIN DE USUARIOS
export const loginUsuario = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Verificar si el usuario existe y está activo
        const [rows] = await db.query('SELECT * FROM usuarios WHERE username = ? AND activo = 1', [username]);
        const usuario = rows[0];

        if (!usuario) {
            return res.status(401).json({ mensaje: 'Credenciales incorrectas (Usuario no encontrado)' });
        }
        console.log("Contraseña de formulario:", password);
        console.log("Hash de la base de datos:", usuario.password);

        // Validar la contraseña encriptada
        const passwordValido = await bcrypt.compare(password, usuario.password);
        if (!passwordValido) {
            return res.status(401).json({ mensaje: 'Credenciales incorrectas (Contraseña errónea)' });
        }

        // Responder con los datos de sesión básicos
        res.json({
            mensaje: '¡Bienvenido al sistema!',
            usuario: {
                id_usuario: usuario.id_usuario,
                username: usuario.username,
                nombre: `${usuario.nombre} ${usuario.apellido_paterno}`,
                rol: usuario.rol
            }
        });

    } catch (error) {
        res.status(500).json({ mensaje: 'Error en el proceso de login', error: error.message });
    }
};

// OBTENER LA LISTA DE ESTADOS ÚNICOS DONDE HAY USUARIOS REGISTRADOS
export const getEstadosUsuariosActivos = async (req, res) => {
    try {
        const query = `
            SELECT DISTINCT estado 
            FROM usuarios 
            WHERE activo = 1 AND estado IS NOT NULL AND estado != ''
            ORDER BY estado ASC
        `;
        const [rows] = await db.query(query);
        const listaEstados = rows.map(row => row.estado);
        res.json(listaEstados);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al consultar los estados de nómina', error: error.message });
    }
};

// OBTENER TODAS LAS ÁREAS ACTIVAS DESDE LA BASE DE DATOS
export const getAreas = async (req, res) => {
    try {
        // Consultamos las columnas clave de tu tabla cat_areas
        const query = 'SELECT id_area, nombre_area FROM cat_areas ORDER BY nombre_area ASC';
        const [rows] = await db.query(query);
        
        // Respondemos con el array completo de filas de MySQL
        res.json(rows);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al consultar el catálogo de áreas', error: error.message });
    }
};
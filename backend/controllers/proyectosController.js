import db from '../config/db.js';

// 1. LISTAR PROYECTOS
const getProyectos = async (req, res) => {
    try {
        // 1. Extraemos los filtros normales + los datos de la sesión del solicitante
        const { busqueda, estatus, usuario_rol, usuario_id } = req.query;

        let query = `
            SELECT p.*, 
                   c.razon_social AS cliente_nombre,
                   CONCAT(u.nombre, ' ', u.apellido_paterno) AS lider_nombre
            FROM proyectos p
            INNER JOIN clientes c ON p.id_cliente = c.id_cliente
            INNER JOIN usuarios u ON p.id_usuario_asignado = u.id_usuario
            WHERE p.activo = 1
        `;
        const params = [];

        // Si es Operador, forzamos que el query solo traiga donde sea el líder asignado.
        // Si es Supervisor, el 'if' se ignora y se mantiene la visión macro total.
        if (usuario_rol === 'Operador') {
            query += ` AND p.id_usuario_asignado = ?`;
            params.push(Number(usuario_id));
        }

        // 3. Filtros dinámicos de búsqueda tradicionales
        if (busqueda && busqueda.trim() !== '') {
            query += ` AND p.nombre_proyecto LIKE ?`;
            params.push(`%${busqueda.trim()}%`);
        }

        if (estatus && estatus !== '') {
            query += ` AND p.estatus = ?`;
            params.push(estatus);
        }

        query += ` ORDER BY p.id_proyecto DESC`;

        const [rows] = await db.query(query, params);
        res.json(rows);

    } catch (error) {
        res.status(500).json({ mensaje: 'Error seguro al consultar proyectos', error: error.message });
    }
};

// 2. REGISTRAR PROYECTO
const createProyecto = async (req, res) => {
    try {
        const { nombre_proyecto, descripcion, fecha_inicio, fecha_entrega, estatus, id_cliente, id_usuario_asignado } = req.body;
        const query = `INSERT INTO proyectos (nombre_proyecto, descripcion, fecha_inicio, fecha_entrega, estatus, id_cliente, id_usuario_asignado) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        await db.query(query, [nombre_proyecto, descripcion, fecha_inicio, fecha_entrega, estatus, id_cliente, id_usuario_asignado]);
        res.status(201).json({ mensaje: 'Proyecto de software asignado y guardado correctamente.' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al registrar el proyecto', error: error.message });
    }
};

// 3. ELIMINAR PROYECTO
const eliminarProyecto = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('UPDATE proyectos SET activo = 0 WHERE id_proyecto = ?', [id]);
        res.json({ mensaje: 'Proyecto archivado y dado de baja del sistema con éxito.' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al archivar el proyecto', error: error.message });
    }
};

// 4. ACTUALIZAR ESTATUS (El que estaba marcando undefined)
const actualizarEstatusProyecto = async (req, res) => {
    try {
        const { id } = req.params;
        const { estatus } = req.body;

        const estatusValidos = ['Planeación', 'En Progreso', 'En Pruebas', 'Suspendido', 'Entregado'];
        if (!estatusValidos.includes(estatus)) {
            return res.status(400).json({ mensaje: 'El estatus proporcionado no es válido para el ciclo TI.' });
        }

        const query = 'UPDATE proyectos SET estatus = ? WHERE id_proyecto = ?';
        await db.query(query, [estatus, id]);

        res.json({ mensaje: `El estado del proyecto se ha actualizado con éxito a: "${estatus}".` });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al actualizar el estatus en la base de datos', error: error.message });
    }
};

export default {
    getProyectos,
    createProyecto,
    eliminarProyecto,
    actualizarEstatusProyecto
};
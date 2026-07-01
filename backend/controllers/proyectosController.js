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
// ELIMINAR PROYECTO DIRECTO O CREAR PETICIÓN DE REVISIÓN SEGÚN ROL
export const eliminarProyecto = async (req, res) => {
    const { id } = req.params; // ID del proyecto enviado en la URL
    const { usuario_rol, usuario_id } = req.body; // Parámetros de sesión enviados en el body

    try {
        // CASO A: SI ES SUPERVISOR -> Borrado lógico inmediato en MySQL
        if (usuario_rol === 'Supervisor') {
            const queryBorrado = 'UPDATE proyectos SET activo = 0 WHERE id_proyecto = ?';
            await db.query(queryBorrado, [id]);
            return res.json({ status: 'success', mensaje: 'Proyecto dado de baja del sistema directamente.' });
        }

        // CASO B: SI ES OPERADOR -> Se genera una solicitud de autorización
        // 1. Validamos que no exista ya una solicitud de baja pendiente para este mismo proyecto
        const [existe] = await db.query(
            'SELECT id_solicitud FROM solicitudes_baja WHERE id_proyecto = ? AND estatus = "Pendiente"',
            [id]
        );

        if (existe.length > 0) {
            return res.status(400).json({ mensaje: 'Ya hay una solicitud de baja en revisión para este proyecto.' });
        }

        // 2. Insertamos la petición apuntando al id_proyecto correspondiente
        const querySolicitud = `
            INSERT INTO solicitudes_baja (id_proyecto, id_usuario_solicita, estatus)
            VALUES (?, ?, 'Pendiente')
        `;
        await db.query(querySolicitud, [id, usuario_id]);

        res.json({ 
            status: 'pending', 
            mensaje: 'Acción restringida. Se ha enviado una solicitud de autorización al Supervisor.' 
        });

    } catch (error) {
        res.status(500).json({ mensaje: 'Error en el flujo de autorización', error: error.message });
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
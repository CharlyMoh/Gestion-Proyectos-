import db from '../config/db.js';

// 1. CREAR UNA NUEVA SOLICITUD DE BAJA
export const registrarSolicitud = async (req, res) => {
    try {
        const { id_cliente, id_usuario_solicita } = req.body;

        if (!id_cliente || !id_usuario_solicita) {
            return res.status(400).json({ mensaje: 'Datos incompletos para generar la solicitud.' });
        }

        // Verificar si ya existe una solicitud pendiente para este cliente
        const [existe] = await db.query(
            'SELECT * FROM solicitudes_baja WHERE id_cliente = ? AND estatus = "Pendiente"', 
            [id_cliente]
        );
        
        if (existe.length > 0) {
            return res.status(400).json({ mensaje: 'Ya existe una solicitud de baja pendiente para este cliente.' });
        }

        await db.query(
            'INSERT INTO solicitudes_baja (id_cliente, id_usuario_solicita) VALUES (?, ?)',
            [id_cliente, id_usuario_solicita]
        );

        res.status(201).json({ mensaje: 'Solicitud de baja enviada al Supervisor con éxito.' });
        
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al procesar la solicitud', error: error.message });
    }
};

// 2. OBTENER SOLICITUDES PENDIENTES (Con cruce de datos híbrido para Clientes y Proyectos)
export const getSolicitudesPendientes = async (req, res) => {
    try {
        const { id_usuario, rol } = req.query;
        
        let query = `
            SELECT 
                s.id_solicitud, s.fecha_solicitud, s.estatus, s.id_proyecto,
                c.id_cliente, c.razon_social, c.rfc,
                p.nombre_proyecto,
                u.nombre AS operador_nombre, u.username AS operador_username
            FROM solicitudes_baja s
            LEFT JOIN clientes c ON s.id_cliente = c.id_cliente
            LEFT JOIN proyectos p ON s.id_proyecto = p.id_proyecto
            INNER JOIN usuarios u ON s.id_usuario_solicita = u.id_usuario
            WHERE s.estatus = 'Pendiente'
        `;
        const params = [];

        // 🔒 CANDADO DE SEGURIDAD INTERNO (Independiente de mayúsculas/minúsculas)
        if (rol && rol.trim().toLowerCase() === 'operador' && id_usuario) {
            query += ` AND s.id_usuario_solicita = ?`;
            params.push(id_usuario);
        }

        query += ` ORDER BY s.fecha_solicitud ASC`;
        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener solicitudes pendientes', error: error.message });
    }
};

// 3. OBTENER HISTORIAL DE SOLICITUDES (Corregido para excluir las pendientes)
export const getHistorialSolicitudes = async (req, res) => {
    try {
        const { id_usuario, rol } = req.query;
        
        let query = `
            SELECT 
                s.id_solicitud, s.fecha_solicitud, s.estatus, s.id_proyecto,
                c.id_cliente, c.razon_social, c.rfc,
                p.nombre_proyecto,
                u.nombre AS operador_nombre, u.username AS operador_username
            FROM solicitudes_baja s
            LEFT JOIN clientes c ON s.id_cliente = c.id_cliente
            LEFT JOIN proyectos p ON s.id_proyecto = p.id_proyecto
            INNER JOIN usuarios u ON s.id_usuario_solicita = u.id_usuario
            WHERE s.estatus != 'Pendiente'
        `;
        const params = [];

        // 🔒 CANDADO DE SEGURIDAD INTERNO (Independiente de mayúsculas/minúsculas)
        if (rol && rol.trim().toLowerCase() === 'operador' && id_usuario) {
            query += ` AND s.id_usuario_solicita = ?`;
            params.push(id_usuario);
        }

        query += ` ORDER BY s.fecha_solicitud DESC`;
        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al consultar el historial de solicitudes', error: error.message });
    }
};

// 4. RESOLVER SOLICITUD (Aceptar o Rechazar)
export const resolverSolicitud = async (req, res) => {
    const connection = await db.getConnection(); // Usamos transacción para asegurar consistencia
    try {
        const { id } = req.params; // ID de la solicitud
        const { accion } = req.body; // 'Aceptada' o 'Rechazada'

        if (!['Aceptada', 'Rechazada'].includes(accion)) {
            return res.status(400).json({ mensaje: 'Acción inválida.' });
        }

        await connection.beginTransaction();

        // 1. Actualizar el estado de la solicitud
        await connection.query(
            'UPDATE solicitudes_baja SET estatus = ? WHERE id_solicitud = ?',
            [accion, id]
        );

        // 2. Si fue aceptada, ejecutar el borrado lógico del cliente vinculado
        if (accion === 'Aceptada') {
            // Conseguir primero el id_cliente de esa solicitud
            const [solicitud] = await connection.query('SELECT id_cliente FROM solicitudes_baja WHERE id_solicitud = ?', [id]);
            const id_cliente = solicitud[0].id_cliente;

            await connection.query('UPDATE clientes SET activo = 0 WHERE id_cliente = ?', [id_cliente]);
        }

        await connection.commit();
        res.json({ mensaje: `Solicitud procesada y ${accion} correctamente.` });

    } catch (error) {
        await connection.rollback();
        res.status(500).json({ mensaje: 'Error al resolver la solicitud', error: error.message });
    } finally {
        connection.release();
    }
};

// PROCESAR APROBACIÓN DE LA BANDEJA (Clic a la Palomita Verde)
export const aprobarSolicitud = async (req, res) => {
    const { id } = req.params; // ID de la solicitud de baja

    try {
        // 1. Consultamos los datos de la solicitud para saber qué registro impactar
        const [solicitud] = await db.query(
            'SELECT id_cliente, id_proyecto FROM solicitudes_baja WHERE id_solicitud = ?',
            [id]
        );

        if (solicitud.length === 0) {
            return res.status(404).json({ mensaje: 'La solicitud no existe en el sistema.' });
        }

        const { id_cliente, id_proyecto } = solicitud[0];

        // 2. EVALUACIÓN CONDICIONAL DE IMPACTO MÁSTER
        if (id_proyecto) {
            // Si la solicitud tiene id_proyecto, hacemos el borrado lógico del proyecto asignado
            await db.query('UPDATE proyectos SET activo = 0 WHERE id_proyecto = ?', [id_proyecto]);
        } else if (id_cliente) {
            // Si tiene id_cliente, ejecuta el borrado tradicional de clientes
            await db.query('UPDATE clientes SET activo = 0 WHERE id_cliente = ?', [id_cliente]);
        }

        // 3. Cambiamos el estado de la solicitud a 'Aceptada' para moverla al historial
        await db.query('UPDATE solicitudes_baja SET estatus = "Aceptada" WHERE id_solicitud = ?', [id]);

        res.json({ mensaje: 'Solicitud autorizada y registro actualizado con éxito.' });

    } catch (error) {
        res.status(500).json({ mensaje: 'Error al ejecutar la baja en cascada', error: error.message });
    }
};
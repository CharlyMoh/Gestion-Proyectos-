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

// 2. OBTENER SOLICITUDES PENDIENTES (Con cruce de datos de Clientes y Usuarios)
export const getSolicitudesPendientes = async (req, res) => {
    try {
        const { id_usuario, rol } = req.query; // Recibimos el contexto del usuario actual
        
        let query = `
            SELECT s.id_solicitud, s.fecha_solicitud, s.estatus,
            c.id_cliente, c.razon_social, c.rfc,
            u.nombre AS operador_nombre, u.username AS operador_username
            FROM solicitudes_baja s
            INNER JOIN clientes c ON s.id_cliente = c.id_cliente
            INNER JOIN usuarios u ON s.id_usuario_solicita = u.id_usuario
            WHERE s.estatus = 'Pendiente'
        `;
        const params = [];

        // Si es Operador, blindamos la consulta para que solo vea las suyas
        if (rol === 'Operador' && id_usuario) {
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

// 3. NUEVO: OBTENER HISTORIAL DE SOLICITUDES (Todas: Pendientes, Aceptadas y Rechazadas)
export const getHistorialSolicitudes = async (req, res) => {
    try {
        const { id_usuario, rol } = req.query;
        
        let query = `
            SELECT s.id_solicitud, s.fecha_solicitud, s.estatus,
            c.id_cliente, c.razon_social, c.rfc,
            u.nombre AS operador_nombre, u.username AS operador_username
            FROM solicitudes_baja s
            INNER JOIN clientes c ON s.id_cliente = c.id_cliente
            INNER JOIN usuarios u ON s.id_usuario_solicita = u.id_usuario
        `;
        const params = [];

        // Si es Operador, el historial también se limita a sus acciones
        if (rol === 'Operador' && id_usuario) {
            query += ` WHERE s.id_usuario_solicita = ?`;
            params.push(id_usuario);
        }

        query += ` ORDER BY s.fecha_solicitud DESC`; // Los movimientos más nuevos primero
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
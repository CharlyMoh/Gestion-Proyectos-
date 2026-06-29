import db from '../config/db.js';
import bcrypt from 'bcryptjs';

// 1. OBTENER Y FILTRAR CLIENTES ACTIVOS
export const getClientes = async (req, res) => {
    try {
        const { busqueda, estado } = req.query;
        
        // Base de la consulta: Solo jalar clientes comerciales con borrado lógico activo (1)
        let query = `SELECT * FROM clientes WHERE activo = 1`;
        const params = [];

        // Filtro por búsqueda predictiva (Razón Social o RFC)
        if (busqueda) {
            query += ` AND (razon_social LIKE ? OR rfc LIKE ?)`;
            const queryBusqueda = `%${busqueda}%`;
            params.push(queryBusqueda, queryBusqueda);
        }

        // Filtro por Entidad Federativa (Estado)
        if (estado) {
            query += ` AND estado = ?`;
            params.push(estado);
        }

        // Ordenar por los más recientes primero
        query += ` ORDER BY fecha_registro DESC`;

        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al consultar el catálogo de clientes', error: error.message });
    }
};

// 2. REGISTRAR NUEVO CLIENTE (Alta Comercial)
export const createCliente = async (req, res) => {
    try {
        const {
            razon_social, rfc, contacto_principal, correo,
            telefono_1, telefono_2, direccion, colonia,
            municipio, estado, codigo_postal
        } = req.body;

        const query = `
            INSERT INTO clientes (razon_social, rfc, contacto_principal, correo,
                telefono_1, telefono_2, direccion, colonia, municipio, estado, codigo_postal)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await db.query(query, [
            razon_social, rfc, contacto_principal, correo,
            telefono_1, telefono_2, direccion, colonia,
            municipio, estado, codigo_postal
        ]);

        res.status(201).json({ mensaje: 'Cliente mercantil registrado exitosamente en el sistema' });
    } catch (error) {
        // Manejo elegante si intentan duplicar un RFC único
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ mensaje: 'El RFC ingresado ya se encuentra asignado a otra empresa registrada.' });
        }
        res.status(500).json({ mensaje: 'Error al registrar el cliente en la base de datos', error: error.message });
    }
};

// 3. ELIMINACIÓN LÓGICA (Requiere Validación Forzosa de Supervisor en Sitio)
export const eliminarCliente = async (req, res) => {
    try {
        const { id } = req.params;
        const { super_username, super_password } = req.body;

        // Validar que hayan llegado campos en el cuerpo de la petición
        if (!super_username || !super_password) {
            return res.status(400).json({ mensaje: 'Operación denegada. Se requiere la autorización de un Supervisor.' });
        }

        // Buscar las credenciales del supervisor autorizador en la BD
        const [users] = await db.query('SELECT * FROM usuarios WHERE username = ? AND activo = 1', [super_username]);
        const supervisor = users[0];

        // Validar existencia y jerarquía del rol
        if (!supervisor || supervisor.rol !== 'Supervisor') {
            return res.status(403).json({ mensaje: 'El usuario ingresado no existe o no cuenta con privilegios de Supervisor.' });
        }

        // Desencriptar y comparar la contraseña ingresada en el prompt con la de la BD
        const esValida = await bcrypt.compare(super_password, supervisor.password);
        if (!esValida) {
            return res.status(401).json({ mensaje: 'Contraseña de supervisor incorrecta. Acción cancelada.' });
        }

        // Si la seguridad pasa la auditoría en sitio, se procede al borrado lógico (activo = 0)
        await db.query('UPDATE clientes SET activo = 0 WHERE id_cliente = ?', [id]);

        res.json({ mensaje: 'Cliente dado de baja comercial con éxito bajo supervisión autorizada' });
    } catch (error) {
        res.status(500).json({ mensaje: 'Error en el proceso de baja del cliente', error: error.message });
    }
};

export const getEstadosClientesActivos = async (req, res) => {
    try {
        const query = `
            SELECT DISTINCT estado 
            FROM clientes 
            WHERE activo = 1 AND estado IS NOT NULL AND estado != ''
            ORDER BY estado ASC
        `;
        const [rows] = await db.query(query);
        const listaEstados = rows.map(row => row.estado);
        res.json(listaEstados);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al consultar los estados de clientes', error: error.message });
    }
};
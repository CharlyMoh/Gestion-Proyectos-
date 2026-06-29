import express from 'express';
import { getClientes, createCliente, eliminarCliente } from '../controllers/clientesController.js';

const router = express.Router();

// 1. Ruta para listar y filtrar clientes (GET /api/clientes)
router.get('/', getClientes);

// 2. Ruta para registrar un nuevo cliente (POST /api/clientes)
router.post('/', createCliente);

// 3. Ruta para baja comercial supervisada (POST /api/clientes/eliminar/:id)
router.post('/eliminar/:id', eliminarCliente);

export default router;
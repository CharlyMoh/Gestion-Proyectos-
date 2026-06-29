import express from 'express';
import proyectosController from '../controllers/proyectosController.js'; 

const router = express.Router();

// Mapeo limpio llamando a las propiedades del objeto controlador
router.get('/', proyectosController.getProyectos);
router.post('/', proyectosController.createProyecto);
router.post('/eliminar/:id', proyectosController.eliminarProyecto);
router.put('/actualizar-estatus/:id', proyectosController.actualizarEstatusProyecto);

export default router;
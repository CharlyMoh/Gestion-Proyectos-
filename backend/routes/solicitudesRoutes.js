import express from 'express';
import { registrarSolicitud, getSolicitudesPendientes, getHistorialSolicitudes ,resolverSolicitud } from '../controllers/solicitudesController.js';

const router = express.Router();

router.post('/solicitar', registrarSolicitud);
router.get('/pendientes', getSolicitudesPendientes);
router.get('/historial', getHistorialSolicitudes);
router.post('/resolver/:id', resolverSolicitud);

export default router;
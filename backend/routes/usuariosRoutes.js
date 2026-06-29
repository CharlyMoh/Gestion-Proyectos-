import express from 'express';
import db from '../config/db.js';
import https from 'https';
import { getUsuarios, createUsuario, eliminarUsuario, loginUsuario, getEstadosUsuariosActivos } from '../controllers/usuariosController.js';

const router = express.Router();

// 1. Ruta para listar y filtrar usuarios
router.get('/', getUsuarios);

// 2. Ruta para registrar un usuario
router.post('/', createUsuario);

router.get('/estados-activos', getEstadosUsuariosActivos);
// 3. Ruta para eliminación (Recibe el ID por parámetro y las credenciales por BODY)
router.post('/eliminar/:id', eliminarUsuario);

// 4. Ruta para el login de usuarios
router.post('/login', loginUsuario);

// 5. Endpoint rápido para obtener el catálogo de áreas en el formulario de usuarios
router.get('/areas', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM cat_areas');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al obtener áreas', error: error.message });
    }
});

// 6.ENDPOINT PROXY CON EL DOMINIO Y RUTA CORRECTOS DE POSTALI.APP (100% GRATUITO)
router.get('/postali/:cp', (req, res) => {
    const { cp } = req.params;

    const opcionesHttp = {
        hostname: 'postali.app', // 👈 CORREGIDO: El dominio real de la documentación
        path: `/api/v1/mx/cp/${cp}`, // 👈 CORREGIDO: Incluye /api/v1/mx/
        method: 'GET',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json'
        }
    };

    https.get(opcionesHttp, (respuestaPostali) => {
        let datos = '';

        respuestaPostali.on('data', (chunk) => {
            datos += chunk;
        });

        respuestaPostali.on('end', () => {
            try {
                if (respuestaPostali.statusCode !== 200) {
                    console.log(`⚠️ Servidor Postali respondió con estatus: ${respuestaPostali.statusCode}`);
                    return res.status(respuestaPostali.statusCode).json({ 
                        mensaje: 'Código Postal no encontrado en el catálogo oficial de Postali.' 
                    });
                }

                const jsonParseado = JSON.parse(datos);
                res.json(jsonParseado); // Entregar los datos reales y frescos al frontend
            } catch (error) {
                res.status(500).json({ mensaje: 'Error al procesar la respuesta del servidor externo', error: error.message });
            }
        });

    }).on('error', (err) => {
        res.status(500).json({ mensaje: 'Error de conexión física con el servidor externo', error: err.message });
    });
});

export default router;
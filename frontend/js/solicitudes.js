let pestañaActiva = 'pendientes'; // Estado global del módulo: 'pendientes' o 'historial'

export async function initSolicitudes() {
    console.log("Inicializando módulo de solicitudes segmentado...");

    pestañaActiva = 'pendientes'; // Resetear al entrar al módulo
    await listarSolicitudes();

    // Configurar los escuchadores de eventos para los botones de las pestañas
    const botonesTabs = document.querySelectorAll('.tab-btn');
    botonesTabs.forEach(boton => {
        boton.addEventListener('click', async (e) => {
            // Quitar clase activa a todos y ponérsela al seleccionado
            botonesTabs.forEach(b => b.classList.remove('tab-activa'));
            const tabSeleccionada = e.currentTarget;
            tabSeleccionada.classList.add('tab-activa');

            // Actualizar estado y refrescar tabla
            pestañaActiva = tabSeleccionada.getAttribute('data-tab');
            await listarSolicitudes();
        });
    });
}

async function listarSolicitudes() {
    const tablaBody = document.getElementById('tabla-solicitudes-body');
    if (!tablaBody) return;

    const sesion = JSON.parse(localStorage.getItem('sesion_usuario')) || {};

    const usuarioId = sesion.id_usuario || sesion.id || 0;
    const usuarioRol = sesion.rol || sesion.role || 'Operador';

    try {
        const endpoint = pestañaActiva === 'pendientes'
        ? '/api/solicitudes/pendientes'
        : '/api/solicitudes/historial';

        // Mandamos las variables blindadas en la Query String
        const url = `${endpoint}?id_usuario=${usuarioId}&rol=${usuarioRol}`;

        const respuesta = await fetch(url);
        const solicitudes = await respuesta.json();

        tablaBody.innerHTML = '';

        if (solicitudes.length === 0) {
            const mensaje = pestañaActiva === 'pendientes'
                ? 'No hay solicitudes pendientes.'
                : 'No hay solicitudes en el historial.';

            tablaBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">
                        ${mensaje}
                    </td>
                </tr>
            `;
            return;
        }
        solicitudes.forEach(sol => {

            const tr = document.createElement('tr');
            const fSolicitud = new Date(sol.fecha_solicitud).toLocaleDateString('es-MX');

            // Determinar tipo en caliente
            const esProyecto = sol.id_proyecto ? true : false;

            // 1. Configurar el Badge de Estatus gráfico
            let badge = `
        <span class="badge-status" style="background:#fef3c7;color:#d97706;padding:3px 8px;border-radius:12px;font-size:.78rem;font-weight:600;">
            <i class="bi bi-clock-history"></i> ${sol.estatus}
        </span>
    `;

            if (sol.estatus === 'Aceptada' || sol.estatus === 'Aprobada') {
                badge = `
            <span class="badge-status badge-activa badge-aceptada">
                <i class="bi bi-check-circle-fill"></i> ${sol.estatus}
            </span>
        `;
            } else if (sol.estatus === 'Rechazada') {
                badge = `
            <span class="badge-status badge-activa badge-rechazada">
                <i class="bi bi-x-circle-fill"></i> ${sol.estatus}
            </span>
        `;
            }

            // 2. Configurar la Columna de Acciones (Evitamos duplicar el badge)
            let acciones = ``; 

            // Sólo el Supervisor en la pestaña de PENDIENTES puede interactuar con los botones
            if (pestañaActiva === 'pendientes' && sesion.rol !== 'Operador') {
                acciones = `
            <div style="display:flex;gap:.4rem;align-items:center;justify-content:center;">
                <button class="btn-accion-check btn-aceptar-sol"
                        data-id="${sol.id_solicitud}"
                        title="Aceptar Solicitud">
                    <i class="bi bi-check-lg"></i>
                </button>

                <button class="btn-accion-x btn-rechazar-sol"
                        data-id="${sol.id_solicitud}"
                        title="Rechazar Solicitud">
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>
        `;
            } else if (pestañaActiva === 'historial') {
                // En el historial se ve limpio indicando que ya fue resuelto
                acciones = `<span style="color:gray; font-size:0.8rem;">Ninguna</span>`;
            }

            // 3. ARMADO DE FILA MATEMÁTICO (Alineado 100% con los Th de tu HTML)
            // ... dentro de tu solicitudes.forEach(sol => { ... ) en solicitudes.js

            tr.innerHTML = `
    <!-- Columna 1: Fecha Solicitud -->
    <td><strong>${fSolicitud}</strong></td>

    <!-- Columna 2: Cliente / Registro a Eliminar -->
    <td>
        <strong>${esProyecto ? (sol.nombre_proyecto ?? 'Proyecto TI') : (sol.razon_social ?? 'Cliente Comercial')}</strong>
        <br>
        <small style="color:var(--text-muted); font-size:0.75rem;">
            ${esProyecto ? 'Tipo: Baja de Proyecto' : 'Tipo: Baja de Cliente'}
        </small>
    </td>

    <!-- Columna 3: RFC (¡AHORA 100% DINÁMICO Y COMPLETO!) -->
    <td>
        <strong>${sol.rfc ?? 'Sin RFC'}</strong>
        ${esProyecto
                    ? `<br><small style="color:var(--text-muted); font-size:0.72rem;"></small>`
                    : ''
                }
    </td>

    <!-- Columna 4: Usuario Solicitante -->
    <td>
        <i class="bi bi-person-fill" style="color:var(--text-muted);"></i>
        ${sol.operador_nombre ?? sol.solicitante_nombre ?? 'Samuel'}
    </td>

    <!-- Columna 5: Estatus -->
    <td>${badge}</td>

    <!-- Columna 6: Acción -->
    <td style="text-align:center;">${acciones}</td>
`;
            // Eventos de los botones (Se mantienen intactos e inteligentes)
            const btnAceptar = tr.querySelector('.btn-aceptar-sol');
            if (btnAceptar) {
                btnAceptar.addEventListener('click', (e) => {
                    const id = e.currentTarget.dataset.id;
                    procesarSolicitudBaja(id, 'Aceptada', esProyecto ? 'proyecto' : 'cliente');
                });
            }

            const btnRechazar = tr.querySelector('.btn-rechazar-sol');
            if (btnRechazar) {
                btnRechazar.addEventListener('click', (e) => {
                    const id = e.currentTarget.dataset.id;
                    procesarSolicitudBaja(id, 'Rechazada', esProyecto ? 'proyecto' : 'cliente');
                });
            }

            tablaBody.appendChild(tr);
        });

    } catch (error) {
        tablaBody.innerHTML = `
            <tr>
                <td colspan="6" style="color:var(--danger);text-align:center;padding:1rem;">
                    Error al listar solicitudes: ${error.message}
                </td>
            </tr>
        `;
    }
}

async function procesarSolicitudBaja(id, accion, tipo = 'registro') {
    //  Determinamos dinámicamente el sujeto de la oración según el tipo
    const sujeto = tipo === 'proyecto' ? 'este proyecto tecnológico' : 'este cliente comercial';

    const textoAccion = accion === 'Aceptada' ? `AUTORIZAR la eliminación lógica de ${sujeto}` : 'RECHAZAR la solicitud';

    const resultado = await Swal.fire({
        title: '¿Confirmar decisión?',
        text: `¿Está seguro de que desea ${textoAccion}?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Confirmar',
        cancelButtonText: 'Volver',
        reverseButtons: true,
        customClass: {
            popup: 'swal2-popup-custom', title: 'swal2-title-custom', htmlContainer: 'swal2-html-custom',
            confirmButton: 'swal2-confirm-custom', cancelButton: 'swal2-cancel-custom'
        }
    });

    if (!resultado.isConfirmed) return;

    try {
        const respuesta = await fetch(`/api/solicitudes/resolver/${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accion })
        });

        const data = await respuesta.json();
        if (!respuesta.ok) throw new Error(data.mensaje);

        await Swal.fire({
            title: 'Procesado',
            text: data.mensaje,
            icon: 'success',
            customClass: { popup: 'swal2-popup-custom', title: 'swal2-title-custom', htmlContainer: 'swal2-html-custom', confirmButton: 'swal2-confirm-custom' }
        });

        await listarSolicitudes();

    } catch (error) {
        Swal.fire({
            title: 'Error de operación',
            text: error.message,
            icon: 'error',
            customClass: { popup: 'swal2-popup-custom', title: 'swal2-title-custom', htmlContainer: 'swal2-html-custom', confirmButton: 'swal2-confirm-custom' }
        });
    }
}
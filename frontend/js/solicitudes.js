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

    // Recuperamos la sesión para conocer el Rol e ID del usuario conectado
    const sesion = JSON.parse(localStorage.getItem('sesion_usuario'));
    
    try {
        // Decidir a qué endpoint apuntar según la pestaña activa
        const endpoint = pestañaActiva === 'pendientes' ? '/api/solicitudes/pendientes' : '/api/solicitudes/historial';
        
        // Enviamos el ID y Rol como parámetros Query para que el backend filtre si es Operador
        const url = `${endpoint}?id_usuario=${sesion.id_usuario}&rol=${sesion.rol}`;
        
        const respuesta = await fetch(url);
        const solicitudes = await respuesta.json();

        tablaBody.innerHTML = '';

        if (solicitudes.length === 0) {
            const mensaje = pestañaActiva === 'pendientes' 
                ? 'No hay solicitudes pendientes de revisión.' 
                : 'El historial de solicitudes se encuentra vacío.';
            tablaBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:2rem;">${mensaje}</td></tr>`;
            return;
        }

        solicitudes.forEach(sol => {
            const tr = document.createElement('tr');
            const fecha = new Date(sol.fecha_solicitud).toLocaleString('es-MX');

            // Construcción de la celda final (Acciones o Estatus)
            let celdaAccionEstatus = '';

            // CRITERIO DE RENDERIZADO:
            // Si la pestaña es 'historial' O el usuario logueado es un 'Operador', se muestra FORZOSAMENTE un Badge de estatus fijo
            if (pestañaActiva === 'historial' || sesion.rol === 'Operador') {
                let claseBadge = 'badge-pendiente';
                let iconoBadge = '<i class="bi bi-clock"></i>';

                if (sol.estatus === 'Aceptada') {
                    claseBadge = 'badge-activa badge-aceptada';
                    iconoBadge = '<i class="bi bi-check-circle-fill"></i>';
                } else if (sol.estatus === 'Rechazada') {
                    claseBadge = 'badge-activa badge-rechazada';
                    iconoBadge = '<i class="bi bi-x-circle-fill"></i>';
                }

                celdaAccionEstatus = `
                    <div style="text-align: center;">
                        <span class="badge-status ${claseBadge}">${iconoBadge} ${sol.estatus}</span>
                    </div>
                `;
            } else {
                // Si la pestaña es 'pendientes' Y el usuario es 'Supervisor', mostramos el selector homogéneo de acciones
                celdaAccionEstatus = `
                    <div style="text-align: center;">
                        <select class="select-acciones-p" data-id="${sol.id_solicitud}">
                            <option value="" selected disabled>-- Acciones --</option>
                            <option value="Aceptada">Autorizar eliminación</option>
                            <option value="Rechazada">Rechazar solicitud</option>
                        </select>
                    </div>
                `;
            }

            tr.innerHTML = `
                <td>${fecha}</td>
                <td><strong>${sol.razon_social}</strong></td>
                <td><code style="background:#f1f5f9; padding:2px 6px; border-radius:4px; font-weight:bold;">${sol.rfc}</code></td>
                <td><i class="bi bi-person-circle"></i> ${sol.operador_nombre} (<em>${sol.operador_username}</em>)</td>
                <td>${celdaAccionEstatus}</td>
            `;

            const selectAcciones = tr.querySelector('.select-acciones-p');
            if (selectAcciones) {
                selectAcciones.addEventListener('change', async (e) => {
                    const accion = e.target.value;
                    if (!accion) return;

                    await procesarSolicitudBaja(sol.id_solicitud, accion);
                    e.target.value = '';
                });
            }

            tablaBody.appendChild(tr);
        });

    } catch (error) {
        tablaBody.innerHTML = `<tr><td colspan="5" style="color:var(--danger); text-align:center; padding:1rem;">Error al listar solicitudes: ${error.message}</td></tr>`;
    }
}

async function procesarSolicitudBaja(id, accion) {
    const textoAccion = accion === 'Aceptada' ? 'AUTORIZAR la eliminación lógica' : 'RECHAZAR la solicitud';
    
    const resultado = await Swal.fire({
        title: '¿Confirmar decisión?',
        text: `¿Está seguro de ${textoAccion} de este cliente comercial?`,
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
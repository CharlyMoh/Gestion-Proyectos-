import {exportarA_PDF} from './reportes.js'; // Importación de la función centralizada para exportar a PDF
let proyectosCargados = []; // Variable global para almacenar los proyectos cargados

export async function initProyectos() {
    console.log("Inicializando lógica de Control de Proyectos...");

    // Escuchador del botón PDF
    document.getElementById('btn-pdf-proyectos').addEventListener('click', () => {
        if (proyectosCargados.length === 0) {
            window.Swal.fire({ title: 'Reporte Vacío', text: 'No hay datos en la tabla para exportar.', icon: 'info' });
            return;
        }

        const cabeceras = ["PROYECTO", "CLIENTE COMERCIAL", "LÍDER RESPONSABLE", "FECHA INICIO", "FECHA ENTREGA", "ESTATUS"];
        
        // Mapeamos los datos de los objetos cargados al formato plano de la tabla PDF
        const filas = proyectosCargados.map(p => [
            p.nombre_proyecto,
            p.cliente_nombre,
            p.lider_nombre,
            new Date(p.fecha_inicio).toLocaleDateString('es-MX'),
            new Date(p.fecha_entrega).toLocaleDateString('es-MX'),
            p.estatus
        ]);

        exportarA_PDF("Control de Proyectos Tecnológicos", cabeceras, filas);
    });

    await listarProyectos();

    // Eventos de filtrado en tiempo real
    document.getElementById('buscar-proyecto').addEventListener('input', listarProyectos);
    document.getElementById('filtro-estatus-proyecto').addEventListener('change', listarProyectos);

    const modal = document.getElementById('modal-proyecto');

    // Abrir modal y cargar catálogos dinámicos
    document.getElementById('btn-abrir-modal-proyecto').addEventListener('click', async () => {
        document.getElementById('form-registro-proyecto').reset();
        document.getElementById('error-p-fechas').textContent = '';

        // Cargar los catálogos en los combos antes de mostrar la pantalla
        await cargarComboClientes();
        await cargarComboPersonal();

        modal.classList.add('mostrar');
    });

    const cerrarModal = () => modal.classList.remove('mostrar');
    document.getElementById('btn-cerrar-modal-proyecto').addEventListener('click', cerrarModal);
    document.getElementById('btn-cancelar-proyecto').addEventListener('click', cerrarModal);

    // Validación cruzada de fechas (Fecha entrega no puede ser menor a la de inicio)
    document.getElementById('p-fecha-entrega').addEventListener('blur', () => {
        const inicio = document.getElementById('p-fecha-inicio').value;
        const entrega = document.getElementById('p-fecha-entrega').value;
        const errorFechas = document.getElementById('error-p-fechas');

        errorFechas.textContent = '';
        if (inicio && entrega && new Date(entrega) < new Date(inicio)) {
            errorFechas.textContent = 'La entrega no puede ser anterior al inicio.';
            document.getElementById('p-fecha-entrega').classList.add('input-error');
        } else {
            document.getElementById('p-fecha-entrega').classList.remove('input-error');
        }
    });

    // Envío del Formulario
    document.getElementById('form-registro-proyecto').addEventListener('submit', async (e) => {
        e.preventDefault();

        if (document.querySelectorAll('#modal-proyecto .input-error').length > 0) {
            window.Swal.fire({
                title: 'Campos Inválidos',
                text: 'Corrige las fechas de entrega antes de continuar.',
                icon: 'error',
                customClass: { popup: 'swal2-popup-custom', title: 'swal2-title-custom', confirmButton: 'swal2-confirm-custom' }
            });
            return;
        }

        const nuevoProyecto = {
            nombre_proyecto: document.getElementById('p-nombre').value.trim(),
            descripcion: document.getElementById('p-descripcion').value.trim() || null,
            fecha_inicio: document.getElementById('p-fecha-inicio').value,
            fecha_entrega: document.getElementById('p-fecha-entrega').value,
            estatus: document.getElementById('p-estatus').value,
            id_cliente: Number(document.getElementById('p-id-cliente').value),
            id_usuario_asignado: Number(document.getElementById('p-id-usuario').value)
        };

        try {
            const respuesta = await fetch('/api/proyectos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nuevoProyecto)
            });

            const data = await respuesta.json();
            if (!respuesta.ok) throw new Error(data.mensaje);

            window.Swal.fire({
                title: '¡Proyecto Creado!',
                text: data.mensaje,
                icon: 'success',
                customClass: { popup: 'swal2-popup-custom', title: 'swal2-title-custom', confirmButton: 'swal2-confirm-custom' }
            });

            cerrarModal();
            listarProyectos();

        } catch (error) {
            window.Swal.fire({
                title: 'Error de inserción',
                text: error.message,
                icon: 'error',
                customClass: { popup: 'swal2-popup-custom', title: 'swal2-title-custom', confirmButton: 'swal2-confirm-custom' }
            });
        }
    });
}

// FUNCIONES DE SOPORTE: Carga de Selects Cruzados
async function cargarComboClientes() {
    const select = document.getElementById('p-id-cliente');
    try {
        const res = await fetch('/api/clientes');
        const clientes = await res.json();

        select.innerHTML = '<option value="">-- Selecciona un Cliente --</option>';
        clientes.forEach(c => {
            select.innerHTML += `<option value="${c.id_cliente}">${c.razon_social} (${c.rfc})</option>`;
        });
    } catch (err) {
        select.innerHTML = '<option value="">Error al cargar clientes</option>';
    }
}

async function cargarComboPersonal() {
    const select = document.getElementById('p-id-usuario');
    try {
        const res = await fetch('/api/usuarios'); // Asegura que tu api devuelva la lista de usuarios activos
        const usuarios = await res.json();

        select.innerHTML = '<option value="">-- Selecciona un Líder --</option>';
        usuarios.forEach(u => {
            select.innerHTML += `<option value="${u.id_usuario}">${u.nombre} ${u.apellido_paterno} (${u.rol})</option>`;
        });
    } catch (err) {
        select.innerHTML = '<option value="">Error al cargar personal</option>';
    }
}

// FUNCIÓN: Abre un prompt estructurado de SweetAlert2 para cambiar el estatus del proyecto
async function abrirModalEditarEstatus(id, nombre, estatusActual) {
    const { value: nuevoEstatus } = await window.Swal.fire({
        title: 'Actualizar Estatus',
        html: `
            <div style="text-align: left; margin-top: 1rem;">
                <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1rem;">
                    Modificando el avance para el proyecto: <strong>${nombre}</strong>
                </p>
                <label style="font-size: 0.85rem; font-weight: 600; color: var(--text-main);">Selecciona el nuevo Estatus*</label>
                <select id="swal-cambio-estatus" class="select-acciones-p select-acciones-p--full">
                    <option value="Planeación" ${estatusActual === 'Planeación' ? 'selected' : ''}>Planeación</option>
                    <option value="En Progreso" ${estatusActual === 'En Progreso' ? 'selected' : ''}>En Progreso</option>
                    <option value="En Pruebas" ${estatusActual === 'En Pruebas' ? 'selected' : ''}>En Pruebas</option>
                    <option value="Suspendido" ${estatusActual === 'Suspendido' ? 'selected' : ''}>Suspendido</option>
                    <option value="Entregado" ${estatusActual === 'Entregado' ? 'selected' : ''}>Entregado</option>
                </select>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Actualizar',
        cancelButtonText: 'Cancelar',
        reverseButtons: true,
        customClass: { popup: 'swal2-popup-custom', title: 'swal2-title-custom', confirmButton: 'swal2-confirm-custom', cancelButton: 'swal2-cancel-custom' },
        preConfirm: () => {
            return document.getElementById('swal-cambio-estatus').value;
        }
    });

    if (!nuevoEstatus || nuevoEstatus === estatusActual) return; // Si cancela o deja el mismo, no hace fetch

    try {
        const respuesta = await fetch(`/api/proyectos/actualizar-estatus/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estatus: nuevoEstatus })
        });

        const data = await respuesta.json();
        if (!respuesta.ok) throw new Error(data.mensaje);

        window.Swal.fire({
            title: '¡Estatus Actualizado!',
            text: data.mensaje,
            icon: 'success',
            customClass: { popup: 'swal2-popup-custom', title: 'swal2-title-custom', confirmButton: 'swal2-confirm-custom' }
        });

        listarProyectos(); // Refrescar la grilla de proyectos

    } catch (error) {
        window.Swal.fire({
            title: 'Fallo de Actualización',
            text: error.message,
            icon: 'error',
            customClass: { popup: 'swal2-popup-custom', title: 'swal2-title-custom', confirmButton: 'swal2-confirm-custom' }
        });
    }
}

// LECTURA DINÁMICA DE LA TABLA
// LECTURA DINÁMICA DE LA TABLA CON FILTRO DE AUDITORÍA Y ROL
async function listarProyectos() {
    const tablaBody = document.getElementById('tabla-proyectos-body');
    if (!tablaBody) return;

    const busqueda = document.getElementById('buscar-proyecto').value;
    const estatus = document.getElementById('filtro-estatus-proyecto').value;

    // 1. Extraer de forma segura los datos del usuario logueado en la SPA
    const sesion = JSON.parse(localStorage.getItem('sesion_usuario')) || { id_usuario: 0, rol: 'Operador' };

    try {
        // 2. Adjuntamos el rol y el ID como query strings invisibles en la petición HTTP
        const url = `/api/proyectos?busqueda=${encodeURIComponent(busqueda)}&estatus=${encodeURIComponent(estatus)}&usuario_rol=${sesion.rol}&usuario_id=${sesion.id_usuario}`;
        
        const res = await fetch(url);
        const proyectos = await res.json();

        tablaBody.innerHTML = '';
        proyectosCargados = proyectos; // Para que el reporte PDF salga idéntico al filtro

        if (proyectos.length === 0) {
            tablaBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:gray; padding:2rem;">No tienes proyectos de software asignados en este momento.</td></tr>`;
            return;
        }

        // 3. Renderizado tradicional de la grilla (ForEach...)
        proyectos.forEach(p => {
            const tr = document.createElement('tr');
            const fInicio = new Date(p.fecha_inicio).toLocaleDateString('es-MX');
            const fEntrega = new Date(p.fecha_entrega).toLocaleDateString('es-MX');

            tr.innerHTML = `
                <td><strong>${p.nombre_proyecto}</strong><br><small style="color:gray;">${p.descripcion || 'Sin descripción'}</small></td>
                <td><i class="bi bi-building"></i> ${p.cliente_nombre}</td>
                <td><i class="bi bi-person-workspace"></i> ${p.lider_nombre}</td>
                <td>${fInicio}</td>
                <td>${fEntrega}</td>
                <td><span class="badge-status" style="background:#e0f2fe; color:#0369a1; padding: 3px 8px; border-radius:12px; font-size:0.78rem; font-weight:600;"><i class="bi bi-gear-wide-connected"></i> ${p.estatus}</span></td>
                <td>
                    <select class="select-acciones-p" data-id="${p.id_proyecto}">
                        <option value="" selected disabled>-- Acciones --</option>
                        <option value="editar_status">Editar Estatus</option>
                        <option value="eliminar">Eliminar Proyecto</option>
                    </select>
                </td>
            `;

            // Mantienes tus escuchadores del cambio de select igual...
            tr.querySelector('.select-acciones-p').addEventListener('change', async (e) => {
                const id_proyecto = e.target.getAttribute('data-id');
                const accion = e.target.value;
                if (accion === 'eliminar') await eliminarProyecto(id_proyecto);
                else if (accion === 'editar_status') await abrirModalEditarEstatus(id_proyecto, p.nombre_proyecto, p.estatus);
                e.target.value = "";
            });

            tablaBody.appendChild(tr);
        });
    } catch (error) {
        tablaBody.innerHTML = `<tr><td colspan="7" style="color:red; text-align:center;">Error de aislamiento: ${error.message}</td></tr>`;
    }
}

async function eliminarProyecto(id) {
    const confirmacion = await window.Swal.fire({
        title: '¿Eliminar proyecto?',
        text: "Esta acción aplicará un borrado lógico en la base de datos.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, borrar',
        cancelButtonText: 'Cancelar',
        reverseButtons: true,
        customClass: { popup: 'swal2-popup-custom', title: 'swal2-title-custom', confirmButton: 'swal2-confirm-custom', cancelButton: 'swal2-cancel-custom' }
    });

    if (!confirmacion.isConfirmed) return;

    try {
        const res = await fetch(`/api/proyectos/eliminar/${id}`, { method: 'POST' });
        const data = await res.json();

        if (!res.ok) throw new Error(data.mensaje);

        window.Swal.fire({
            title: 'Eliminado',
            text: data.mensaje,
            icon: 'success',
            customClass: { popup: 'swal2-popup-custom', title: 'swal2-title-custom', confirmButton: 'swal2-confirm-custom' }
        });
        listarProyectos();
    } catch (error) {
        window.Swal.fire({ title: 'Error', text: error.message, icon: 'error' });
    }


}
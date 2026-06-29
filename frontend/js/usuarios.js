// Función principal que inicializa todo el módulo de usuarios
export async function initUsuarios() {
    console.log("Inicializando lógica de Usuarios...");

    // ---- BLOQUE DE VALIDACIONES DINÁMICAS EN TIEMPO REAL ----

    // 1. Validación de Fortaleza de Contraseña y Coincidencia
    const passInput = document.getElementById('u-password');
    const confirmPassInput = document.getElementById('u-confirm-password');
    const errPassMatch = document.getElementById('error-pass-match');
    const succPassMatch = document.getElementById('success-pass-match');

    function validarContrasenas() {
        const p1 = passInput.value;
        const p2 = confirmPassInput.value;

        errPassMatch.textContent = "";
        succPassMatch.textContent = "";
        passInput.classList.remove('input-error', 'input-success');
        confirmPassInput.classList.remove('input-error', 'input-success');

        // Regla mínima: 8 caracteres, al menos una letra y un número
        const regexFuerte = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

        if (p1.length > 0 && !regexFuerte.test(p1)) {
            errPassMatch.textContent = "Mínimo 8 caracteres, incluir letras y números.";
            passInput.classList.add('input-error');
            return false;
        } else if (p1.length >= 8) {
            passInput.classList.add('input-success');
        }

        if (p1 && p2) {
            if (p1 !== p2) {
                errPassMatch.textContent = "Las contraseñas no coinciden.";
                confirmPassInput.classList.add('input-error');
                return false;
            } else {
                succPassMatch.textContent = "¡Las contraseñas coinciden!";
                confirmPassInput.classList.add('input-success');
                return true;
            }
        }
        return true;
    }
    passInput.addEventListener('input', validarContrasenas);
    confirmPassInput.addEventListener('input', validarContrasenas);


    // 2. Validación Dinámica de CURP (Al cambiar de campo / Blur)
    const curpInput = document.getElementById('u-curp');
    const errCurp = document.getElementById('error-curp');

    curpInput.addEventListener('blur', () => {
        const curp = curpInput.value.trim().toUpperCase();
        errCurp.textContent = "";
        curpInput.classList.remove('input-error', 'input-success');

        if (curp.length === 0) return;

        // Expresión regular oficial del Gobierno Mexicano para validar CURP
        const regexCurp = /^([A-Z][AEIOUX][A-Z]{2}\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])[HM](AS|BC|BS|CC|CH|CH|CL|CM|CS|DF|DG|GR|GT|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS)[B-DF-HJ-NP-TV-Z]{3}[A-Z\d]\d)$/;

        if (curp.length < 18) {
            errCurp.textContent = `Incompleto. Faltan ${18 - curp.length} caracteres.`;
            curpInput.classList.add('input-error');
        } else if (!regexCurp.test(curp)) {
            errCurp.textContent = "Estructura de CURP inválida.";
            curpInput.classList.add('input-error');
        } else {
            curpInput.classList.add('input-success');
        }
    });


    // 3. Validación de Correo Electrónico
    const correoInput = document.getElementById('u-correo');
    const errCorreo = document.getElementById('error-correo');

    correoInput.addEventListener('blur', () => {
        const correo = correoInput.value.trim();
        errCorreo.textContent = "";
        correoInput.classList.remove('input-error', 'input-success');

        if (correo.length === 0) return;

        const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!regexEmail.test(correo)) {
            errCorreo.textContent = "Formato de correo inválido (ejemplo@dominio.com).";
            correoInput.classList.add('input-error');
        } else {
            correoInput.classList.add('input-success');
        }
    });


    // 4. Validación de Teléfonos (10 dígitos obligatorios y no repetidos)
    const tel1Input = document.getElementById('u-tel1');
    const tel2Input = document.getElementById('u-tel2');
    const errTel1 = document.getElementById('error-tel1');
    const errTel2 = document.getElementById('error-tel2');

    function validarTelefonos() {
        const t1 = tel1Input.value.trim();
        const t2 = tel2Input.value.trim();

        errTel1.textContent = "";
        errTel2.textContent = "";
        tel1Input.classList.remove('input-error', 'input-success');
        tel2Input.classList.remove('input-error', 'input-success');

        if (t1.length > 0) {
            if (t1.length < 10 || isNaN(t1)) {
                errTel1.textContent = "Deben ser exactamente 10 dígitos numéricos.";
                tel1Input.classList.add('input-error');
            } else {
                tel1Input.classList.add('input-success');
            }
        }

        if (t2.length > 0) {
            if (t2.length < 10 || isNaN(t2)) {
                errTel2.textContent = "Deben ser exactamente 10 dígitos numéricos.";
                tel2Input.classList.add('input-error');
            } else if (t1 === t2) {
                errTel2.textContent = "El Teléfono 2 no puede ser idéntico al Teléfono 1.";
                tel2Input.classList.add('input-error');
            } else {
                tel2Input.classList.add('input-success');
            }
        }
    }
    tel1Input.addEventListener('blur', validarTelefonos);
    tel2Input.addEventListener('blur', validarTelefonos);


    // 5. Validación de Número de Seguro Social (NSS de 11 dígitos)
    const nssInput = document.getElementById('u-nss');
    const errNss = document.getElementById('error-nss');

    nssInput.addEventListener('blur', () => {
        const nss = nssInput.value.trim();
        errNss.textContent = "";
        nssInput.classList.remove('input-error', 'input-success');

        if (nss.length === 0) return;

        if (nss.length < 11 || isNaN(nss)) {
            errNss.textContent = `Incompleto. Deben ser 11 dígitos (Faltan ${11 - nss.length}).`;
            nssInput.classList.add('input-error');
        } else {
            nssInput.classList.add('input-success');
        }
    });

    // Interceptar el envío del formulario si hay errores activos
    document.getElementById('form-registro-usuario').addEventListener('submit', (e) => {
        const camposConErrores = document.querySelectorAll('.modal .input-error');
        if (camposConErrores.length > 0) {
            e.preventDefault();
            alert('Por favor corrijas los campos marcados en rojo antes de guardar.');
            return;
        }
    });

    // Cargar catálogos iniciales en los selectores
    await cargarAreas();
    await listarUsuarios();

    // ---- EVENTOS DE FILTRADO ----
    document.getElementById('buscar-usuario').addEventListener('input', listarUsuarios);
    document.getElementById('filtro-area').addEventListener('change', listarUsuarios);
    document.getElementById('filtro-estado').addEventListener('change', listarUsuarios);

    // ---- EVENTOS DEL MODAL ----
    const modal = document.getElementById('modal-usuario');

    document.getElementById('btn-abrir-modal-usuario').addEventListener('click', () => {
        document.getElementById('form-registro-usuario').reset();
        document.getElementById('u-colonia').innerHTML = '<option value="">Escribe un CP válido...</option>';
        modal.classList.add('mostrar');
    });

    const cerrarModal = () => modal.classList.remove('mostrar');
    document.getElementById('btn-cerrar-modal-usuario').addEventListener('click', cerrarModal);
    document.getElementById('btn-cancelar-usuario').addEventListener('click', cerrarModal);

    // ---- INTEGRACIÓN CON API POSTALI (AHORA VÍA PROXY LOCAL) ----
    document.getElementById('u-cp').addEventListener('input', async (e) => {
        const cp = e.target.value.trim();
        const loading = document.getElementById('cp-loading');
        
        if (cp.length === 5) {
            loading.classList.remove('hidden');
            try {
                // CAMBIO AQUÍ: Apuntamos a nuestro propio backend para saltarnos el CORS
                const respuesta = await fetch(`/api/usuarios/postali/${cp}`);
                if (!respuesta.ok) throw new Error('CP no encontrado en el servidor proxy');
                
                const data = await respuesta.json();
                
                // Mapear campos autocompletados
                document.getElementById('u-estado').value = data.estado;
                document.getElementById('u-municipio').value = data.municipio;
                
                // Llenar el dropdown de asentamientos/colonias
                const selectColonia = document.getElementById('u-colonia');
                selectColonia.innerHTML = '<option value="">-- Selecciona una colonia --</option>';
                
                data.asentamientos.forEach(asenta => {
                    const option = document.createElement('option');
                    option.value = asenta.nombre;
                    option.textContent = `${asenta.nombre} (${asenta.tipo})`;
                    selectColonia.appendChild(option);
                });

            } catch (error) {
                console.error("Error Proxy Postali:", error.message);
                document.getElementById('u-estado').value = '';
                document.getElementById('u-municipio').value = '';
                document.getElementById('u-colonia').innerHTML = '<option value="">CP no válido o inexistente</option>';
            } finally {
                loading.classList.add('hidden');
            }
        }
    });

    // ---- EVENTO DE ENVÍO (REGISTRO) ----
    // ---- DETECTAR EL ENVÍO DEL FORMULARIO DE USUARIOS ----
// ---- DETECTAR EL ENVÍO DEL FORMULARIO DE CREACIÓN DE USUARIOS ----
document.getElementById('form-registro-usuario').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Control de seguridad: Validar que la librería esté cargada en la memoria global
    if (!window.Swal) {
        alert("Error de sistema: No se pudo cargar el motor visual de SweetAlert2.");
        return;
    }

    // Frenar si hay errores dinámicos de validación visuales activos (.input-error)
    if (document.querySelectorAll('#form-registro-usuario .input-error').length > 0) {
        window.Swal.fire({
            title: 'Campos Inválidos',
            text: 'Por favor, corrige los campos marcados en rojo antes de proceder.',
            icon: 'error',
            customClass: { popup: 'swal2-popup-custom', title: 'swal2-title-custom', htmlContainer: 'swal2-html-custom', confirmButton: 'swal2-confirm-custom' }
        });
        return;
    }

    // ARMAR EL OBJETO (Asegurando mapear de forma exacta 'fecha_alta_salud')
    const nuevoUsuario = {
    username: document.getElementById('u-username').value.trim(),
    password: document.getElementById('u-password').value,
    rol: document.getElementById('u-rol').value,
    nombre: document.getElementById('u-nombre').value.trim(),
    apellido_paterno: document.getElementById('u-paterno').value.trim(),
    apellido_materno: document.getElementById('u-materno').value.trim() || null,
    curp: document.getElementById('u-curp').value.trim().toUpperCase(),
    correo: document.getElementById('u-correo').value.trim(),
    telefono_1: document.getElementById('u-tel1').value.trim(),
    telefono_2: document.getElementById('u-tel2').value.trim() || null,
    fecha_contratacion: document.getElementById('u-fecha-contratacion').value,
    id_area: Number(document.getElementById('u-id-area').value), 
    nss: document.getElementById('u-nss').value.trim(),
    fecha_alta_salud: document.getElementById('u-fecha-salud').value, 
    direccion: document.getElementById('u-direccion').value.trim(),
    colonia: document.getElementById('u-colonia').value,
    municipio: document.getElementById('u-municipio').value,
    estado: document.getElementById('u-estado').value,
    codigo_postal: document.getElementById('u-cp').value
};

    try {
        const respuesta = await fetch('/api/usuarios', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nuevoUsuario)
        });

        const data = await respuesta.json();
        if (!respuesta.ok) throw new Error(data.mensaje);

        // Alerta Estética Unificada de Éxito usando window.Swal
        window.Swal.fire({
            title: '¡Usuario Creado!',
            text: 'El colaborador ha sido registrado en la nómina interna correctamente.',
            icon: 'success',
            customClass: { popup: 'swal2-popup-custom', title: 'swal2-title-custom', htmlContainer: 'swal2-html-custom', confirmButton: 'swal2-confirm-custom' }
        });

        // Ocultar el modal de alta
        document.getElementById('modal-usuario').classList.remove('mostrar');
        
        // Recargar la tabla de usuarios en limpio
        if (typeof listarUsuarios === 'function') await listarUsuarios();

    } catch (error) {
        // 🚀 Alerta Estética Unificada de Error del Servidor usando window.Swal
        window.Swal.fire({
            title: 'Error de Registro',
            text: error.message,
            icon: 'error',
            customClass: { popup: 'swal2-popup-custom', title: 'swal2-title-custom', htmlContainer: 'swal2-html-custom', confirmButton: 'swal2-confirm-custom' }
        });
    }
});

}

// FUNCION: Obtener y listar usuarios en la tabla con sus filtros
async function listarUsuarios() {
    const busqueda = document.getElementById('buscar-usuario').value;
    const id_area = document.getElementById('filtro-area').value;
    const estado = document.getElementById('filtro-estado').value;
    const tablaBody = document.getElementById('tabla-usuarios-body');

    try {
        // Construcción dinámica de la URL con Query Params
        const url = `/api/usuarios?busqueda=${encodeURIComponent(busqueda)}&id_area=${id_area}&estado=${encodeURIComponent(estado)}`;
        const respuesta = await fetch(url);
        const usuarios = await respuesta.json();

        tablaBody.innerHTML = '';

        if (usuarios.length === 0) {
            tablaBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:gray;">No se encontraron usuarios activos.</td></tr>`;
            return;
        }

        usuarios.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${user.username}</strong><br><small style="color:blue;">${user.rol}</small></td>
                <td>${user.nombre} ${user.apellido_paterno} ${user.apellido_materno || ''}</td>
                <td><code style="background:#f1f5f9; padding:2px 4px; border-radius:4px;">${user.curp}</code></td>
                <td>${user.nombre_area}</td>
                <td><i class="bi bi-envelope"></i> ${user.correo}<br><i class="bi bi-telephone"></i> ${user.telefono_1}</td>
                <td>${user.colonia}, ${user.municipio}, ${user.estado} - <b>${user.codigo_postal}</b></td>
                <td>
                    <button class="btn btn-danger btn-sm btn-eliminar-u" data-id="${user.id_usuario}">
                        <i class="bi bi-trash3-fill"></i> Baja
                    </button>
                </td>
            `;

            // Asignar evento al botón de baja/eliminación
            tr.querySelector('.btn-eliminar-u').addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                solicitudBajaUsuario(id);
            });

            tablaBody.appendChild(tr);
        });

    } catch (error) {
        tablaBody.innerHTML = `<tr><td colspan="7" style="color:red; text-align:center;">Error al cargar la tabla: ${error.message}</td></tr>`;
    }
}

// FUNCION: Manejar la eliminación que pide autorización de supervisor
async function solicitudBajaUsuario(id) {
    // Control de seguridad: Verificar que la librería esté cargada en la memoria del navegador
    if (!window.Swal) {
        console.error("SweetAlert2 no está disponible en el objeto global window.");
        alert("Error de sistema: No se pudo cargar el motor de alertas visuales.");
        return;
    }

    // 1. CONFIRMACIÓN ESTÉTICA INICIAL (Uso de window.Swal)
    const confirmacion = await window.Swal.fire({
        title: '¿Dar de baja a este usuario?',
        text: "Esta acción requiere la validación obligatoria de un Supervisor en sitio.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Continuar',
        cancelButtonText: 'Cancelar',
        reverseButtons: true,
        customClass: {
            popup: 'swal2-popup-custom',
            title: 'swal2-title-custom',
            htmlContainer: 'swal2-html-custom',
            confirmButton: 'swal2-confirm-custom',
            cancelButton: 'swal2-cancel-custom'
        }
    });

    if (!confirmacion.isConfirmed) return; // Operación abortada de forma segura

    // 2. MODAL INTEGRADO PARA CAPTURAR CREDENCIALES EN UN SOLO PASO
    const { value: formValues } = await window.Swal.fire({
        title: 'Validación en Sitio',
        html: `
            <div style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem;">
                <p style="font-size: 0.9rem; color: var(--text-muted); text-align: left; margin: 0;">
                    El supervisor debe ingresar sus credenciales para autorizar esta baja de nómina.
                </p>
                <div style="text-align: left; display: flex; flex-direction: column; gap: 0.35rem;">
                    <label style="font-size: 0.85rem; font-weight: 500; color: var(--text-main);">Usuario del Supervisor*</label>
                    <input id="swal-super-user" class="form-control" style="padding: 0.55rem; border: 1px solid var(--border-color); border-radius: 0.375rem; width: 100%; outline: none;" placeholder="Ej: admin_super">
                </div>
                <div style="text-align: left; display: flex; flex-direction: column; gap: 0.35rem;">
                    <label style="font-size: 0.85rem; font-weight: 500; color: var(--text-main);">Contraseña de Confirmación*</label>
                    <input id="swal-super-pass" type="password" class="form-control" style="padding: 0.55rem; border: 1px solid var(--border-color); border-radius: 0.375rem; width: 100%; outline: none;" placeholder="••••••••">
                </div>
            </div>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Firmar Autorización',
        cancelButtonText: 'Cancelar',
        reverseButtons: true,
        customClass: {
            popup: 'swal2-popup-custom',
            title: 'swal2-title-custom',
            confirmButton: 'swal2-confirm-custom',
            cancelButton: 'swal2-cancel-custom'
        },
        // Validación en tiempo real dentro del modal inyectado
        preConfirm: () => {
            const super_username = document.getElementById('swal-super-user').value.trim();
            const super_password = document.getElementById('swal-super-pass').value;
            
            if (!super_username || !super_password) {
                window.Swal.showValidationMessage('Ambos campos son obligatorios para continuar.');
                return false;
            }
            return { super_username, super_password };
        }
    });

    if (!formValues) return; // Si el usuario canceló la firma

    const { super_username, super_password } = formValues;

    // 3. ENVÍO SEGURO DE DATOS CONEXIÓN BACKEND
    try {
        const respuesta = await fetch(`/api/usuarios/eliminar/${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ super_username, super_password })
        });

        const data = await respuesta.json();
        if (!respuesta.ok) throw new Error(data.mensaje);

        // Mensaje de éxito unificado corporativo
        window.Swal.fire({
            title: '¡Baja Exitosa!',
            text: data.mensaje,
            icon: 'success',
            customClass: { popup: 'swal2-popup-custom', title: 'swal2-title-custom', htmlContainer: 'swal2-html-custom', confirmButton: 'swal2-confirm-custom' }
        });

        listarUsuarios(); // Refrescar la grilla de personal

    } catch (error) {
        // Mensaje de denegación de credenciales o error de firmas
        window.Swal.fire({
            title: 'Autorización Denegada',
            text: error.message,
            icon: 'error',
            customClass: { popup: 'swal2-popup-custom', title: 'swal2-title-custom', htmlContainer: 'swal2-html-custom', confirmButton: 'swal2-confirm-custom' }
        });
    }
}

// FUNCION: Cargar las áreas desde el API interna para llenar los dropdowns
async function cargarAreas() {
    try {
        const respuesta = await fetch('/api/usuarios/areas');
        const areas = await respuesta.json();

        const filtroArea = document.getElementById('filtro-area');
        const selectAreaModal = document.getElementById('u-id-area');

        // Limpiar opciones previas manteniendo la opción por defecto
        filtroArea.innerHTML = '<option value="">Todas las áreas</option>';
        selectAreaModal.innerHTML = '<option value="">-- Seleccione un área --</option>';

        areas.forEach(area => {
            const opt1 = document.createElement('option');
            opt1.value = area.id_area;
            opt1.textContent = area.nombre_area;
            filtroArea.appendChild(opt1);

            const opt2 = document.createElement('option');
            opt2.value = area.id_area;
            opt2.textContent = area.nombre_area;
            selectAreaModal.appendChild(opt2);
        });
    } catch (error) {
        console.error("Error al cargar el catálogo de áreas:", error.message);
    }
}
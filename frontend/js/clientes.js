// Función principal que inicializa el módulo de clientes
export async function initClientes() {
    console.log("Inicializando lógica de Clientes...");
    
    // Listar los clientes cargados inicialmente
    await listarClientes();

    // ---- EVENTOS DE FILTRADO EN TIEMPO REAL ----
    document.getElementById('buscar-cliente').addEventListener('input', listarClientes);
    document.getElementById('filtro-estado-cliente').addEventListener('change', listarClientes);

    // ---- MANEJO DEL MODAL ----
    const modal = document.getElementById('modal-cliente');
    
    document.getElementById('btn-abrir-modal-cliente').addEventListener('click', () => {
        document.getElementById('form-registro-cliente').reset();
        document.getElementById('c-colonia').innerHTML = '<option value="">Escribe un CP válido...</option>';
        // Limpiar clases e indicaciones de error pasadas
        document.querySelectorAll('#form-registro-cliente input').forEach(inp => inp.classList.remove('input-error', 'input-success'));
        document.querySelectorAll('#form-registro-cliente .error-msg').forEach(sm => sm.textContent = '');
        modal.classList.add('mostrar');
    });

    const cerrarModal = () => modal.classList.remove('mostrar');
    document.getElementById('btn-cerrar-modal-cliente').addEventListener('click', cerrarModal);
    document.getElementById('btn-cancelar-cliente').addEventListener('click', cerrarModal);

    // ---- VALIDACIÓN POSTAL EN VIVO  ----
    document.getElementById('c-cp').addEventListener('input', async (e) => {
        const cp = e.target.value.trim();
        const loading = document.getElementById('c-cp-loading');
        
        if (cp.length === 5) {
            loading.classList.remove('hidden');
            try {
                // Consumimos el proxy seguro que creamos en el backend de usuarios
                const respuesta = await fetch(`/api/usuarios/postali/${cp}`);
                if (!respuesta.ok) throw new Error('CP no localizado');
                
                const data = await respuesta.json();
                
                document.getElementById('c-estado').value = data.estado;
                document.getElementById('c-municipio').value = data.municipio;
                
                const selectColonia = document.getElementById('c-colonia');
                selectColonia.innerHTML = '<option value="">-- Selecciona una colonia --</option>';
                
                data.asentamientos.forEach(asenta => {
                    const option = document.createElement('option');
                    option.value = asenta.nombre;
                    option.textContent = `${asenta.nombre} (${asenta.tipo})`;
                    selectColonia.appendChild(option);
                });

            } catch (error) {
                console.error("Error Postali Clientes:", error.message);
                document.getElementById('c-estado').value = '';
                document.getElementById('c-municipio').value = '';
                document.getElementById('c-colonia').innerHTML = '<option value="">CP no válido o inexistente</option>';
            } finally {
                loading.classList.add('hidden');
            }
        }
    });

    // 1. Validación de RFC Mexicano (Personas Físicas o Morales)
    const rfcInput = document.getElementById('c-rfc');
    const errRfc = document.getElementById('error-c-rfc');
    rfcInput.addEventListener('blur', () => {
        const rfc = rfcInput.value.trim().toUpperCase();
        errRfc.textContent = "";
        rfcInput.classList.remove('input-error', 'input-success');

        if (rfc.length === 0) return;

        // Regex Oficial del SAT para validar estructura de RFC
        const regexRfc = /^([A-Z&Ñ]{3,4}\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])[A-Z\d]{3})$/;

        if (rfc.length < 12) {
            errRfc.textContent = "Muy corto. Debe tener entre 12 y 13 caracteres.";
            rfcInput.classList.add('input-error');
        } else if (!regexRfc.test(rfc)) {
            errRfc.textContent = "Estructura de RFC inválida (Ej: ABC120101XYZ).";
            rfcInput.classList.add('input-error');
        } else {
            rfcInput.classList.add('input-success');
        }
    });

    // 2. Validación de Correo del Cliente
    const correoInput = document.getElementById('c-correo');
    const errCorreo = document.getElementById('error-c-correo');
    correoInput.addEventListener('blur', () => {
        const correo = correoInput.value.trim();
        errCorreo.textContent = "";
        correoInput.classList.remove('input-error', 'input-success');

        if (correo.length === 0) return;

        const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!regexEmail.test(correo)) {
            errCorreo.textContent = "Formato de correo inválido.";
            correoInput.classList.add('input-error');
        } else {
            correoInput.classList.add('input-success');
        }
    });

    // 3. Validación de Teléfonos No Duplicados (10 dígitos)
    const tel1Input = document.getElementById('c-tel1');
    const tel2Input = document.getElementById('c-tel2');
    const errTel1 = document.getElementById('error-c-tel1');
    const errTel2 = document.getElementById('error-c-tel2');

    function validarTelefonosClientes() {
        const t1 = tel1Input.value.trim();
        const t2 = tel2Input.value.trim();

        errTel1.textContent = "";
        errTel2.textContent = "";
        tel1Input.classList.remove('input-error', 'input-success');
        tel2Input.classList.remove('input-error', 'input-success');

        if (t1.length > 0) {
            if (t1.length < 10 || isNaN(t1)) {
                errTel1.textContent = "Requiere 10 dígitos.";
                tel1Input.classList.add('input-error');
            } else {
                tel1Input.classList.add('input-success');
            }
        }

        if (t2.length > 0) {
            if (t2.length < 10 || isNaN(t2)) {
                errTel2.textContent = "Requiere 10 dígitos.";
                tel2Input.classList.add('input-error');
            } else if (t1 === t2) {
                errTel2.textContent = "No puede duplicar el Teléfono 1.";
                tel2Input.classList.add('input-error');
            } else {
                tel2Input.classList.add('input-success');
            }
        }
    }
    tel1Input.addEventListener('blur', validarTelefonosClientes);
    tel2Input.addEventListener('blur', validarTelefonosClientes);


    // ---- ENVIAR FORMULARIO DE REGISTRO ----
    document.getElementById('form-registro-cliente').addEventListener('submit', async (e) => {
        e.preventDefault();

        // Frenar si hay errores visuales activos
        if (document.querySelectorAll('#modal-cliente .input-error').length > 0) {
            alert('Corrige los errores en rojo antes de proceder.');
            return;
        }

        const nuevoCliente = {
            razon_social: document.getElementById('c-razon-social').value.trim(),
            rfc: rfcInput.value.trim().toUpperCase(),
            contacto_principal: document.getElementById('c-contacto').value.trim(),
            correo: correoInput.value.trim(),
            telefono_1: tel1Input.value.trim(),
            telefono_2: tel2Input.value.trim() || null,
            direccion: document.getElementById('c-direccion').value.trim(),
            colonia: document.getElementById('c-colonia').value,
            municipio: document.getElementById('c-municipio').value,
            estado: document.getElementById('c-estado').value,
            codigo_postal: document.getElementById('c-cp').value
        };

        try {
            const respuesta = await fetch('/api/clientes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nuevoCliente)
            });

            const resData = await respuesta.json();
            if (!respuesta.ok) throw new Error(resData.mensaje);

            Swal.fire({
            title: '¡Éxito!',
            text: 'Cliente mercantil registrado con éxito.',
            icon: 'success',
            customClass: { popup: 'swal2-popup-custom', title: 'swal2-title-custom', htmlContainer: 'swal2-html-custom', confirmButton: 'swal2-confirm-custom' }
        });
            cerrarModal();
            listarClientes();

        } catch (error) {
            alert(`Error de inserción: ${error.message}`);
        }
    });
}

// FUNCIÓN: Consultar backend y pintar la grilla de Clientes
async function listarClientes() {
    const busqueda = document.getElementById('buscar-cliente').value;
    const estado = document.getElementById('filtro-estado-cliente').value;
    const tablaBody = document.getElementById('tabla-clientes-body');

    try {
        const url = `/api/clientes?busqueda=${encodeURIComponent(busqueda)}&estado=${encodeURIComponent(estado)}`;
        const respuesta = await fetch(url);
        const clientes = await respuesta.json();

        tablaBody.innerHTML = '';

        if (clientes.length === 0) {
            tablaBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:gray;">No hay registros de clientes que coincidan.</td></tr>`;
            return;
        }

        clientes.forEach(cli => {
            const tr = document.createElement('tr');
            
            // Formatear la fecha de registro de forma legible
            const fechaFormateada = new Date(cli.fecha_registro).toLocaleDateString('es-MX', {
                year: 'numeric', month: 'short', day: 'numeric'
            });

            tr.innerHTML = `
                <td><strong>${cli.razon_social}</strong></td>
                <td><code style="background:#f1f5f9; padding:2px 6px; border-radius:4px; font-weight:bold;">${cli.rfc}</code></td>
                <td><i class="bi bi-person-badge"></i> ${cli.contacto_principal}</td>
                <td><i class="bi bi-envelope"></i> ${cli.correo}<br><i class="bi bi-telephone"></i> ${cli.telefono_1}</td>
                <td>${cli.direccion}, C.P. ${cli.codigo_postal}<br><small style="color:gray;">${cli.colonia}, ${cli.municipio}</small></td>
                <td>${fechaFormateada}</td>
                <td>
                    <button class="btn btn-danger btn-sm btn-eliminar-c" data-id="${cli.id_cliente}">
                        <i class="bi bi-trash3-fill"></i> Eliminar
                    </button>
                </td>
            `;

            // Escuchador de borrado lógico supervisado
            tr.querySelector('.btn-eliminar-c').addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                solicitudBajaCliente(id);
            });

            tablaBody.appendChild(tr);
        });

    } catch (error) {
        tablaBody.innerHTML = `<tr><td colspan="7" style="color:red; text-align:center;">Error al renderizar clientes: ${error.message}</td></tr>`;
    }
}

// FUNCIÓN: Pide autorización en sitio del Supervisor para dar de baja un cliente comercial
async function solicitudBajaCliente(id_cliente) {
    const resultado = await Swal.fire({
        title: '¿Solicitar baja comercial?',
        text: "Esta acción enviará una petición de revisión al Supervisor.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, solicitar',
        cancelButtonText: 'Cancelar',
        reverseButtons: true,
        customClass: {
            popup: 'swal2-popup-custom', title: 'swal2-title-custom', htmlContainer: 'swal2-html-custom',
            confirmButton: 'swal2-confirm-custom', cancelButton: 'swal2-cancel-custom'
        }
    });
    if (!resultado.isConfirmed) return;

    // Recuperamos la sesión actual para saber qué usuario está operando el sistema
    const sesion = JSON.parse(localStorage.getItem('sesion_usuario'));
    const id_usuario_solicita = sesion.id_usuario; 

    try {
        const respuesta = await fetch('/api/solicitudes/solicitar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_cliente, id_usuario_solicita })
        });

        const data = await respuesta.json();
        if (!respuesta.ok) throw new Error(data.mensaje);

        swal.fire({
            title: 'Solicitud enviada',
            text: data.mensaje,
            icon: 'success',
            customClass: { popup: 'swal2-popup-custom', title: 'swal2-title-custom', htmlContainer: 'swal2-html-custom', confirmButton: 'swal2-confirm-custom' }
        });

        listarClientes(); // Refrescar la tabla

    } catch (error) {
        alert(`No se pudo enviar la solicitud: ${error.message}`);
    }
}
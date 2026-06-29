import { initUsuarios } from './usuarios.js';
import { initClientes } from './clientes.js';
import { initSolicitudes } from './solicitudes.js';
import { initProyectos } from './proyectos.js';

document.addEventListener('DOMContentLoaded', () => {
    const sesion = localStorage.getItem('sesion_usuario');
    
    if (!sesion) {
        window.location.href = 'login.html';
        return;
    }

    const datosUsuario = JSON.parse(sesion);
    document.getElementById('sesion-username').textContent = datosUsuario.nombre;
    document.getElementById('sesion-rol').textContent = datosUsuario.rol;

    const btnUsuarios = document.querySelector('.nav-link[data-modulo="usuarios"]');
    
    if (datosUsuario.rol === 'Operador') {
        if (btnUsuarios) btnUsuarios.style.display = 'none'; // Desaparece el acceso para Operadores
        inicializarNavegacion('clientes'); // El operador inicia directo en Clientes
    } else {
        if (btnUsuarios) btnUsuarios.style.display = 'flex'; // El supervisor sí lo ve
        inicializarNavegacion('usuarios'); // El supervisor inicia en Usuarios
    }

    // Botón de Logout
    document.getElementById('btn-logout').addEventListener('click', () => {
        localStorage.removeItem('sesion_usuario');
        window.location.href = 'login.html';
    });
});

async function cargarModulo(nombreModulo) {
    const contenedor = document.getElementById('contenedor-dinamico');
    const titulo = document.getElementById('modulo-titulo');
    
    contenedor.innerHTML = '<div class="loading-spinner"><i class="bi bi-arrow-clockwise"></i> Cargando vistas del módulo...</div>';
    titulo.textContent = nombreModulo === 'usuarios' ? 'Gestión de Usuarios' : 'Gestión de Clientes';

    try {
        const respuesta = await fetch(`modules/${nombreModulo}.html`);
        if (!respuesta.ok) throw new Error('No se pudo cargar la vista del módulo.');
        
        const html = await respuesta.text();
        contenedor.innerHTML = html;

        // Mandar a inicializar los listeners de JS una vez montado el DOM
        inicializarLogicaModulo(nombreModulo);

    } catch (error) {
        contenedor.innerHTML = `
            <div style="color: var(--danger); padding: 2rem; text-align: center;">
                <i class="bi bi-exclamation-triangle-fill" style="font-size: 2rem;"></i>
                <p>Error al cargar el módulo solicitado: ${error.message}</p>
            </div>`;
    }
}

function inicializarNavegacion(moduloDefecto) {
    const links = document.querySelectorAll('.nav-link');
    
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            links.forEach(l => l.classList.remove('active'));
            const botonActual = e.currentTarget;
            botonActual.classList.add('active');
            
            const modulo = botonActual.getAttribute('data-modulo');
            cargarModulo(modulo);
        });
    });

    // Cargar el módulo que le corresponde a su rol
    const btnActivar = document.querySelector(`.nav-link[data-modulo="${moduloDefecto}"]`);
    if (btnActivar) btnActivar.classList.add('active');
    cargarModulo(moduloDefecto);
}

// CONEXIÓN CON LOS SCRIPTS DINÁMICOS
function inicializarLogicaModulo(modulo) {
    if (modulo === 'usuarios') {
        initUsuarios();
    } else if (modulo === 'clientes') {
        initClientes();
    } else if (modulo === 'solicitudes') {
        initSolicitudes(); 
    } else if (modulo === 'proyectos') {
        initProyectos();
    }
}

function mostrarFecha() {
    const txtFecha = document.getElementById('txt-fecha');
    const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    txtFecha.textContent = new Date().toLocaleDateString('es-MX', opciones);
}
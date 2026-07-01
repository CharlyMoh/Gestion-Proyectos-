-- ==========================================================================
-- SCRIPT DE DESPLIEGUE ESTRUCTURAL (SCHEMA.SQL)
-- SISTEMA DE GESTIÓN ADMINISTRATIVA TI
-- Autor: Carlos Manuel Ojeda Hernández
-- Versión: 2.0 (Soporte Híbrido de Solicitudes de Baja)
-- ==========================================================================

-- 1. PREPARACIÓN DE LA BASE DE DATOS (Instalación desde cero)
DROP DATABASE IF EXISTS control_proyectos_db;
CREATE DATABASE control_proyectos_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE control_proyectos_db;

-- ==========================================================================
-- 2. TABLAS PRIMARIAS / CATÁLOGOS (Independientes)
-- ==========================================================================

-- Catálogo de Áreas Laborales
CREATE TABLE cat_areas (
    id_area INT AUTO_INCREMENT PRIMARY KEY,
    nombre_area VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Padrón de Clientes Comerciales
CREATE TABLE clientes (
    id_cliente INT AUTO_INCREMENT PRIMARY KEY,
    razon_social VARCHAR(150) NOT NULL,
    rfc VARCHAR(13) NOT NULL UNIQUE,
    contacto_principal VARCHAR(100) NULL,
    correo VARCHAR(100) NOT NULL,
    telefono_1 VARCHAR(15) NOT NULL,
    telefono_2 VARCHAR(15) NULL,
    direccion VARCHAR(150) NOT NULL,   -- Calle y Número
    colonia VARCHAR(100) NOT NULL,     -- Asentamiento Postali
    municipio VARCHAR(100) NOT NULL,   -- Municipio Postali
    estado VARCHAR(50) NOT NULL,       -- Estado Postali
    codigo_postal VARCHAR(5) NOT NULL,  -- CP Postali
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo TINYINT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================================
-- 3. TABLAS SECUNDARIAS (Dependientes)
-- ==========================================================================

-- Tabla de Usuarios / Personal Interno
CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- Soporta hashes de Bcrypt generados por tu semilla de aplicación
    rol ENUM('Operador', 'Supervisor') NOT NULL DEFAULT 'Operador',
    nombre VARCHAR(50) NOT NULL,
    apellido_paterno VARCHAR(50) NOT NULL,
    apellido_materno VARCHAR(50) NULL,
    curp VARCHAR(18) NOT NULL UNIQUE,
    correo VARCHAR(100) NOT NULL UNIQUE,
    telefono_1 VARCHAR(15) NOT NULL,
    telefono_2 VARCHAR(15) NULL,
    fecha_contratacion DATE NOT NULL,
    id_area INT NOT NULL, 
    nss VARCHAR(11) NOT NULL,
    fecha_alta_salud DATE NOT NULL,
    direccion VARCHAR(150) NOT NULL,
    colonia VARCHAR(100) NOT NULL,
    municipio VARCHAR(100) NOT NULL,
    estado VARCHAR(50) NOT NULL,
    codigo_postal VARCHAR(5) NOT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,
    FOREIGN KEY (id_area) REFERENCES cat_areas(id_area)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================================
-- 4. TABLAS COUPLERS / HIJAS (Relaciones Cruzadas)
-- ==========================================================================

-- Control de Proyectos Tecnológicos
CREATE TABLE proyectos (
    id_proyecto INT AUTO_INCREMENT PRIMARY KEY,
    nombre_proyecto VARCHAR(100) NOT NULL,
    descripcion TEXT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_entrega DATE NOT NULL,
    estatus ENUM('Planeación', 'En Progreso', 'En Pruebas', 'Suspendido', 'Entregado') NOT NULL DEFAULT 'Planeación',
    id_cliente INT NOT NULL,           
    id_usuario_asignado INT NOT NULL,  
    activo TINYINT(1) NOT NULL DEFAULT 1,
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente),
    FOREIGN KEY (id_usuario_asignado) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bandeja de Solicitudes de Baja Evolucionada (Soporta Clientes y Proyectos en paralelo)
CREATE TABLE solicitudes_baja (
    id_solicitud INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT NULL,                -- NULL si la solicitud es para un proyecto
    id_proyecto INT NULL,               -- NULL si la solicitud es para un cliente
    id_usuario_solicita INT NOT NULL,
    estatus ENUM('Pendiente', 'Aceptada', 'Rechazada') NOT NULL DEFAULT 'Pendiente',
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente),
    FOREIGN KEY (id_proyecto) REFERENCES proyectos(id_proyecto),
    FOREIGN KEY (id_usuario_solicita) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================================
-- 5. SEMILLAS ESTÁTICAS DE SISTEMA (No confidenciales)
-- ==========================================================================

-- Precarga obligatoria de departamentos para que funcione el formulario de usuarios
INSERT INTO cat_areas (nombre_area) 
VALUES ('Administración'), ('Bodeguero'), ('Oficinista'), ('Vendedor');
// FUNCIÓN CENTRALIZADA PARA GENERAR REPORTES EN PDF CON ENCABEZADO DE AUDITORÍA
export function exportarA_PDF(tituloReporte, cabeceras, filas) {
    const { jsPDF } = window.jspdf;
    
    // Configuración: A4 en orientación Horizontal ('l') para evitar desbordes de columnas
    const doc = new jsPDF('l', 'mm', 'a4');

    // 1. RECUPERAR METADATOS DE AUDITORÍA (Sesión y Tiempo Real)
    const sesion = JSON.parse(localStorage.getItem('sesion_usuario')) || { nombre: 'Usuario', username: 'anonimo', rol: 'Operador' };
    const fechaHora = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });

    // 2. DISEÑAR EL ENCABEZADO CORPORATIVO
    // Título Principal del Sistema
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59); // Color Slate (var(--bg-primary))
    doc.text("SISTEMA DE GESTIÓN ADMINISTRATIVA TI", 14, 14);

    // Subtítulo: Nombre específico del reporte
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105);
    doc.text(`Reporte: ${tituloReporte.toUpperCase()}`, 14, 20);

    // Bloque de Firma Digital (Auditoría solicitada)
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generado por: ${sesion.nombre} (@${sesion.username}) — Rol: ${sesion.rol}`, 14, 26);
    doc.text(`Fecha y Hora de emisión: ${fechaHora} CT`, 14, 31);

    // Línea divisoria estética
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, 35, 283, 35); // Cruza el ancho útil de la hoja A4 horizontal

    // 3. RENDERIZAR LA TABLA DE DATOS CON AUTO-TABLE
    doc.autoTable({
        startY: 40,
        head: [cabeceras],
        body: filas,
        theme: 'striped',
        headStyles: {
            fillColor: [30, 41, 59], // Fondo azul marino plano idéntico a tu Dashboard
            textColor: [255, 255, 255],
            fontSize: 9,
            fontStyle: 'bold',
            halign: 'left'
        },
        styles: {
            fontSize: 8.5,
            cellPadding: 3,
            font: 'helvetica',
            textColor: [51, 65, 85]
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252] // Color sutil para filas alternas
        },
        margin: { left: 14, right: 14 }
    });

    // 4. DESCARGA AUTOMÁTICA DEL ARCHIVO
    // Formatear nombre del archivo (ej: reporte-proyectos-29_6_2026.pdf)
    const nombreArchivo = `reporte-${tituloReporte.toLowerCase().replace(/\s+/g, '-')}-${new Date().toLocaleDateString('es-MX')}.pdf`;
    doc.save(nombreArchivo);
}
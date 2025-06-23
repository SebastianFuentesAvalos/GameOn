// Variables globales
let areaId, fechaInput, fechaSeleccionada, bloquesSeleccionados = [], cronogramaActual = [];

// HAZ GLOBAL ESTA FUNCIÓN
function getTarifaPorHora() {
    return window.TARIFA_POR_HORA || 0;
}

function cargarHorarios() {
    // Ya no hace fetch, solo renderiza el cronograma actual
    renderBloques(window.cronogramaActual || []);
}

function renderBloques(cronograma) {
    const grid = document.getElementById('horariosGrid');
    if (!cronograma.length) {
        grid.innerHTML = `<div class="loading-horarios">No hay horarios disponibles para esta fecha.</div>`;
        return;
    }
    let html = '';
    cronograma.forEach((bloque, idx) => {
        let clase = 'horario-bloque ';
        if (bloque.disponible) clase += 'disponible';
        else clase += 'ocupado';
        if (bloquesSeleccionados.includes(idx)) clase += ' seleccionado';
        html += `<div class="${clase}" data-idx="${idx}" ${bloque.disponible ? '' : 'tabindex="-1"'}>${bloque.hora_inicio} - ${bloque.hora_fin}</div>`;
    });
    grid.innerHTML = html;

    // Multi-selección de bloques consecutivos
    grid.querySelectorAll('.horario-bloque.disponible').forEach(bloque => {
        bloque.addEventListener('click', function() {
            const idx = parseInt(this.dataset.idx);
            if (bloquesSeleccionados.includes(idx)) {
                // Deseleccionar
                bloquesSeleccionados = bloquesSeleccionados.filter(i => i !== idx);
            } else {
                // Solo permitir selección de bloques consecutivos
                if (
                    bloquesSeleccionados.length === 0 ||
                    bloquesSeleccionados.includes(idx - 1) ||
                    bloquesSeleccionados.includes(idx + 1)
                ) {
                    bloquesSeleccionados.push(idx);
                    bloquesSeleccionados.sort((a, b) => a - b);
                } else {
                    alert('Solo puedes seleccionar bloques consecutivos.');
                    return;
                }
            }
            // SOLO vuelve a renderizar el cronograma actual, no lo recargues ni lo limpies
            renderBloques(window.cronogramaActual);
            actualizarMonto();
        });
    });
    actualizarMonto();
}

function actualizarMonto() {
    const montoSpan = document.getElementById('montoPagar');
    const pagoZone = document.getElementById('pagoCulqiZone');
    const cantidadBloques = bloquesSeleccionados.length;
    // Cada bloque es 0.5 horas
    const monto = (cantidadBloques * 0.5 * getTarifaPorHora()).toFixed(2);
    montoSpan.textContent = monto;
    if (cantidadBloques > 0) {
        pagoZone.style.display = 'block';
    } else {
        pagoZone.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    areaId = window.AREA_ID;
    fechaInput = document.getElementById('fechaReserva');
    fechaSeleccionada = fechaInput.value;
    bloquesSeleccionados = [];
    cronogramaActual = [];

    fechaInput.addEventListener('change', function() {
        fechaSeleccionada = this.value;
        bloquesSeleccionados = [];
        actualizarMonto();
        // NO LLAMES cargarHorarios aquí, el fetch lo hace reservar_area.php
    });

    // Botón de pago Culqi (aquí integras la API de Culqi)
    document.getElementById('btnPagarCulqi').onclick = function() {
        if (bloquesSeleccionados.length === 0) return;
        // Obtener bloques seleccionados
        const bloques = bloquesSeleccionados.map(idx => cronogramaActual[idx]);
        alert(
            `Reservar ${bloques.length} bloques:\n` +
            bloques.map(b => `${b.hora_inicio} - ${b.hora_fin}`).join('\n') +
            `\nMonto a pagar: S/ ${document.getElementById('montoPagar').textContent}\n\n(Integrar Culqi aquí)`
        );
        // Aquí va la integración real de Culqi...
    };
    renderBloques(window.cronogramaActual);
})

// Hacer globales las funciones para inicialización desde PHP
window.cargarHorarios = cargarHorarios;
window.actualizarMonto = actualizarMonto;
window.renderBloques = renderBloques;
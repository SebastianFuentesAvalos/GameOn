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
    
    // ✅ VALIDAR QUE cronograma EXISTA Y SEA ARRAY
    if (!cronograma || !Array.isArray(cronograma) || cronograma.length === 0) {
        grid.innerHTML = `<div class="loading-horarios">No hay horarios disponibles para esta fecha.</div>`;
        return;
    }
    
    // ✅ ACTUALIZAR cronogramaActual GLOBAL
    window.cronogramaActual = cronograma;
    cronogramaActual = cronograma;
    
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
            renderBloques(cronogramaActual);
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

    // ✅ INICIALIZAR cronogramaActual DESDE WINDOW
    if (window.cronogramaActual && Array.isArray(window.cronogramaActual)) {
        cronogramaActual = window.cronogramaActual;
        renderBloques(cronogramaActual);
    }

    fechaInput.addEventListener('change', function() {
        fechaSeleccionada = this.value;
        bloquesSeleccionados = [];
        actualizarMonto();
        // NO LLAMES cargarHorarios aquí, el fetch lo hace reservar_area.php
    });

    // ✅ BOTÓN DE PAGO CULQI CORREGIDO
    document.getElementById('btnPagarCulqi').onclick = function() {
        console.log('🔍 Debug - Clic en Pagar con Culqi');
        console.log('🔍 Debug - bloquesSeleccionados:', bloquesSeleccionados);
        console.log('🔍 Debug - cronogramaActual:', cronogramaActual);
        console.log('🔍 Debug - window.cronogramaActual:', window.cronogramaActual);
        
        if (bloquesSeleccionados.length === 0) {
            alert('Selecciona al menos un horario');
            return;
        }
        
        // ✅ VALIDAR QUE cronogramaActual EXISTA
        const cronogramaParaUsar = cronogramaActual && cronogramaActual.length > 0 ? cronogramaActual : window.cronogramaActual;
        
        if (!cronogramaParaUsar || !Array.isArray(cronogramaParaUsar) || cronogramaParaUsar.length === 0) {
            alert('Error: No se ha cargado el cronograma de horarios');
            console.error('❌ cronogramaActual está vacío o no es válido');
            return;
        }
        
        // ✅ VALIDAR QUE LOS BLOQUES SELECCIONADOS EXISTAN EN EL CRONOGRAMA
        const bloquesValidos = bloquesSeleccionados.filter(idx => 
            idx >= 0 && idx < cronogramaParaUsar.length && cronogramaParaUsar[idx]
        );
        
        if (bloquesValidos.length === 0) {
            alert('Error: Los horarios seleccionados no son válidos');
            console.error('❌ No hay bloques válidos seleccionados');
            return;
        }
        
        // ✅ OBTENER BLOQUES SELECCIONADOS VÁLIDOS
        const bloques = bloquesValidos.map(idx => cronogramaParaUsar[idx]);
        
        console.log('🔍 Debug - bloques mapeados:', bloques);
        
        // ✅ VALIDAR QUE LOS BLOQUES TENGAN LAS PROPIEDADES NECESARIAS
        const bloquesConHorarios = bloques.filter(bloque => 
            bloque && bloque.hora_inicio && bloque.hora_fin
        );
        
        if (bloquesConHorarios.length === 0) {
            alert('Error: Los horarios seleccionados no tienen información válida');
            console.error('❌ Los bloques no tienen hora_inicio/hora_fin válidas');
            return;
        }
        
        // ✅ CONSTRUIR HORARIOS PARA LA RESERVA
        const horaInicio = bloquesConHorarios[0].hora_inicio;
        const horaFin = bloquesConHorarios[bloquesConHorarios.length - 1].hora_fin;
        const monto = parseFloat(document.getElementById('montoPagar').textContent);
        
        console.log('🔍 Debug - Datos de reserva a enviar:', {
            horaInicio,
            horaFin,
            monto,
            cantidad_bloques: bloquesConHorarios.length
        });
        
        const reservaData = {
            usuario_id: window.USER_ID,
            area_id: window.AREA_ID,
            area_nombre: window.AREA_NOMBRE,
            instalacion_id: window.AREA_ID, // Por ahora usa area_id como instalacion_id
            fecha: fechaSeleccionada,
            hora_inicio: horaInicio,
            hora_fin: horaFin,
            monto: monto,
            bloques_seleccionados: bloquesSeleccionados
        };
        
        console.log('🚀 Iniciando pago con Culqi:', reservaData);
        
        // ✅ VERIFICAR QUE CULQI INTEGRATION ESTÉ DISPONIBLE
        if (window.culqiIntegration && typeof window.culqiIntegration.procesarPagoCompleto === 'function') {
            window.culqiIntegration.procesarPagoCompleto(reservaData);
        } else {
            alert('Error: Sistema de pagos no disponible');
            console.error('❌ culqiIntegration no está disponible');
        }
    };
    
    // ✅ RENDERIZAR INICIAL SI HAY DATOS
    if (cronogramaActual.length > 0) {
        renderBloques(cronogramaActual);
    }
});

// Hacer globales las funciones para inicialización desde PHP
window.cargarHorarios = cargarHorarios;
window.actualizarMonto = actualizarMonto;
window.renderBloques = renderBloques;

// ✅ FUNCIÓN GLOBAL PARA ACTUALIZAR CRONOGRAMA DESDE PHP
window.actualizarCronograma = function(nuevoCronograma) {
    console.log('🔄 Actualizando cronograma desde PHP:', nuevoCronograma);
    
    if (nuevoCronograma && Array.isArray(nuevoCronograma)) {
        window.cronogramaActual = nuevoCronograma;
        cronogramaActual = nuevoCronograma;
        
        // Limpiar selección anterior
        bloquesSeleccionados = [];
        
        // Renderizar nuevo cronograma
        renderBloques(cronogramaActual);
    } else {
        console.error('❌ Cronograma recibido no es válido:', nuevoCronograma);
        renderBloques([]);
    }
};
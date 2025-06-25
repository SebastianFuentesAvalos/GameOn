<?php
session_start();
if (!isset($_SESSION['user_id']) || $_SESSION['user_type'] !== 'deportista') {
    header("Location: ../Auth/login.php");
    exit();
}
$areaId = isset($_GET['area_id']) ? intval($_GET['area_id']) : 0;
$areaNombre = isset($_GET['area_nombre']) ? urldecode($_GET['area_nombre']) : '';
include_once 'header.php';
?>
<link rel="stylesheet" href="../../Public/css/reservar_area.css">
<script src="https://checkout.culqi.com/js/v4"></script>
<script src="../../Public/js/culqi_integration.js"></script>
<script src="../../Public/js/paypal_integration.js"></script>

<div class="reserva-area-main">
    <a href="insdepor.php" class="btn-volver"><i class="fas fa-arrow-left"></i> Volver a instalaciones</a>
    <div class="reserva-area-header">
        <h2><i class="fas fa-calendar-plus"></i> Reservar Área Deportiva</h2>
        <div class="area-info">
            <span class="area-nombre"><?= htmlspecialchars($areaNombre) ?></span>
        </div>
    </div>
    <div class="reserva-area-filtros">
        <label for="fechaReserva"><i class="fas fa-calendar-day"></i> Fecha:</label>
        <input type="date" id="fechaReserva" min="<?= date('Y-m-d') ?>" value="<?= date('Y-m-d') ?>">
        <div class="tarifa-info">
            <span><i class="fas fa-money-bill-wave"></i> Tarifa: S/ <span id="tarifaPorHora">0.00</span> /hora</span>
        </div>
        <div class="monto-info">
            <span><i class="fas fa-wallet"></i> Monto a pagar: <strong>S/ <span id="montoPagar">0.00</span></strong></span>
        </div>
    </div>
    <div id="horariosGrid" class="reserva-area-grid">
        <!-- Aquí se cargan los bloques de horarios -->
    </div>
    <div class="pago-culqi-zone" id="pagoCulqiZone" style="display:none;">
        <div class="payment-methods" style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
            <button class="btn btn-primary" id="btnPagarCulqi" style="background: #007bff; border-color: #007bff;">
                <i class="fas fa-credit-card"></i> Pagar con Culqi
            </button>
            <button class="btn btn-paypal" id="btnPagarPayPal" style="background: #0070ba; border-color: #0070ba; color: white;">
                <i class="fab fa-paypal"></i> Pagar con PayPal
            </button>
        </div>
    </div>
</div>

<!-- Modal de confirmación -->
<div class="modal-reserva" id="modalConfirmarReserva" style="display:none;">
    <div class="modal-reserva-content">
        <h3>Confirmar Reserva</h3>
        <p id="modalReservaTexto"></p>
        <div class="modal-reserva-actions">
            <button class="btn btn-primary" id="btnConfirmarReserva">Confirmar</button>
            <button class="btn btn-secondary" id="btnCancelarReserva">Cancelar</button>
        </div>
    </div>
</div>

<script>
window.AREA_ID = <?= $areaId ?>;
window.AREA_NOMBRE = "<?= htmlspecialchars($areaNombre) ?>";
window.USER_ID = <?= $_SESSION['user_id'] ?>;
window.TARIFA_POR_HORA = 0;

// Cargar tarifa y cronograma juntos
function cargarTarifaYHorarios() {
    const fecha = document.getElementById('fechaReserva').value;
    
    // ✅ MOSTRAR LOADING
    document.getElementById('horariosGrid').innerHTML = '<div class="loading-horarios">Cargando horarios...</div>';
    
    fetch('../../Controllers/AreasPublicController.php?action=get_area_cronograma&area_id=' + window.AREA_ID + '&fecha=' + fecha)
        .then(r => r.json())
        .then(data => {
            console.log('📡 Respuesta del servidor:', data);
            
            if (data.success) {
                // ✅ ACTUALIZAR TARIFA
                const tarifa = parseFloat(data.tarifa_por_hora) || 0;
                document.getElementById('tarifaPorHora').textContent = tarifa.toFixed(2);
                window.TARIFA_POR_HORA = tarifa;
                
                // ✅ ACTUALIZAR CRONOGRAMA
                const cronograma = data.cronograma || [];
                window.cronogramaActual = cronograma;
                
                console.log('✅ Tarifa cargada:', tarifa);
                console.log('✅ Cronograma cargado:', cronograma);
                
                // ✅ LLAMAR A FUNCIÓN GLOBAL PARA ACTUALIZAR
                if (typeof window.actualizarCronograma === 'function') {
                    window.actualizarCronograma(cronograma);
                } else if (typeof renderBloques === 'function') {
                    renderBloques(cronograma);
                }
                
                // ✅ ACTUALIZAR MONTO
                if (typeof actualizarMonto === 'function') {
                    actualizarMonto();
                }
            } else {
                console.error('❌ Error del servidor:', data.message);
                document.getElementById('tarifaPorHora').textContent = '0.00';
                window.TARIFA_POR_HORA = 0;
                window.cronogramaActual = [];
                
                if (typeof window.actualizarCronograma === 'function') {
                    window.actualizarCronograma([]);
                } else if (typeof renderBloques === 'function') {
                    renderBloques([]);
                }
            }
        })
        .catch(error => {
            console.error('❌ Error cargando datos:', error);
            document.getElementById('tarifaPorHora').textContent = '0.00';
            window.TARIFA_POR_HORA = 0;
            window.cronogramaActual = [];
            document.getElementById('horariosGrid').innerHTML = '<div class="loading-horarios">Error cargando horarios</div>';
        });
}

// Llama a cargarTarifaYHorarios al cargar y al cambiar la fecha
document.addEventListener('DOMContentLoaded', function() {
    cargarTarifaYHorarios();
    document.getElementById('fechaReserva').addEventListener('change', cargarTarifaYHorarios);
    
    // ✅ BOTÓN PAGO CULQI ACTUALIZADO
    document.getElementById('btnPagarCulqi').onclick = function() {
        if (bloquesSeleccionados.length === 0) {
            alert('Selecciona al menos un horario');
            return;
        }
        
        // ✅ PREPARAR DATOS DE RESERVA
        const bloques = bloquesSeleccionados.map(idx => window.cronogramaActual[idx]);
        const horaInicio = bloques[0].hora_inicio;
        const horaFin = bloques[bloques.length - 1].hora_fin;
        const monto = parseFloat(document.getElementById('montoPagar').textContent);
        
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
        
        // ✅ INICIAR PROCESO DE PAGO
        window.culqiIntegration.procesarPagoCompleto(reservaData);
    };
    
    // ✅ BOTÓN PAGO PAYPAL
    document.getElementById('btnPagarPayPal').onclick = function() {
        if (bloquesSeleccionados.length === 0) {
            alert('Selecciona al menos un horario');
            return;
        }
        
        // ✅ PREPARAR DATOS DE RESERVA (IGUAL QUE CULQI)
        const bloques = bloquesSeleccionados.map(idx => window.cronogramaActual[idx]);
        const horaInicio = bloques[0].hora_inicio;
        const horaFin = bloques[bloques.length - 1].hora_fin;
        const monto = parseFloat(document.getElementById('montoPagar').textContent);
        
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
        
        console.log('🚀 Iniciando pago con PayPal:', reservaData);
        
        // ✅ VERIFICAR QUE PAYPAL INTEGRATION ESTÉ DISPONIBLE
        if (window.paypalIntegration && typeof window.paypalIntegration.procesarPagoCompleto === 'function') {
            window.paypalIntegration.procesarPagoCompleto(reservaData);
        } else {
            alert('Error: Sistema de pagos PayPal no disponible');
            console.error('❌ paypalIntegration no está disponible');
        }
    };
});
</script>
<script src="../../Public/js/reservar_area.js"></script>
<?php include_once 'footer.php'; ?>
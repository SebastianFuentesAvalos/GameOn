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
        <button class="btn btn-primary" id="btnPagarCulqi"><i class="fas fa-credit-card"></i> Pagar con Culqi</button>
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
    fetch('../../Controllers/AreasPublicController.php?action=get_area_cronograma&area_id=' + window.AREA_ID + '&fecha=' + fecha)
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                document.getElementById('tarifaPorHora').textContent = data.tarifa_por_hora.toFixed(2);
                window.TARIFA_POR_HORA = data.tarifa_por_hora;
                // ACTUALIZA cronogramaActual
                window.cronogramaActual = data.cronograma || [];
                if (typeof renderBloques === 'function') {
                    renderBloques(window.cronogramaActual);
                }
                if (typeof actualizarMonto === 'function') actualizarMonto();
            } else {
                document.getElementById('tarifaPorHora').textContent = '0.00';
                window.TARIFA_POR_HORA = 0;
                window.cronogramaActual = [];
                if (typeof renderBloques === 'function') renderBloques([]);
            }
        });
}

// Llama a cargarTarifaYHorarios al cargar y al cambiar la fecha
document.addEventListener('DOMContentLoaded', function() {
    cargarTarifaYHorarios();
    document.getElementById('fechaReserva').addEventListener('change', cargarTarifaYHorarios);
});
</script>
<script src="../../Public/js/reservar_area.js"></script>
<?php include_once 'footer.php'; ?>
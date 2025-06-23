<?php
require_once __DIR__ . '/../Models/AreasPublicModel.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'get_area') {
    $areaId = intval($_GET['area_id'] ?? 0);
    $model = new AreasPublicModel();
    $area = $model->getAreaById($areaId);
    header('Content-Type: application/json');
    if ($area) {
        echo json_encode(['success' => true, 'area' => $area]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Área no encontrada']);
    }
    exit;
}

// NUEVO ENDPOINT: Tarifa y cronograma juntos para reservar_area.php
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'get_area_cronograma') {
    $areaId = intval($_GET['area_id'] ?? 0);
    $fecha = $_GET['fecha'] ?? date('Y-m-d');
    require_once __DIR__ . '/../Models/ReservaModel.php';
    $modelArea = new AreasPublicModel();
    $modelReserva = new ReservaModel();
    $area = $modelArea->getAreaById($areaId);
    $cronograma = $modelReserva->getCronogramaPublicoArea($areaId, $fecha);
    header('Content-Type: application/json');
    if ($area) {
        echo json_encode([
            'success' => true,
            'tarifa_por_hora' => floatval($area['tarifa_por_hora']),
            'cronograma' => $cronograma,
            'area_nombre' => $area['nombre_area']
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Área no encontrada']);
    }
    exit;
}
?>
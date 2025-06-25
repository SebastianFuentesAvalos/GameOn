<?php
require_once __DIR__ . '/../Models/ReservaModel.php';

class ReservaController {
    private $reservaModel;

    public function __construct() {
        $this->reservaModel = new ReservaModel();
    }

    // NUEVO: Manejar solicitudes GET y POST
    public function handleRequest() {
        // ✅ AGREGAR HEADERS JSON AL INICIO
        header('Content-Type: application/json');
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type');
        
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit();
        }
        
        $method = $_SERVER['REQUEST_METHOD'];
        
        if ($method === 'GET') {
            $this->obtenerReservas();
        } elseif ($method === 'POST') {
            $action = $_POST['action'] ?? '';
            
            // ✅ SI NO HAY ACTION EN POST, BUSCAR EN JSON
            if (empty($action)) {
                $input = json_decode(file_get_contents('php://input'), true);
                $action = $input['action'] ?? '';
            }
            
            error_log("ReservaController - Action: " . $action);
            
            switch($action) {
                case 'crear_reserva':
                    $this->crearReserva();
                    break;
                case 'create_reservation': // CULQI
                    $this->createReservationWithPayment();
                    break;
                case 'create_reservation_paypal': // ✅ PAYPAL
                    $this->createReservationWithPayPal();
                    break;
                default:
                    echo json_encode([
                        'success' => false, 
                        'message' => 'Acción POST no válida: ' . $action
                    ]);
                    break;
            }
        } else {
            echo json_encode([
                'success' => false, 
                'message' => 'Método HTTP no soportado: ' . $method
            ]);
        }
    }

    public function obtenerReservas() {
        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            $action = $_GET['action'] ?? '';
            
            switch($action) {
                case 'getCronograma':
                case 'getHorarios':
                    $this->obtenerCronogramaArea();
                    break;
                case 'obtener_eventos_mes':
                    $this->obtenerEventosMes();
                    break;
                case 'obtener_proximas_reservas':
                    $this->obtenerProximasReservas();
                    break;
                case 'obtener_proximos_torneos':
                    $this->obtenerProximosTorneos();
                    break;
                case 'obtener_equipos_usuario':
                    $this->obtenerEquiposUsuario();
                    break;
                case 'reservas_institucion':
                    $this->obtenerReservasInstitucion();
                    break;
                case 'get_cronograma_publico':
                    $this->obtenerCronogramaPublico();
                    break;
                default:
                    $this->sendError('Acción no válida');
                    break;
            }
        } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $action = $_POST['action'] ?? '';
            
            // ✅ MANEJAR JSON INPUT PARA CULQI
            if (empty($action)) {
                $input = json_decode(file_get_contents('php://input'), true);
                $action = $input['action'] ?? '';
            }
            
            switch($action) {
                case 'crear_reserva':
                    $this->crearReserva();
                    break;
                case 'create_reservation': // ✅ NUEVO PARA CULQI
                    $this->createReservationWithPayment();
                    break;
                case 'create_reservation_paypal': // ✅ NUEVO PARA PAYPAL
                    $this->createReservationWithPayPal();
                    break;
                default:
                    $this->sendError('Acción POST no válida');
                    break;
            }
        }
    }

    // ✅ NUEVO: Obtener cronograma de área deportiva
    private function obtenerCronogramaArea() {
        try {
            $areaId = intval($_GET['area_id'] ?? $_GET['id'] ?? 0);
            $fecha = $_GET['fecha'] ?? null;

            if ($areaId <= 0) {
                throw new Exception('ID de área deportiva inválido');
            }

            $cronograma = $this->reservaModel->obtenerCronogramaAreaDeportiva($areaId, $fecha);
            
            if (!$cronograma) {
                throw new Exception('Área deportiva no encontrada');
            }

            $this->sendSuccess($cronograma);

        } catch (Exception $e) {
            $this->sendError($e->getMessage());
        }
    }

    // ✅ NUEVO: Obtener reservas para instituciones deportivas
    private function obtenerReservasInstitucion() {
        session_start();
        if (!isset($_SESSION['user_id']) || $_SESSION['user_type'] !== 'instalacion') {
            $this->sendError('Usuario no autorizado');
            return;
        }

        try {
            $usuarioInstalacionId = $_SESSION['user_id'];
            $fecha = $_GET['fecha'] ?? null;
            
            // Obtener reservas normales
            $reservas = $this->reservaModel->obtenerReservasPorUsuarioInstalacion($usuarioInstalacionId, $fecha);
            
            // Obtener partidos de torneos
            $partidos = $this->reservaModel->obtenerPartidosTorneosPorUsuarioInstalacion($usuarioInstalacionId, $fecha);
            
            // ✅ CORRECCIÓN: Enviar directamente sin envolver en 'data'
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'reservas' => $reservas,
                'partidos' => $partidos
            ]);
            exit;
            
        } catch (Exception $e) {
            $this->sendError('Error obteniendo reservas: ' . $e->getMessage());
        }
    }

    // ✅ NUEVO: Crear reserva
    private function crearReserva() {
        session_start();
        if (!isset($_SESSION['user_id']) || $_SESSION['user_type'] !== 'deportista') {
            $this->sendError('Usuario no autorizado');
            return;
        }

        try {
            $usuarioId = $_SESSION['user_id'];
            $areaId = intval($_POST['area_id']);
            $fecha = $_POST['fecha'];
            $horaInicio = $_POST['hora_inicio'];
            $horaFin = $_POST['hora_fin'];

            if (!$areaId || !$fecha || !$horaInicio || !$horaFin) {
                throw new Exception('Datos incompletos');
            }

            $resultado = $this->reservaModel->crearReserva($usuarioId, $areaId, $fecha, $horaInicio, $horaFin);
            
            if ($resultado['success']) {
                $this->sendSuccess($resultado);
            } else {
                $this->sendError($resultado['message']);
            }

        } catch (Exception $e) {
            $this->sendError('Error creando reserva: ' . $e->getMessage());
        }
    }

    // ✅ NUEVO: Crear reserva con pago
    public function createReservationWithPayment() {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            $usuarioId = $input['usuario_id'];
            $areaId = $input['area_id'];
            $fecha = $input['fecha'];
            $horaInicio = $input['hora_inicio'];
            $horaFin = $input['hora_fin'];
            $culqiChargeId = $input['culqi_charge_id'];
            $montoPagado = floatval($input['monto']);
            
            // ✅ INSERTAR RESERVA CON DATOS DE CULQI
            $resultado = $this->reservaModel->crearReservaConPago(
                $usuarioId, 
                $areaId, 
                $fecha, 
                $horaInicio, 
                $horaFin, 
                $culqiChargeId, 
                $montoPagado
            );
            
            if ($resultado['success']) {
                echo json_encode([
                    'success' => true,
                    'reserva_id' => $resultado['reserva_id'],
                    'message' => 'Reserva creada exitosamente'
                ]);
            } else {
                throw new Exception($resultado['message']);
            }
            
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ]);
        }
    }

    // ✅ NUEVO: Crear reserva con pago PayPal
    public function createReservationWithPayPal() {
        // ✅ LIMPIAR CUALQUIER OUTPUT PREVIO Y CONFIGURAR HEADERS
        if (ob_get_length()) ob_clean();
        
        header('Content-Type: application/json; charset=utf-8');
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: POST');
        header('Access-Control-Allow-Headers: Content-Type');
        
        // ✅ CONFIGURAR ERROR REPORTING PARA CAPTURAR ERRORES PHP
        error_reporting(E_ALL);
        ini_set('display_errors', 0);
        ini_set('log_errors', 1);
        
        $response = null;
        
        try {
            error_log("=== INICIO createReservationWithPayPal ===");
            
            // ✅ LEER INPUT JSON
            $rawInput = file_get_contents('php://input');
            error_log("PayPal - Raw input: " . $rawInput);
            
            if (empty($rawInput)) {
                throw new Exception('No se recibió contenido JSON');
            }
            
            $input = json_decode($rawInput, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new Exception('JSON inválido: ' . json_last_error_msg());
            }
            
            error_log("PayPal - Input decodificado: " . print_r($input, true));
            
            // ✅ VALIDAR DATOS REQUERIDOS
            $requiredFields = ['usuario_id', 'area_id', 'fecha', 'hora_inicio', 'hora_fin', 'paypal_payment_id', 'monto'];
            foreach ($requiredFields as $field) {
                if (!isset($input[$field]) || empty($input[$field])) {
                    throw new Exception("Campo requerido faltante: $field");
                }
            }
            
            // ✅ EXTRAER DATOS
            $usuarioId = intval($input['usuario_id']);
            $areaId = intval($input['area_id']);
            $fecha = $input['fecha'];
            $horaInicio = $input['hora_inicio'];
            $horaFin = $input['hora_fin'];
            $paypalPaymentId = $input['paypal_payment_id'];
            $paypalPayerId = $input['paypal_payer_id'] ?? 'sandbox_payer';
            $montoPagado = floatval($input['monto']);
            
            error_log("PayPal - Datos extraídos: Usuario=$usuarioId, Area=$areaId, Monto=$montoPagado");
            
            // ✅ VALIDACIONES BÁSICAS
            if ($usuarioId <= 0) throw new Exception('Usuario ID inválido');
            if ($areaId <= 0) throw new Exception('Área ID inválida');
            if ($montoPagado <= 0) throw new Exception('Monto inválido');
            
            // ✅ VERIFICAR QUE EL MODELO EXISTA
            if (!$this->reservaModel) {
                throw new Exception('Modelo de reserva no disponible');
            }
            
            // ✅ CREAR RESERVA USANDO EL MODELO
            error_log("PayPal - Llamando al modelo para crear reserva...");
            
            $resultado = $this->reservaModel->crearReservaConPayPal(
                $usuarioId, $areaId, $fecha, $horaInicio, $horaFin,
                $paypalPaymentId, $paypalPayerId, $montoPagado
            );
            
            error_log("PayPal - Resultado del modelo: " . print_r($resultado, true));
            
            // ✅ VERIFICAR RESULTADO
            if (!$resultado || !is_array($resultado)) {
                throw new Exception('El modelo no devolvió un resultado válido');
            }
            
            if ($resultado['success']) {
                $response = [
                    'success' => true,
                    'reserva_id' => $resultado['reserva_id'] ?? 0,
                    'message' => 'Reserva creada exitosamente con PayPal',
                    'payment_id' => $paypalPaymentId,
                    'payer_id' => $paypalPayerId
                ];
            } else {
                throw new Exception($resultado['message'] ?? 'Error desconocido al crear reserva');
            }
            
        } catch (Exception $e) {
            error_log("PayPal - ERROR: " . $e->getMessage());
            error_log("PayPal - ERROR Trace: " . $e->getTraceAsString());
            
            $response = [
                'success' => false,
                'message' => 'Error: ' . $e->getMessage(),
                'error_type' => get_class($e),
                'error_line' => $e->getLine(),
                'error_file' => basename($e->getFile())
            ];
        }
        
        // ✅ ASEGURAR QUE SIEMPRE SE ENVÍE JSON VÁLIDO
        if (!$response) {
            $response = [
                'success' => false,
                'message' => 'Error: No se generó respuesta válida'
            ];
        }
        
        // ✅ CODIFICAR Y ENVIAR JSON
        $jsonResponse = json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log("PayPal - Error encoding JSON: " . json_last_error_msg());
            $jsonResponse = json_encode([
                'success' => false,
                'message' => 'Error interno del servidor (JSON encoding failed)'
            ]);
        }
        
        error_log("PayPal - Enviando respuesta: " . $jsonResponse);
        
        // ✅ ENVIAR RESPUESTA Y TERMINAR
        echo $jsonResponse;
        exit();
    }

    // ✅ MÉTODO AUXILIAR PARA CREAR RESERVA DIRECTAMENTE
    private function crearReservaDirectaPayPal($usuarioId, $areaId, $fecha, $horaInicio, $horaFin, $paypalPaymentId, $paypalPayerId, $montoPagado) {
        try {
            // ✅ OBTENER CONEXIÓN A BD
            $database = new Database();
            $conn = $database->getConnection();
            
            // ✅ VERIFICAR DISPONIBILIDAD
            $queryDisponibilidad = "SELECT COUNT(*) as conflictos 
                               FROM reservas 
                               WHERE area_deportiva_id = ? 
                               AND fecha = ? 
                               AND estado IN ('confirmada', 'pendiente')
                               AND (
                                   (hora_inicio <= ? AND hora_fin > ?) OR
                                   (hora_inicio < ? AND hora_fin >= ?) OR
                                   (hora_inicio >= ? AND hora_fin <= ?)
                               )";
            
            $stmt = $conn->prepare($queryDisponibilidad);
            $stmt->bind_param("isssssss", $areaId, $fecha, $horaInicio, $horaInicio, $horaFin, $horaFin, $horaInicio, $horaFin);
            $stmt->execute();
            $result = $stmt->get_result();
            $row = $result->fetch_assoc();
            
            if ($row['conflictos'] > 0) {
                $stmt->close();
                return ['success' => false, 'message' => 'El horario ya no está disponible'];
            }
            $stmt->close();
            
            // ✅ INSERTAR RESERVA
            $queryInsert = "INSERT INTO reservas 
                       (id_usuario, area_deportiva_id, fecha, hora_inicio, hora_fin, 
                        estado, paypal_payment_id, paypal_payer_id, monto_pagado, metodo_pago) 
                       VALUES (?, ?, ?, ?, ?, 'confirmada', ?, ?, ?, 'paypal')";
            
            $stmt = $conn->prepare($queryInsert);
            $stmt->bind_param("iissssd", $usuarioId, $areaId, $fecha, $horaInicio, $horaFin, $paypalPaymentId, $paypalPayerId, $montoPagado);
            
            if ($stmt->execute()) {
                $reservaId = $conn->insert_id;
                $stmt->close();
                
                return [
                    'success' => true,
                    'reserva_id' => $reservaId,
                    'message' => 'Reserva creada exitosamente'
                ];
            } else {
                $error = $stmt->error;
                $stmt->close();
                throw new Exception('Error SQL: ' . $error);
            }
            
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Error BD: ' . $e->getMessage()];
        }
    }

    // ✅ MANTENER FUNCIONES EXISTENTES
    private function obtenerEventosMes() {
        session_start();
        if (!isset($_SESSION['user_id'])) {
            $this->sendError('Usuario no autenticado');
            return;
        }

        $fechaInicio = $_GET['fecha_inicio'] ?? '';
        $fechaFin = $_GET['fecha_fin'] ?? '';

        if (!$fechaInicio || !$fechaFin) {
            $this->sendError('Fechas requeridas');
            return;
        }

        try {
            $userId = $_SESSION['user_id'];
            
            $reservas = $this->reservaModel->obtenerReservasPorFecha($userId, $fechaInicio, $fechaFin);
            $torneos = $this->reservaModel->obtenerTorneosPorFecha($userId, $fechaInicio, $fechaFin);
            
            $eventos = [];
            
            foreach ($reservas as $reserva) {
                $eventos[] = [
                    'fecha' => $reserva['fecha'],
                    'tipo' => 'reserva',
                    'titulo' => $reserva['deporte'] . ' ' . substr($reserva['hora_inicio'], 0, 5),
                    'detalle' => $reserva['instalacion'] . ' - ' . $reserva['nombre_area'] . ' (' . $reserva['estado'] . ')'
                ];
            }
            
            foreach ($torneos as $torneo) {
                $eventos[] = [
                    'fecha' => substr($torneo['fecha'], 0, 10),
                    'tipo' => 'torneo',
                    'titulo' => $torneo['deporte_nombre'] . ' - ' . $torneo['torneo_nombre'],
                    'detalle' => $torneo['partido_detalle'] . ' - ' . $torneo['sede_nombre']
                ];
            }
            
            $this->sendSuccess($eventos);
            
        } catch (Exception $e) {
            $this->sendError('Error obteniendo eventos: ' . $e->getMessage());
        }
    }

    private function obtenerProximasReservas() {
        session_start();
        if (!isset($_SESSION['user_id'])) {
            $this->sendError('Usuario no autenticado');
            return;
        }

        try {
            $userId = $_SESSION['user_id'];
            $reservas = $this->reservaModel->obtenerProximasReservas($userId, 5);
            $this->sendSuccess($reservas);
        } catch (Exception $e) {
            $this->sendError('Error obteniendo próximas reservas: ' . $e->getMessage());
        }
    }

    private function obtenerProximosTorneos() {
        session_start();
        if (!isset($_SESSION['user_id'])) {
            $this->sendError('Usuario no autenticado');
            return;
        }

        try {
            $userId = $_SESSION['user_id'];
            $torneos = $this->reservaModel->obtenerProximosTorneos($userId, 5);
            $this->sendSuccess($torneos);
        } catch (Exception $e) {
            $this->sendError('Error obteniendo próximos torneos: ' . $e->getMessage());
        }
    }

    private function obtenerEquiposUsuario() {
        session_start();
        if (!isset($_SESSION['user_id'])) {
            $this->sendError('Usuario no autenticado');
            return;
        }

        try {
            $userId = $_SESSION['user_id'];
            $equipos = $this->reservaModel->obtenerEquiposUsuario($userId);
            $this->sendSuccess($equipos);
        } catch (Exception $e) {
            $this->sendError('Error obteniendo equipos del usuario: ' . $e->getMessage());
        }
    }

    private function sendSuccess($data) {
        header('Content-Type: application/json');
        echo json_encode([
            'success' => true,
            'data' => $data
        ]);
        exit;
    }

    private function sendError($message) {
        header('Content-Type: application/json');
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => $message
        ]);
        exit;
    }

    // ✅ NUEVO: Obtener cronograma público
    private function obtenerCronogramaPublico() {
        try {
            $areaId = intval($_GET['area_id'] ?? 0);
            $fecha = $_GET['fecha'] ?? date('Y-m-d');
            $cronogramaData = $this->reservaModel->obtenerCronogramaAreaDeportiva($areaId, $fecha);

            if ($cronogramaData && isset($cronogramaData['cronograma'])) {
                // SIEMPRE responde success, aunque el cronograma esté vacío
                $this->sendSuccess(['cronograma' => $cronogramaData['cronograma']]);
            } else if ($cronogramaData && isset($cronogramaData['cerrado']) && $cronogramaData['cerrado']) {
                // Si está cerrado, responde success pero con cronograma vacío
                $this->sendSuccess(['cronograma' => []]);
            } else {
                $this->sendError('No se pudo cargar el cronograma.');
            }
        } catch (Exception $e) {
            $this->sendError('Error: ' . $e->getMessage());
        }
    }
}

// NUEVO ENDPOINT: Cronograma público para reservar_area.php
if ($_SERVER['REQUEST_METHOD'] === 'GET' && ($_GET['action'] ?? '') === 'get_cronograma_publico') {
    require_once __DIR__ . '/../Models/ReservaModel.php';
    $areaId = intval($_GET['area_id'] ?? 0);
    $fecha = $_GET['fecha'] ?? date('Y-m-d');
    $model = new ReservaModel();
    $bloques = $model->getCronogramaPublicoArea($areaId, $fecha);
    header('Content-Type: application/json');
    echo json_encode(['success' => true, 'cronograma' => $bloques]);
    exit;
}

$controller = new ReservaController();
$controller->handleRequest();
?>
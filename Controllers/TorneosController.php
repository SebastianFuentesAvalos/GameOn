<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
?>
<?php
require_once __DIR__ . '/../Models/TorneosModel.php';
require_once __DIR__ . '/../Models/TorneosPartidosModel.php';
class TorneosController {
    private $torneosModel;
    private $partidosModel; // ✅ AÑADIR esta propiedad
    
    public function __construct() {
        $this->torneosModel = new TorneosModel();
        $this->partidosModel = new TorneosPartidosModel(); // ✅ Inicializar en el constructor
    }
    
    private function verificarAutenticacion() {
        if (session_status() == PHP_SESSION_NONE) {
            session_start();
        }
        
        if (!isset($_SESSION['user_id'])) {
            $this->response(['success' => false, 'message' => 'No autenticado']);
            return false;
        }
        return true;
    }
    
    private function response($data) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    // ✅ FUNCIÓN EXISTENTE - Actualizada para instituciones
    public function obtenerTorneos() {
        if (!$this->verificarAutenticacion()) return;
        
        $filtros = [
            'deporte_id' => $_GET['deporte_id'] ?? null,
            'estado' => $_GET['estado'] ?? null,
            'calificacion_min' => $_GET['calificacion_min'] ?? 0,
            'nombre' => $_GET['nombre'] ?? '',
            'organizador_tipo' => $_GET['organizador_tipo'] ?? null
        ];
        
        // ✅ NUEVO: Si es institución deportiva, filtrar por sus torneos
        if (isset($_SESSION['user_type']) && $_SESSION['user_type'] === 'instalacion') {
            $filtros['usuario_instalacion_id'] = $_SESSION['user_id'];
            $usuarioId = null; // Las instituciones no necesitan verificación de inscripción
        } else {
            $usuarioId = $_SESSION['user_id']; // Para deportistas, verificar inscripciones
        }
        
        try {
            // ✅ PASAR USUARIO_ID PARA VERIFICAR INSCRIPCIONES
            $torneos = $this->torneosModel->obtenerTorneosConFiltros($filtros, $usuarioId);
            
            // ✅ AGREGAR INFORMACIÓN ADICIONAL PARA CADA TORNEO
            foreach ($torneos as &$torneo) {
                // Determinar el estado de la tarjeta para el usuario
                $torneo['estado_tarjeta'] = $this->determinarEstadoTarjeta($torneo);
                
                // Agregar equipos inscritos del usuario si está logueado
                if ($usuarioId && $torneo['usuario_inscrito'] > 0) {
                    $torneo['equipos_usuario_inscritos'] = $this->torneosModel->obtenerEquiposInscritosUsuario($torneo['id'], $usuarioId);
                }
            }
            
            $this->response(['success' => true, 'torneos' => $torneos]);
        } catch (Exception $e) {
            $this->response(['success' => false, 'message' => 'Error al obtener torneos: ' . $e->getMessage()]);
        }
    }

    // ✅ NUEVA FUNCIÓN: Determinar el estado de la tarjeta del torneo
    private function determinarEstadoTarjeta($torneo) {
        // ✅ 1. VERIFICAR SI EL USUARIO YA ESTÁ INSCRITO
        if ($torneo['usuario_inscrito'] > 0) {
            return [
                'tipo' => 'ya_inscrito',
                'texto' => 'Ya Inscrito',
                'clase' => 'estado-ya-inscrito',
                'icono' => 'fas fa-check-circle',
                'puede_ver_detalles' => true,
                'puede_inscribirse' => false,
                'mensaje' => 'Tu equipo ya está inscrito en este torneo'
            ];
        }
        
        // ✅ 2. VERIFICAR AFORO LLENO
        if ($torneo['aforo_lleno']) {
            return [
                'tipo' => 'aforo_lleno',
                'texto' => 'Aforo Lleno',
                'clase' => 'estado-aforo-lleno',
                'icono' => 'fas fa-users-slash',
                'puede_ver_detalles' => true,
                'puede_inscribirse' => false,
                'mensaje' => 'Este torneo ya alcanzó su máximo de equipos'
            ];
        }
        
        // ✅ 3. VERIFICAR ESTADO NORMAL DEL TORNEO
        switch ($torneo['estado']) {
            case 'inscripciones_abiertas':
                if ($torneo['cupos_disponibles'] > 0) {
                    return [
                        'tipo' => 'disponible',
                        'texto' => 'Inscripciones Abiertas',
                        'clase' => 'estado-inscripciones-abiertas',
                        'icono' => 'fas fa-door-open',
                        'puede_ver_detalles' => true,
                        'puede_inscribirse' => true,
                        'mensaje' => $torneo['cupos_disponibles'] . ' cupos disponibles'
                    ];
                } else {
                    return [
                        'tipo' => 'aforo_lleno',
                        'texto' => 'Aforo Lleno',
                        'clase' => 'estado-aforo-lleno',
                        'icono' => 'fas fa-users-slash',
                        'puede_ver_detalles' => true,
                        'puede_inscribirse' => false,
                        'mensaje' => 'No hay cupos disponibles'
                    ];
                }
                
            case 'proximo':
                return [
                    'tipo' => 'proximo',
                    'texto' => 'Próximo',
                    'clase' => 'estado-proximo',
                    'icono' => 'fas fa-calendar-plus',
                    'puede_ver_detalles' => true,
                    'puede_inscribirse' => false,
                    'mensaje' => 'Inscripciones aún no abiertas'
                ];
                
            case 'activo':
                return [
                    'tipo' => 'activo',
                    'texto' => 'En Curso',
                    'clase' => 'estado-activo',
                    'icono' => 'fas fa-play',
                    'puede_ver_detalles' => true,
                    'puede_inscribirse' => false,
                    'mensaje' => 'Torneo en desarrollo'
                ];
                
            case 'finalizado':
                return [
                    'tipo' => 'finalizado',
                    'texto' => 'Finalizado',
                    'clase' => 'estado-finalizado',
                    'icono' => 'fas fa-flag-checkered',
                    'puede_ver_detalles' => true,
                    'puede_inscribirse' => false,
                    'mensaje' => 'Torneo terminado'
                ];
                
            default:
                return [
                    'tipo' => 'no_disponible',
                    'texto' => 'No Disponible',
                    'clase' => 'estado-no-disponible',
                    'icono' => 'fas fa-times-circle',
                    'puede_ver_detalles' => true,
                    'puede_inscribirse' => false,
                    'mensaje' => 'Torneo no disponible'
                ];
        }
    }
    
    // ✅ NUEVA FUNCIÓN: Crear torneo desde institución deportiva
    public function crearTorneo() {
        if (!$this->verificarAutenticacion()) return;
        
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->response(['success' => false, 'message' => 'Método no permitido']);
        }
        
        // Solo instituciones pueden crear torneos por esta ruta
        if ($_SESSION['user_type'] !== 'instalacion') {
            $this->response(['success' => false, 'message' => 'Solo instituciones deportivas pueden crear torneos']);
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Guardar la imagen remota en el servidor local si se proporciona una URL
        $imagenLocal = null;
        if (!empty($input['imagen_torneo'])) {
            $imagenLocal = $this->guardarImagenRemota($input['imagen_torneo']);
        }
        
        $datos = [
            'nombre' => trim($input['nombre'] ?? ''),
            'descripcion' => trim($input['descripcion'] ?? ''),
            'deporte_id' => $input['deporte_id'] ?? 0,
            'organizador_tipo' => 'institucion',
            'organizador_id' => $_SESSION['user_id'],
            'institucion_sede_id' => $input['institucion_sede_id'] ?? 0,
            'max_equipos' => $input['max_equipos'] ?? 16,
            'fecha_inicio' => $input['fecha_inicio'] ?? '',
            'fecha_fin' => $input['fecha_fin'] ?? '',
            'fecha_inscripcion_inicio' => $input['fecha_inscripcion_inicio'] ?? '',
            'fecha_inscripcion_fin' => $input['fecha_inscripcion_fin'] ?? '',
            'modalidad' => $input['modalidad'] ?? 'eliminacion_simple',
            'premio_1' => trim($input['premio_1'] ?? ''),
            'premio_2' => trim($input['premio_2'] ?? ''),
            'premio_3' => trim($input['premio_3'] ?? ''),
            'costo_inscripcion' => $input['costo_inscripcion'] ?? 0.00,
            'imagen_torneo' => $imagenLocal
        ];
        
        // Validaciones básicas
        if (empty($datos['nombre']) || empty($datos['deporte_id']) || empty($datos['institucion_sede_id'])) {
            $this->response(['success' => false, 'message' => 'Nombre, deporte y sede son requeridos']);
        }
        
        try {
            $resultado = $this->torneosModel->crearTorneo($datos);
            
            if ($resultado['success']) {
                $torneoId = $resultado['torneo_id'];
                
                // Crear partidos programados
                if (!empty($input['partidos_programados'])) {
                    $partidosCreados = 0;
                    foreach ($input['partidos_programados'] as $partido) {
                        // ✅ CORREGIR: Usar valores por defecto si no existen las claves
                        $partidoInfo = [
                            'fase' => $partido['fase'] ?? 'Primera Ronda',
                            'numeroPartido' => $partido['numeroPartido'] ?? 1,
                            'ronda' => $partido['ronda'] ?? 1,
                            'descripcion' => $partido['descripcion'] ?? ($partido['partidoNombre'] ?? 'Partido')
                        ];
                        
                        // Si no existe numeroPartido, extraerlo del partidoId
                        if (!isset($partido['numeroPartido']) && isset($partido['partidoId'])) {
                            $partidoIdParts = explode('-', $partido['partidoId']);
                            $partidoInfo['numeroPartido'] = intval(end($partidoIdParts));
                            
                            // Extraer ronda del partidoId también
                            if (preg_match('/ronda(\d+)/', $partido['partidoId'], $matches)) {
                                $partidoInfo['ronda'] = intval($matches[1]);
                            }
                        }
                        
                        $resultadoPartido = $this->partidosModel->crearPartidoTorneo(
                            $torneoId,
                            $partido['areaId'],
                            $partido['fecha'],
                            $partido['horaInicio'],
                            $partido['horaFin'],
                            $partidoInfo
                        );
                        
                        if ($resultadoPartido['success']) {
                            $partidosCreados++;
                        }
                    }
                    
                    $resultado['message'] .= " Se programaron $partidosCreados partidos.";
                }
            }
            
            $this->response($resultado);
        } catch (Exception $e) {
            $this->response(['success' => false, 'message' => 'Error al crear torneo: ' . $e->getMessage()]);
        }
    }

    // Método para guardar la imagen desde URL remota
    private function guardarImagenRemota($url) {
        return $url;
    }

    // ✅ FUNCIÓN ACTUALIZADA: actualizarTorneo en el controlador
    public function actualizarTorneo() {
        if (session_status() == PHP_SESSION_NONE) {
            session_start();
        }
        
        header('Content-Type: application/json');
        
        try {
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                echo json_encode(['success' => false, 'message' => 'Método no permitido']);
                exit;
            }
            
            if (!isset($_SESSION['user_id']) || $_SESSION['user_type'] !== 'instalacion') {
                echo json_encode(['success' => false, 'message' => 'Sin permisos']);
                exit;
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            $torneoId = $input['torneo_id'] ?? null;
            
            if (!$torneoId) {
                echo json_encode(['success' => false, 'message' => 'ID de torneo requerido']);
                exit;
            }
            
            // ✅ SOLO LOS CAMPOS PERMITIDOS
            $datos = [
                'estado' => $input['estado'] ?? 'proximo',
                'nombre' => trim($input['nombre'] ?? ''),
                'fecha_inicio' => $input['fecha_inicio'] ?? '',
                'fecha_fin' => $input['fecha_fin'] ?? '',
                'fecha_inscripcion_inicio' => $input['fecha_inscripcion_inicio'] ?? '',
                'fecha_inscripcion_fin' => $input['fecha_inscripcion_fin'] ?? '',
                'descripcion' => trim($input['descripcion'] ?? '')
            ];
            
            $resultado = $this->torneosModel->actualizarTorneo($torneoId, $datos);
            echo json_encode($resultado);
            
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
        }
        exit;
    }

    // ✅ FUNCIONES EXISTENTES - Mantener como están
    public function obtenerDetallesTorneo() {
        if (!$this->verificarAutenticacion()) return;
        
        $torneo_id = $_GET['torneo_id'] ?? null;
        
        if (!$torneo_id) {
            $this->response(['success' => false, 'message' => 'ID de torneo requerido']);
        }
        
        try {
            // ✅ OBTENER DATOS BÁSICOS DEL TORNEO
            $torneo = $this->torneosModel->obtenerDetallesTorneo($torneo_id);
            
            if (!$torneo) {
                $this->response(['success' => false, 'message' => 'Torneo no encontrado']);
            }
            
            // ✅ OBTENER EQUIPOS INSCRITOS
            $equipos = $this->torneosModel->obtenerEquiposInscritos($torneo_id);
            
            // ✅ CALCULAR CUPOS DISPONIBLES
            $cuposDisponibles = $torneo['max_equipos'] - count($equipos);
            
            // ✅ OBTENER PARTIDOS PROGRAMADOS (si existen)
            $partidos = [];
            if (method_exists($this->partidosModel, 'getPartidosByTorneo')) {
                $partidos = $this->partidosModel->getPartidosByTorneo($torneo_id);
            }
            
            // ✅ PREPARAR RESPUESTA COMPLETA
            $response = [
                'success' => true, 
                'torneo' => $torneo,
                'equipos_inscritos' => $equipos,
                'cupos_disponibles' => $cuposDisponibles,
                'total_equipos_inscritos' => count($equipos),
                'porcentaje_ocupacion' => round((count($equipos) / $torneo['max_equipos']) * 100, 1),
                'partidos_programados' => $partidos,
                'inscripciones_abiertas' => $torneo['estado'] === 'inscripciones_abiertas',
                'puede_inscribirse' => $torneo['estado'] === 'inscripciones_abiertas' && $cuposDisponibles > 0
            ];
            
            $this->response($response);
            
        } catch (Exception $e) {
            error_log("Error obteniendo detalles del torneo: " . $e->getMessage());
            $this->response(['success' => false, 'message' => 'Error obteniendo detalles: ' . $e->getMessage()]);
        }
    }
    
    public function inscribirEquipo() {
        if (!$this->verificarAutenticacion()) return;
        
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->response(['success' => false, 'message' => 'Método no permitido']);
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        $torneo_id = $input['torneo_id'] ?? null;
        $equipo_id = $input['equipo_id'] ?? null;
        
        if (!$torneo_id || !$equipo_id) {
            $this->response(['success' => false, 'message' => 'Datos incompletos']);
        }
        
        try {
            $resultado = $this->torneosModel->inscribirEquipoEnTorneo($torneo_id, $equipo_id, $_SESSION['user_id']);
            $this->response($resultado);
        } catch (Exception $e) {
            $this->response(['success' => false, 'message' => 'Error en inscripción: ' . $e->getMessage()]);
        }
    }
    
    public function obtenerPartidosTorneo() {
        if (!$this->verificarAutenticacion()) return;
        
        $torneoId = $_GET['torneo_id'] ?? null;
        
        if (!$torneoId) {
            $this->response(['success' => false, 'message' => 'ID de torneo requerido']);
        }
        
        try {
            $partidos = $this->partidosModel->obtenerEstructuraTorneo($torneoId);
            $this->response([
                'success' => true,
                'partidos' => $partidos
            ]);
        } catch (Exception $e) {
            $this->response(['success' => false, 'message' => 'Error al obtener partidos: ' . $e->getMessage()]);
        }
    }

    public function actualizarResultadoPartido() {
        if (!$this->verificarAutenticacion()) return;
        
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->response(['success' => false, 'message' => 'Método no permitido']);
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        $partidoId = $input['partido_id'] ?? null;
        
        if (!$partidoId) {
            $this->response(['success' => false, 'message' => 'ID de partido requerido']);
        }
        
        try {
            // Actualizar resultado del partido
            $resultado = $this->partidosModel->actualizarResultadoPartido($partidoId, $input);
            $this->response($resultado);
        } catch (Exception $e) {
            $this->response(['success' => false, 'message' => 'Error al actualizar partido: ' . $e->getMessage()]);
        }
    }

    // ✅ NUEVAS FUNCIONES: Manejo de inscripción de equipos y pagos
    public function obtenerEquiposParaInscripcion() {
        if (!$this->verificarAutenticacion()) return;
        
        $torneoId = $_GET['torneo_id'] ?? null;
        $usuarioId = $_SESSION['user_id'] ?? null; // ✅ CAMBIAR 'usuario' por 'user_id'
        
        if (!$torneoId || !$usuarioId) {
            $this->response(['success' => false, 'message' => 'Datos insuficientes']);
        }
        
        try {
            // ✅ OBTENER EQUIPOS DEL USUARIO
            $equipos = $this->torneosModel->obtenerEquiposUsuario($usuarioId);
            
            // ✅ FILTRAR EQUIPOS YA INSCRITOS
            $equiposDisponibles = [];
            foreach ($equipos as $equipo) {
                if (!$this->torneosModel->verificarEquipoYaInscrito($torneoId, $equipo['id'])) {
                    $equiposDisponibles[] = $equipo;
                }
            }
            
            // ✅ OBTENER INFO DEL TORNEO
            $torneo = $this->torneosModel->obtenerTorneoPorId($torneoId);
            
            $this->response([
                'success' => true,
                'equipos' => $equiposDisponibles,
                'torneo' => $torneo
            ]);
            
        } catch (Exception $e) {
            error_log("Error obteniendo equipos para inscripción: " . $e->getMessage());
            $this->response(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
        }
    }

    public function inscribirEquipoConCulqi() {
        if (!$this->verificarAutenticacion()) return;
        
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            $torneoId = $input['torneo_id'] ?? null;
            $equipoId = $input['equipo_id'] ?? null;
            $culqiTokenId = $input['culqi_token_id'] ?? null;
            $montoPagado = floatval($input['monto'] ?? 0);
            
            if (!$torneoId || !$equipoId || !$culqiTokenId) {
                throw new Exception('Datos insuficientes para la inscripción');
            }
            
            $resultado = $this->torneosModel->inscribirEquipoConPago(
                $torneoId, $equipoId, 'culqi', $culqiTokenId, null, $montoPagado
            );
            
            $this->response($resultado);
            
        } catch (Exception $e) {
            error_log("Error inscripción Culqi: " . $e->getMessage());
            $this->response(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
        }
    }

    public function inscribirEquipoConPayPal() {
        if (!$this->verificarAutenticacion()) return;
        
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            $torneoId = $input['torneo_id'] ?? null;
            $equipoId = $input['equipo_id'] ?? null;
            $paypalPaymentId = $input['paypal_payment_id'] ?? null;
            $paypalPayerId = $input['paypal_payer_id'] ?? null;
            $montoPagado = floatval($input['monto'] ?? 0);
            
            if (!$torneoId || !$equipoId || !$paypalPaymentId) {
                throw new Exception('Datos insuficientes para la inscripción');
            }
            
            $resultado = $this->torneosModel->inscribirEquipoConPago(
                $torneoId, $equipoId, 'paypal', $paypalPaymentId, $paypalPayerId, $montoPagado
            );
            
            $this->response($resultado);
            
        } catch (Exception $e) {
            error_log("Error inscripción PayPal: " . $e->getMessage());
            $this->response(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
        }
    }

    // ✅ AGREGAR ESTE MÉTODO A TorneosController.php

    public function crearOrdenCulqi() {
        if (!$this->verificarAutenticacion()) return;
        
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            $torneoId = $input['torneo_id'] ?? null;
            $equipoId = $input['equipo_id'] ?? null;
            $usuarioId = $input['usuario_id'] ?? null;
            $instalacionId = $input['instalacion_id'] ?? null;
            $monto = floatval($input['monto'] ?? 0);
            $description = $input['description'] ?? '';
            
            if (!$torneoId || !$equipoId || !$usuarioId || !$instalacionId || $monto <= 0) {
                throw new Exception('Datos insuficientes para crear la orden');
            }
            
            // ✅ CREAR ORDEN TEMPORAL (IGUAL QUE RESERVAS)
            $orderId = 'TORNEO_' . $torneoId . '_' . $equipoId . '_' . time();
            
            $order = [
                'id' => $orderId,
                'torneo_id' => $torneoId,
                'equipo_id' => $equipoId,
                'usuario_id' => $usuarioId,
                'instalacion_id' => $instalacionId,
                'monto' => $monto,
                'description' => $description,
                'currency_code' => 'PEN',
                'amount' => intval($monto * 100), // Convertir a centavos
                'created_at' => date('Y-m-d H:i:s')
            ];
            
            // ✅ GUARDAR EN SESIÓN TEMPORALMENTE (IGUAL QUE RESERVAS)
            $_SESSION['pending_torneo_order'] = $order;
            
            $this->response([
                'success' => true,
                'order' => $order,
                'message' => 'Orden creada exitosamente'
            ]);
            
        } catch (Exception $e) {
            error_log("Error creando orden Culqi torneo: " . $e->getMessage());
            $this->response(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
        }
    }

    // ✅ ACTUALIZAR EL SWITCH EN handleRequest()
    public function handleRequest() {
        $action = $_GET['action'] ?? '';
        
        switch ($action) {
            case 'obtener_torneos':
                $this->obtenerTorneos();
                break;
            case 'crear_torneo':
                $this->crearTorneo();
                break;
            case 'obtener_detalles':
                $this->obtenerDetallesTorneo();
                break;
            case 'obtener_equipos_inscripcion':
                $this->obtenerEquiposParaInscripcion();
                break;
            case 'obtener_mis_inscripciones': // ✅ NUEVO
                $this->obtenerMisInscripciones();
                break;
            case 'crear_orden_culqi':
                $this->crearOrdenCulqi();
                break;
            case 'inscribir_equipo_culqi':
                $this->inscribirEquipoConCulqi();
                break;
            case 'inscribir_equipo_paypal':
                $this->inscribirEquipoConPayPal();
                break;
            case 'inscribir_equipo_gratis':
                $this->inscribirEquipoGratis();
                break;
            case 'obtener_partidos':
                $this->obtenerPartidosTorneo();
                break;
            case 'actualizar_torneo':
                $this->actualizarTorneo();
                break;
            default:
                $this->response(['success' => false, 'message' => 'Acción no válida']);
                break;
        }
    }

    // ✅ AGREGAR AL FINAL DE TorneosController.php (antes del handleRequest)

    public function obtenerMisInscripciones() {
        if (!$this->verificarAutenticacion()) return;
        
        $torneoId = $_GET['torneo_id'] ?? null;
        $usuarioId = $_SESSION['user_id'] ?? null;
        
        if (!$torneoId || !$usuarioId) {
            $this->response(['success' => false, 'message' => 'Datos insuficientes']);
            return;
        }
        
        try {
            // Obtener datos del torneo
            $torneo = $this->torneosModel->obtenerTorneoPorId($torneoId);
            
            if (!$torneo) {
                $this->response(['success' => false, 'message' => 'Torneo no encontrado']);
                return;
            }
            
            // Obtener equipos inscritos del usuario
            $equiposInscritos = $this->torneosModel->obtenerEquiposInscritosUsuario($torneoId, $usuarioId);
            
            $this->response([
                'success' => true,
                'torneo' => $torneo,
                'equipos_inscritos' => $equiposInscritos
            ]);
            
        } catch (Exception $e) {
            $this->response(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
        }
    }

    // ✅ AGREGAR ESTA FUNCIÓN AL CONTROLADOR (después de inscribirEquipoConPayPal):
    public function inscribirEquipoGratis() {
        if (!$this->verificarAutenticacion()) return;
        
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            $torneoId = $input['torneo_id'] ?? null;
            $equipoId = $input['equipo_id'] ?? null;
            
            if (!$torneoId || !$equipoId) {
                throw new Exception('Datos insuficientes para la inscripción');
            }
            
            // ✅ VERIFICAR QUE EL TORNEO SEA REALMENTE GRATUITO
            $torneo = $this->torneosModel->obtenerTorneoPorId($torneoId);
            if (!$torneo || floatval($torneo['costo_inscripcion']) > 0) {
                throw new Exception('Este torneo no es gratuito');
            }
            
            // ✅ USAR LA FUNCIÓN EXISTENTE PERO SIN PAGO
            $resultado = $this->torneosModel->inscribirEquipoGratis($torneoId, $equipoId);
            
            $this->response($resultado);
            
        } catch (Exception $e) {
            error_log("Error inscripción gratuita: " . $e->getMessage());
            $this->response(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
        }
    }
}

// Manejo directo si se llama al archivo
if (basename($_SERVER['PHP_SELF']) == basename(__FILE__)) {
    $controller = new TorneosController();
    $controller->handleRequest();
}
?>
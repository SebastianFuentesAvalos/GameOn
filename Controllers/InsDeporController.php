<?php
require_once __DIR__ . '/../Models/InsDeporModel.php';

class InsDeporController {
    private $insDeporModel;
    
    public function __construct() {
        $this->insDeporModel = new InsDeporModel();
    }
    
    // ✅ AGREGAR FUNCIÓN handleRequest
    public function handleRequest() {
        $action = $_GET['action'] ?? '';
        
        switch ($action) {
            case 'obtener_claves_pago':
                $this->obtenerClavesPago();
                break;
            case 'actualizar_claves_pago':
                $this->actualizarClavesPago();
                break;
            case 'obtener_todas_instalaciones':
                $this->obtenerTodasInstalaciones();
                break;
            case 'obtener_instalaciones_filtradas':
                $this->obtenerInstalacionesFiltradas();
                break;
            default:
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Acción no encontrada']);
                break;
        }
    }
    
    // Obtener todas las instalaciones deportivas
    public function getAllInstalaciones() {
        return $this->insDeporModel->getAllInstalaciones();
    }
    
    // Obtener una instalación deportiva por ID
    public function getInstalacionById($id) {
        return $this->insDeporModel->getInstalacionById($id);
    }
    
    // Obtener los horarios de una instalación deportiva
    public function getHorariosInstalacion($instalacionId) {
        return $this->insDeporModel->getHorariosInstalacion($instalacionId);
    }
    
    // Obtener los deportes que ofrece una instalación
    public function getDeportesInstalacion($instalacionId) {
        return $this->insDeporModel->getDeportesInstalacion($instalacionId);
    }
    
    // Obtener instalaciones deportivas cercanas
    public function getInstalacionesCercanas($latitud, $longitud, $distanciaKm = 5) {
        return $this->insDeporModel->getInstalacionesCercanas($latitud, $longitud, $distanciaKm);
    }
    
    // Obtener instalaciones por deporte
    public function getInstalacionesPorDeporte($deporteId) {
        return $this->insDeporModel->getInstalacionesPorDeporte($deporteId);
    }
    
    // Buscar instalaciones por nombre
    public function buscarInstalaciones($termino) {
        return $this->insDeporModel->buscarInstalaciones($termino);
    }
    
    // Formatear horarios para mostrar de forma amigable
    public function formatearHorarios($horarios) {
        $horarioFormateado = [];
        foreach ($horarios as $horario) {
            $horaApertura = date('H:i', strtotime($horario['hora_apertura']));
            $horaCierre = date('H:i', strtotime($horario['hora_cierre']));
            $horarioFormateado[$horario['dia']] = "$horaApertura - $horaCierre";
        }
        return $horarioFormateado;
    }
    
    // Obtener instalaciones con información completa para mostrar
    public function getInstalacionesCompletas($usuarioId = null) {
        if ($usuarioId) {
            return $this->getInstalacionesFiltradas($usuarioId);
        }
        
        // Comportamiento original para usuarios no autenticados
        $instalaciones = $this->getAllInstalaciones();
        $instalacionesCompletas = [];
        
        foreach ($instalaciones as $instalacion) {
            $horarios = $this->getHorariosInstalacion($instalacion['id']);
            $deportes = $this->getDeportesInstalacion($instalacion['id']);
            
            $instalacion['horarios'] = $this->formatearHorarios($horarios);
            $instalacion['deportes'] = $deportes;
            
            $instalacionesCompletas[] = $instalacion;
        }
        
        return $instalacionesCompletas;
    }
    
    // Obtener instalaciones de un usuario específico
    public function getInstalacionesPorUsuario($usuarioInstalacionId) {
        return $this->insDeporModel->getInstalacionesPorUsuario($usuarioInstalacionId);
    }
    
    // Obtener reservas de hoy para un usuario
    public function getReservasHoyPorUsuario($usuarioInstalacionId) {
        return $this->insDeporModel->getReservasHoyPorUsuario($usuarioInstalacionId);
    }
    
    // Obtener calificación promedio de un usuario
    public function getCalificacionPromedioPorUsuario($usuarioInstalacionId) {
        return $this->insDeporModel->getCalificacionPromedioPorUsuario($usuarioInstalacionId);
    }
    
    // Obtener estadísticas del mes para un usuario
    public function getEstadisticasMesPorUsuario($usuarioInstalacionId) {
        return $this->insDeporModel->getEstadisticasMesPorUsuario($usuarioInstalacionId);
    }
    
    // Obtener instalaciones completas con información adicional para un usuario específico
    public function getInstalacionesCompletasPorUsuario($usuarioInstalacionId) {
        $instalaciones = $this->getInstalacionesPorUsuario($usuarioInstalacionId);
        $instalacionesCompletas = [];
        
        foreach ($instalaciones as $instalacion) {
            $horarios = $this->getHorariosInstalacion($instalacion['id']);
            $deportes = $this->getDeportesInstalacion($instalacion['id']);
            
            $instalacion['horarios'] = $this->formatearHorarios($horarios);
            $instalacion['deportes'] = $deportes;
            
            $instalacionesCompletas[] = $instalacion;
        }
        
        return $instalacionesCompletas;
    }
    
    // Obtener claves de pago
    public function obtenerClavesPago() {
        if (session_status() == PHP_SESSION_NONE) {
            session_start();
        }
        
        header('Content-Type: application/json');
        
        try {
            if (!isset($_SESSION['user_id']) || $_SESSION['user_type'] !== 'instalacion') {
                echo json_encode(['success' => false, 'message' => 'Sin permisos']);
                return;
            }
            
            $configuracion = $this->insDeporModel->obtenerConfiguracionPago($_SESSION['user_id']);
            echo json_encode(['success' => true, 'configuracion' => $configuracion]);
            
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
        }
    }

    public function actualizarClavesPago() {
        if (session_status() == PHP_SESSION_NONE) {
            session_start();
        }
        
        header('Content-Type: application/json');
        
        try {
            if (!isset($_SESSION['user_id']) || !isset($_SESSION['user_type'])) {
                echo json_encode(['success' => false, 'message' => 'Sesión no válida']);
                return;
            }
            
            if ($_SESSION['user_type'] !== 'instalacion') {
                echo json_encode(['success' => false, 'message' => 'Tipo de usuario incorrecto: ' . $_SESSION['user_type']]);
                return;
            }
            
            // ✅ LOG DE DEBUG
            error_log("Usuario actualizando claves: ID=" . $_SESSION['user_id'] . ", Tipo=" . $_SESSION['user_type']);
            
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                echo json_encode(['success' => false, 'message' => 'Datos JSON no válidos']);
                return;
            }
            
            // ✅ LOG DE DATOS RECIBIDOS
            error_log("Datos recibidos en controlador: " . print_r($input, true));
            
            $resultado = $this->insDeporModel->actualizarConfiguracionPago($_SESSION['user_id'], $input);
            
            // ✅ LOG DE RESULTADO
            error_log("Resultado del modelo: " . print_r($resultado, true));
            
            echo json_encode($resultado);
            
        } catch (Exception $e) {
            error_log("Error en actualizarClavesPago controlador: " . $e->getMessage());
            echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
        }
    }
    
    // ✅ NUEVA FUNCIÓN: Obtener instalaciones filtradas por deportes del usuario
    public function getInstalacionesFiltradas($usuarioId) {
        // Obtener deportes del usuario
        require_once __DIR__ . '/PerfilController.php';
        $perfilController = new PerfilController();
        $deportesUsuario = $perfilController->getDeportesUsuario($usuarioId);
        
        error_log("Deportes usuario obtenidos: " . print_r($deportesUsuario, true));
        
        if (empty($deportesUsuario)) {
            // Si no tiene deportes favoritos, mostrar todas las instalaciones
            error_log("Usuario sin deportes favoritos, mostrando todas");
            return $this->getInstalacionesCompletas();
        }
        
        // Obtener IDs de deportes favoritos
        $deporteIds = array_column($deportesUsuario, 'id');
        error_log("IDs de deportes favoritos: " . print_r($deporteIds, true));
        
        // ✅ OBTENER INSTALACIONES DE FORMA CORRECTA
        $instalaciones = $this->getAllInstalaciones();
        $instalacionesFiltradas = [];
        
        foreach ($instalaciones as $instalacion) {
            // Obtener deportes de la instalación
            $deportesInstalacion = $this->getDeportesInstalacion($instalacion['id']);
            $deportesInstalacionIds = array_column($deportesInstalacion, 'id');
            
            // Verificar si hay intersección entre deportes del usuario y de la instalación
            $deportesComunes = array_intersect($deporteIds, $deportesInstalacionIds);
            
            if (!empty($deportesComunes)) {
                // Filtrar solo los deportes favoritos del usuario
                $deportesFiltrados = array_filter($deportesInstalacion, function($deporte) use ($deporteIds) {
                    return in_array($deporte['id'], $deporteIds);
                });
                
                // Agregar información completa
                $horarios = $this->getHorariosInstalacion($instalacion['id']);
                $instalacion['horarios'] = $this->formatearHorarios($horarios);
                $instalacion['deportes'] = array_values($deportesFiltrados); // ✅ ASEGURAR ARRAY INDEXADO
                $instalacion['calificacion'] = $this->insDeporModel->getCalificacionPromedioInstalacion($instalacion['id']);
                
                $instalacionesFiltradas[] = $instalacion;
            }
        }
        
        error_log("Instalaciones filtradas encontradas: " . count($instalacionesFiltradas));
        return $instalacionesFiltradas;
    }
    
    // ✅ NUEVA FUNCIÓN: Obtener todas las instalaciones vía AJAX
    private function obtenerTodasInstalaciones() {
        header('Content-Type: application/json');
        
        try {
            $instalaciones = $this->getInstalacionesCompletas(); // Sin filtro
            echo json_encode([
                'success' => true, 
                'instalaciones' => $instalaciones
            ]);
        } catch (Exception $e) {
            echo json_encode([
                'success' => false, 
                'message' => 'Error: ' . $e->getMessage()
            ]);
        }
    }

    // ✅ NUEVA FUNCIÓN: Obtener instalaciones filtradas vía AJAX
    private function obtenerInstalacionesFiltradas() {
        if (session_status() == PHP_SESSION_NONE) {
            session_start();
        }
        
        header('Content-Type: application/json');
        
        try {
            if (!isset($_SESSION['user_id'])) {
                echo json_encode(['success' => false, 'message' => 'Usuario no autenticado']);
                return;
            }
            
            $instalaciones = $this->getInstalacionesCompletas($_SESSION['user_id']); // Con filtro
            echo json_encode([
                'success' => true, 
                'instalaciones' => $instalaciones
            ]);
        } catch (Exception $e) {
            echo json_encode([
                'success' => false, 
                'message' => 'Error: ' . $e->getMessage()
            ]);
        }
    }
}

// ✅ AGREGAR ESTO AL FINAL DEL ARCHIVO
if (basename($_SERVER['PHP_SELF']) == basename(__FILE__)) {
    $controller = new InsDeporController();
    $controller->handleRequest();
}
?>
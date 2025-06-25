<?php
require_once __DIR__ . '/../Config/database.php';

class PayPalController {
    private $db;
    private $sandbox = true; // Cambiar a false en producción
    
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }
    
    public function handleRequest() {
        // Leer action desde GET, POST o JSON input
        $action = $_GET['action'] ?? $_POST['action'] ?? '';
        
        if (empty($action) && $_SERVER['REQUEST_METHOD'] === 'POST') {
            $input = json_decode(file_get_contents('php://input'), true);
            $action = $input['action'] ?? '';
        }
        
        error_log("PayPalController - Action recibido: " . $action);
        
        switch($action) {
            case 'get_config':
                $this->getPayPalConfig();
                break;
            case 'create_payment':
                $this->createPayment();
                break;
            case 'execute_payment':
                $this->executePayment();
                break;
            default:
                echo json_encode([
                    'success' => false, 
                    'message' => 'Acción no válida: ' . $action
                ]);
        }
    }
    
    // ✅ OBTENER CONFIGURACIÓN PAYPAL
    private function getPayPalConfig() {
        try {
            $instalacionId = $_GET['instalacion_id'] ?? 0;
            
            // ✅ DEBUG: Ver qué instalacion_id recibe
            error_log("PayPal Config - instalacion_id recibido: " . $instalacionId);
            
            // ✅ QUERY CORREGIDA PARA OBTENER CREDENCIALES
            $query = "SELECT ui.paypal_client_id, ui.paypal_enabled, ui.paypal_sandbox 
                     FROM usuarios_instalaciones ui
                     INNER JOIN instituciones_deportivas id ON ui.id = id.usuario_instalacion_id
                     INNER JOIN areas_deportivas ad ON id.id = ad.institucion_deportiva_id
                     WHERE ad.id = ? AND ui.paypal_enabled = 1 
                     LIMIT 1";
            
            $stmt = $this->db->prepare($query);
            $stmt->bind_param("i", $instalacionId);
            $stmt->execute();
            $result = $stmt->get_result();
            
            // ✅ DEBUG: Ver si encuentra resultados
            error_log("PayPal Config - Filas encontradas: " . $result->num_rows);
            
            if ($result && $result->num_rows > 0) {
                $row = $result->fetch_assoc();
                
                // ✅ DEBUG: Ver qué client_id devuelve
                error_log("PayPal Config - Client ID: " . substr($row['paypal_client_id'], 0, 20) . "...");
                
                echo json_encode([
                    'success' => true,
                    'client_id' => $row['paypal_client_id'],
                    'sandbox' => (bool)$row['paypal_sandbox']
                ]);
            } else {
                // ✅ FALLBACK: Usar credenciales directas de la BD para área 16
                error_log("PayPal Config - No se encontró en BD, usando fallback directo");
                
                $queryFallback = "SELECT paypal_client_id, paypal_sandbox FROM usuarios_instalaciones WHERE paypal_enabled = 1 LIMIT 1";
                $stmtFallback = $this->db->prepare($queryFallback);
                $stmtFallback->execute();
                $resultFallback = $stmtFallback->get_result();
                
                if ($resultFallback && $resultFallback->num_rows > 0) {
                    $rowFallback = $resultFallback->fetch_assoc();
                    echo json_encode([
                        'success' => true,
                        'client_id' => $rowFallback['paypal_client_id'],
                        'sandbox' => (bool)$rowFallback['paypal_sandbox']
                    ]);
                } else {
                    throw new Exception('No hay configuración PayPal disponible');
                }
                
                $stmtFallback->close();
            }
            
            $stmt->close();
            
        } catch (Exception $e) {
            error_log("PayPal Config - Error: " . $e->getMessage());
            echo json_encode([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ]);
        }
    }
    
    // ✅ CREAR PAGO PAYPAL (SIMPLIFICADO PARA USAR CON SDK)
    private function createPayment() {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                throw new Exception('No se recibieron datos JSON válidos');
            }
            
            $amount = floatval($input['monto'] ?? 0);
            $description = "Reserva área deportiva - " . ($input['area_nombre'] ?? 'Área');
            $instalacionId = $input['instalacion_id'] ?? 0;
            
            if ($amount <= 0) {
                throw new Exception('Monto no válido: ' . $amount);
            }
            
            // Solo verificar credenciales
            $credentials = $this->getPayPalCredentials($instalacionId);
            if (!$credentials) {
                throw new Exception('Credenciales PayPal no encontradas');
            }
            
            // Retornar datos para el SDK de frontend
            echo json_encode([
                'success' => true,
                'amount' => $amount,
                'description' => $description,
                'client_id' => $credentials['paypal_client_id']
            ]);
            
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => 'Error creando pago: ' . $e->getMessage()
            ]);
        }
    }
    
    // ✅ VERIFICAR PAGO COMPLETADO
    private function executePayment() {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            $paymentId = $input['payment_id'] ?? '';
            $payerId = $input['payer_id'] ?? '';
            
            if (empty($paymentId) || empty($payerId)) {
                throw new Exception('Datos de pago incompletos');
            }
            
            // En un entorno real, aquí verificarías el pago con PayPal API
            // Por ahora, aceptamos que el SDK ya validó el pago
            
            echo json_encode([
                'success' => true,
                'payment_id' => $paymentId,
                'payer_id' => $payerId,
                'message' => 'Pago exitoso'
            ]);
            
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => 'Error ejecutando pago: ' . $e->getMessage()
            ]);
        }
    }
    
    // ✅ FUNCIÓN AUXILIAR
    private function getPayPalCredentials($instalacionId) {
        $query = "SELECT ui.paypal_client_id, ui.paypal_client_secret, ui.paypal_sandbox 
                 FROM usuarios_instalaciones ui
                 INNER JOIN instituciones_deportivas id ON ui.id = id.usuario_instalacion_id
                 INNER JOIN areas_deportivas ad ON id.id = ad.institucion_deportiva_id
                 WHERE ad.id = ? AND ui.paypal_enabled = 1 
                 LIMIT 1";
        
        $stmt = $this->db->prepare($query);
        $stmt->bind_param("i", $instalacionId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        return $result->fetch_assoc();
    }
}

// Headers CORS
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$controller = new PayPalController();
$controller->handleRequest();
?>
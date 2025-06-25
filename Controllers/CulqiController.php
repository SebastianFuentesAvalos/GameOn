<?php
// filepath: c:\xampp\htdocs\GameOn_Network\Controllers\CulqiController.php
require_once __DIR__ . '/../Config/database.php';

class CulqiController {
    private $db;
    
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }
    
    private function response($data) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }
    
    public function handleRequest() {
        $action = $_GET['action'] ?? $_POST['action'] ?? '';
        
        if (empty($action) && $_SERVER['REQUEST_METHOD'] === 'POST') {
            $input = json_decode(file_get_contents('php://input'), true);
            $action = $input['action'] ?? '';
        }
        
        error_log("CulqiController - Action recibido: " . $action);
        
        switch($action) {
            case 'get_config':
                $this->getCulqiConfig();
                break;
            case 'create_order':
                $this->createOrder();
                break;
            case 'process_payment':
                $this->processPayment();
                break;
            default:
                $this->response([
                    'success' => false, 
                    'message' => 'Acción no válida: ' . $action
                ]);
        }
    }
    
    // ✅ ARREGLAR MÉTODO getCulqiConfig - BUSCAR DIRECTAMENTE EN usuarios_instalaciones
    private function getCulqiConfig() {
        $instalacionId = $_GET['instalacion_id'] ?? 0;
        
        if (!$instalacionId) {
            $this->response(['success' => false, 'message' => 'ID de instalación requerido']);
            return;
        }
        
        // ✅ BUSCAR CONFIGURACIÓN DIRECTAMENTE - SIMPLIFICADO
        // Primero intentar por area deportiva -> institución -> usuario
        $query = "SELECT ui.culqi_public_key, ui.culqi_secret_key, ui.culqi_enabled
                  FROM areas_deportivas ad
                  INNER JOIN instituciones_deportivas id ON ad.institucion_deportiva_id = id.id
                  INNER JOIN usuarios_instalaciones ui ON id.usuario_instalacion_id = ui.id
                  WHERE ad.id = ? AND ui.culqi_enabled = 1
                  LIMIT 1";
        
        $stmt = $this->db->prepare($query);
        $stmt->bind_param("i", $instalacionId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($row = $result->fetch_assoc()) {
            $this->response([
                'success' => true,
                'public_key' => $row['culqi_public_key'],
                'enabled' => $row['culqi_enabled']
            ]);
            return;
        }
        
        // ✅ FALLBACK: Buscar directamente en usuarios_instalaciones por ID
        $queryFallback = "SELECT culqi_public_key, culqi_secret_key, culqi_enabled
                          FROM usuarios_instalaciones 
                          WHERE id = ? AND culqi_enabled = 1
                          LIMIT 1";
        
        $stmtFallback = $this->db->prepare($queryFallback);
        $stmtFallback->bind_param("i", $instalacionId);
        $stmtFallback->execute();
        $resultFallback = $stmtFallback->get_result();
        
        if ($rowFallback = $resultFallback->fetch_assoc()) {
            $this->response([
                'success' => true,
                'public_key' => $rowFallback['culqi_public_key'],
                'enabled' => $rowFallback['culqi_enabled']
            ]);
            return;
        }
        
        // ✅ ÚLTIMO FALLBACK: Usar configuración por defecto del usuario ID=1
        $queryDefault = "SELECT culqi_public_key, culqi_secret_key, culqi_enabled
                         FROM usuarios_instalaciones 
                         WHERE id = 1 AND culqi_enabled = 1
                         LIMIT 1";
        
        $stmtDefault = $this->db->prepare($queryDefault);
        $stmtDefault->execute();
        $resultDefault = $stmtDefault->get_result();
        
        if ($rowDefault = $resultDefault->fetch_assoc()) {
            error_log("CulqiController - Usando configuración por defecto para instalación: " . $instalacionId);
            $this->response([
                'success' => true,
                'public_key' => $rowDefault['culqi_public_key'],
                'enabled' => $rowDefault['culqi_enabled']
            ]);
            return;
        }
        
        // ✅ SI NADA FUNCIONA, ERROR CLARO
        $this->response([
            'success' => false, 
            'message' => 'Configuración de pagos no disponible para área ID: ' . $instalacionId
        ]);
    }
    
    private function createOrder() {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                throw new Exception('No se recibieron datos JSON válidos');
            }
            
            $orderId = 'ORDER_' . time() . '_' . rand(1000, 9999);
            $amount = floatval($input['monto'] ?? 0);
            $description = "Reserva área deportiva - " . ($input['area_nombre'] ?? 'Área');
            
            if ($amount <= 0) {
                throw new Exception('Monto no válido: ' . $amount);
            }
            
            $this->response([
                'success' => true,
                'order' => [
                    'order_id' => $orderId,
                    'amount' => $amount,
                    'description' => $description,
                    'currency' => 'PEN'
                ]
            ]);
        } catch (Exception $e) {
            $this->response([
                'success' => false,
                'message' => 'Error creando orden: ' . $e->getMessage()
            ]);
        }
    }
    
    private function processPayment() {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                throw new Exception('No se recibieron datos JSON válidos');
            }
            
            $token = $input['token'] ?? '';
            $amount = floatval($input['amount'] ?? 0) * 100;
            $orderId = $input['order_id'] ?? '';
            $description = $input['description'] ?? '';
            
            if (empty($token)) {
                throw new Exception('Token de pago no válido');
            }
            
            if ($amount <= 0) {
                throw new Exception('Monto no válido');
            }
            
            session_start();
            $userEmail = 'test@gameon.com';
            if (isset($_SESSION['user_id'])) {
                $query = "SELECT email FROM usuarios_deportistas WHERE id = ?";
                $stmt = $this->db->prepare($query);
                if ($stmt) {
                    $stmt->bind_param("i", $_SESSION['user_id']);
                    $stmt->execute();
                    $result = $stmt->get_result();
                    if ($result && $result->num_rows > 0) {
                        $row = $result->fetch_assoc();
                        $userEmail = $row['email'] ?: 'test@gameon.com';
                    }
                    $stmt->close();
                }
            }
            
            $secretKey = 'sk_test_DthTrZ9s5AVPzLaA';
            
            $chargeData = [
                'amount' => $amount,
                'currency_code' => 'PEN',
                'description' => $description,
                'email' => $userEmail,
                'source_id' => $token
            ];
            
            if (!empty($orderId)) {
                $chargeData['order_id'] = $orderId;
            }
            
            error_log("CulqiController - Datos enviados a Culqi: " . json_encode($chargeData));
            
            try {
                $response = $this->callCulqiAPI('charges', $chargeData, $secretKey);
                
                error_log("CulqiController - Respuesta Culqi: " . json_encode($response));
                
                if ($response && isset($response['outcome'])) {
                    if ($response['outcome']['type'] === 'venta_exitosa') {
                        $this->response([
                            'success' => true,
                            'charge_id' => $response['id'],
                            'message' => 'Pago exitoso'
                        ]);
                    } else {
                        $errorMessage = $response['outcome']['user_message'] ?? 'Error en el pago';
                        
                        if (strpos($errorMessage, 'merchant') !== false || strpos($errorMessage, 'validat') !== false) {
                            $this->response([
                                'success' => false,
                                'message' => 'Tu cuenta Culqi está en proceso de validación. Usa las tarjetas de prueba: 4111 1111 1111 1111',
                                'error_type' => 'validation',
                                'culqi_response' => $response
                            ]);
                        } else {
                            $this->response([
                                'success' => false,
                                'message' => $errorMessage,
                                'culqi_response' => $response
                            ]);
                        }
                    }
                } else {
                    throw new Exception('Respuesta de Culqi no válida');
                }
                
            } catch (Exception $apiError) {
                $errorMessage = $apiError->getMessage();
                
                if (strpos($errorMessage, '403') !== false || strpos($errorMessage, 'merchant') !== false) {
                    $this->response([
                        'success' => false,
                        'message' => 'Cuenta Culqi en validación. Espera la activación o contacta a soporte.',
                        'error_type' => 'account_validation',
                        'api_error' => $errorMessage
                    ]);
                } else {
                    $this->response([
                        'success' => false,
                        'message' => 'Error de conexión con Culqi: ' . $errorMessage,
                        'error_type' => 'api_error'
                    ]);
                }
            }
            
        } catch (Exception $e) {
            $this->response([
                'success' => false,
                'message' => 'Error procesando pago: ' . $e->getMessage()
            ]);
        }
    }
    
    private function callCulqiAPI($endpoint, $data, $secretKey) {
        $url = "https://api.culqi.com/v2/{$endpoint}";
        
        $headers = [
            'Authorization: Bearer ' . $secretKey,
            'Content-Type: application/json'
        ];
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);
        
        if ($curlError) {
            throw new Exception("Error cURL: " . $curlError);
        }
        
        if ($httpCode === 200 || $httpCode === 201) {
            return json_decode($response, true);
        } else {
            error_log("CulqiController - Error API Culqi HTTP {$httpCode}: " . $response);
            throw new Exception("Error en API Culqi HTTP {$httpCode}: " . $response);
        }
    }
}

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'GET' || $_SERVER['REQUEST_METHOD'] === 'POST') {
    $controller = new CulqiController();
    $controller->handleRequest();
} else {
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
}
?>
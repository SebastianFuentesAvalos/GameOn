<?php
// filepath: c:\xampp\htdocs\GameOn_Network\Controllers\CulqiController.php
require_once __DIR__ . '/../Config/database.php';

class CulqiController {
    private $db;
    
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }
    
    public function handleRequest() {
        // ✅ LEER ACTION DESDE GET, POST O JSON INPUT
        $action = $_GET['action'] ?? $_POST['action'] ?? '';
        
        // ✅ SI NO HAY ACTION EN GET/POST, LEER DESDE JSON
        if (empty($action) && $_SERVER['REQUEST_METHOD'] === 'POST') {
            $input = json_decode(file_get_contents('php://input'), true);
            $action = $input['action'] ?? '';
        }
        
        // ✅ DEBUG PARA VER QUÉ ACTION LLEGA
        error_log("CulqiController - Action recibido: " . $action);
        error_log("CulqiController - Method: " . $_SERVER['REQUEST_METHOD']);
        error_log("CulqiController - Input JSON: " . file_get_contents('php://input'));
        
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
                echo json_encode([
                    'success' => false, 
                    'message' => 'Acción no válida: ' . $action,
                    'debug' => [
                        'method' => $_SERVER['REQUEST_METHOD'],
                        'get' => $_GET,
                        'post' => $_POST,
                        'json_input' => json_decode(file_get_contents('php://input'), true)
                    ]
                ]);
        }
    }
    
    // ✅ OBTENER CONFIGURACIÓN CULQI DE LA INSTALACIÓN
    private function getCulqiConfig() {
        try {
            $instalacionId = $_GET['instalacion_id'] ?? 0;
            
            // ✅ SIMPLIFICAR QUERY - BUSCAR DIRECTAMENTE POR AREA_ID
            $query = "SELECT ui.culqi_public_key, ui.culqi_enabled 
                     FROM usuarios_instalaciones ui
                     INNER JOIN instituciones_deportivas id ON ui.id = id.usuario_instalacion_id
                     INNER JOIN areas_deportivas ad ON id.id = ad.institucion_deportiva_id
                     WHERE ad.id = ? AND ui.culqi_enabled = 1 
                     LIMIT 1";
            
            $stmt = $this->db->prepare($query);
            $stmt->bind_param("i", $instalacionId);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($result && $result->num_rows > 0) {
                $row = $result->fetch_assoc();
                echo json_encode([
                    'success' => true,
                    'public_key' => $row['culqi_public_key']
                ]);
            } else {
                echo json_encode([
                    'success' => false,
                    'message' => 'Configuración de pagos no disponible para área ID: ' . $instalacionId
                ]);
            }
            
            $stmt->close();
            
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ]);
        }
    }
    
    // ✅ CREAR ORDEN DE PAGO
    private function createOrder() {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            // ✅ DEBUG PARA VER QUÉ DATOS LLEGAN
            error_log("CulqiController - createOrder input: " . print_r($input, true));
            
            if (!$input) {
                throw new Exception('No se recibieron datos JSON válidos');
            }
            
            $orderId = 'ORDER_' . time() . '_' . rand(1000, 9999);
            $amount = floatval($input['monto'] ?? 0);
            $description = "Reserva área deportiva - " . ($input['area_nombre'] ?? 'Área');
            
            if ($amount <= 0) {
                throw new Exception('Monto no válido: ' . $amount);
            }
            
            echo json_encode([
                'success' => true,
                'order' => [
                    'order_id' => $orderId,
                    'amount' => $amount,
                    'description' => $description,
                    'currency' => 'PEN'
                ]
            ]);
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => 'Error creando orden: ' . $e->getMessage()
            ]);
        }
    }
    
    // ✅ PROCESAR PAGO CON CULQI
    private function processPayment() {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                throw new Exception('No se recibieron datos JSON válidos');
            }
            
            $token = $input['token'] ?? '';
            $amount = floatval($input['amount'] ?? 0) * 100; // Culqi usa centavos
            $orderId = $input['order_id'] ?? '';
            $description = $input['description'] ?? '';
            
            if (empty($token)) {
                throw new Exception('Token de pago no válido');
            }
            
            if ($amount <= 0) {
                throw new Exception('Monto no válido');
            }
            
            // ✅ OBTENER EMAIL DEL USUARIO
            session_start();
            $userEmail = 'test@gameon.com'; // Email por defecto para pruebas
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
            
            // ✅ TU SECRET KEY DE PRUEBA
            $secretKey = 'sk_test_DthTrZ9s5AVPzLaA';
            
            // ✅ DATOS PARA CULQI CON CONFIGURACIÓN ESPECIAL PARA MODO PRUEBA
            $chargeData = [
                'amount' => $amount,
                'currency_code' => 'PEN',
                'description' => $description,
                'email' => $userEmail,
                'source_id' => $token
            ];
            
            // ✅ AÑADIR order_id solo si no está vacío
            if (!empty($orderId)) {
                $chargeData['order_id'] = $orderId;
            }
            
            error_log("CulqiController - Datos enviados a Culqi: " . json_encode($chargeData));
            
            // ✅ LLAMADA A CULQI CON MANEJO ESPECIAL PARA CUENTAS EN VALIDACIÓN
            try {
                $response = $this->callCulqiAPI('charges', $chargeData, $secretKey);
                
                error_log("CulqiController - Respuesta Culqi: " . json_encode($response));
                
                if ($response && isset($response['outcome'])) {
                    if ($response['outcome']['type'] === 'venta_exitosa') {
                        echo json_encode([
                            'success' => true,
                            'charge_id' => $response['id'],
                            'message' => 'Pago exitoso'
                        ]);
                    } else {
                        // ✅ MANEJO ESPECIAL PARA ERRORES EN MODO PRUEBA
                        $errorMessage = $response['outcome']['user_message'] ?? 'Error en el pago';
                        
                        // Si es error de cuenta no validada, dar mensaje más claro
                        if (strpos($errorMessage, 'merchant') !== false || strpos($errorMessage, 'validat') !== false) {
                            echo json_encode([
                                'success' => false,
                                'message' => 'Tu cuenta Culqi está en proceso de validación. Usa las tarjetas de prueba: 4111 1111 1111 1111',
                                'error_type' => 'validation',
                                'culqi_response' => $response
                            ]);
                        } else {
                            echo json_encode([
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
                // ✅ MANEJO ESPECIAL PARA ERRORES DE API EN MODO PRUEBA
                $errorMessage = $apiError->getMessage();
                
                if (strpos($errorMessage, '403') !== false || strpos($errorMessage, 'merchant') !== false) {
                    echo json_encode([
                        'success' => false,
                        'message' => 'Cuenta Culqi en validación. Espera la activación o contacta a soporte.',
                        'error_type' => 'account_validation',
                        'api_error' => $errorMessage
                    ]);
                } else {
                    echo json_encode([
                        'success' => false,
                        'message' => 'Error de conexión con Culqi: ' . $errorMessage,
                        'error_type' => 'api_error'
                    ]);
                }
            }
            
        } catch (Exception $e) {
            echo json_encode([
                'success' => false,
                'message' => 'Error procesando pago: ' . $e->getMessage()
            ]);
        }
    }
    
    // ✅ LLAMADA A API CULQI
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

// ✅ MANEJAR REQUESTS CON HEADERS CORS
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// ✅ MANEJAR OPTIONS REQUEST (PREFLIGHT)
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
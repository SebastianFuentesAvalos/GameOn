<?php
require_once __DIR__ . '/../Config/database.php';

class AreasDeportivasModel {
    private $conn;

    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    private function fetchAllAssoc($result) {
        return $result->fetch_all(MYSQLI_ASSOC);
    }

    // Obtener todas las áreas deportivas de una institución específica
    public function getAreasByInstitucion($institucionId) {
        $query = "SELECT DISTINCT
                      ad.id,
                      ad.institucion_deportiva_id,
                      ad.deporte_id,
                      ad.nombre_area,
                      ad.descripcion,
                      ad.capacidad_jugadores,
                      ad.tarifa_por_hora,
                      ad.estado,
                      ad.imagen_area,
                      ad.creado_en,
                      d.nombre as deporte_nombre,
                      inst.nombre as institucion_nombre
                  FROM areas_deportivas ad
                  LEFT JOIN deportes d ON ad.deporte_id = d.id
                  LEFT JOIN instituciones_deportivas inst ON ad.institucion_deportiva_id = inst.id
                  WHERE ad.institucion_deportiva_id = ?
                  ORDER BY ad.id ASC";
    
        $stmt = $this->conn->prepare($query);
        if (!$stmt) {
            error_log("Error en consulta getAreasByInstitucion: " . $this->conn->error);
            return [];
        }
    
        $stmt->bind_param("i", $institucionId);
        $stmt->execute();
        $result = $stmt->get_result();
    
        return $this->fetchAllAssoc($result);
    }

    // Obtener todas las áreas deportivas de un usuario instalación
    public function getAreasByUsuarioInstalacion($usuarioInstalacionId) {
        // ✅ CONSULTA ÚNICA CON LEFT JOIN - SIN FOREACH ANIDADO
        $query = "SELECT DISTINCT
                      ad.id,
                      ad.institucion_deportiva_id,
                      ad.deporte_id,
                      ad.nombre_area,
                      ad.descripcion,
                      ad.capacidad_jugadores,
                      ad.tarifa_por_hora,
                      ad.estado,
                      ad.imagen_area,
                      ad.creado_en,
                      d.nombre as deporte_nombre,
                      inst.nombre as institucion_nombre
                  FROM areas_deportivas ad
                  LEFT JOIN deportes d ON ad.deporte_id = d.id
                  LEFT JOIN instituciones_deportivas inst ON ad.institucion_deportiva_id = inst.id
                  WHERE inst.usuario_instalacion_id = ?
                  ORDER BY ad.id ASC";
    
        $stmt = $this->conn->prepare($query);
        if (!$stmt) {
            error_log("Error en consulta getAreasByUsuarioInstalacion: " . $this->conn->error);
            return [];
        }
    
        $stmt->bind_param("i", $usuarioInstalacionId);
        $stmt->execute();
        $result = $stmt->get_result();
    
        $areas = $this->fetchAllAssoc($result);
    
        // ✅ LOG FINAL
        error_log("🔍 Usuario: $usuarioInstalacionId - Áreas encontradas: " . count($areas));
        foreach ($areas as $index => $area) {
            error_log("🔍 Área $index: ID={$area['id']}, Nombre={$area['nombre_area']}");
        }
    
        return $areas;
    }

    // Obtener área por ID
    public function getAreaById($id) {
        $query = "SELECT ad.*, d.nombre as deporte_nombre, id.nombre as institucion_nombre
                  FROM areas_deportivas ad
                  INNER JOIN deportes d ON ad.deporte_id = d.id
                  INNER JOIN instituciones_deportivas id ON ad.institucion_deportiva_id = id.id
                  WHERE ad.id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->fetch_assoc();
    }

    // Crear nueva área deportiva
    public function crearArea($institucionId, $deporteId, $nombreArea, $descripcion, $capacidad, $tarifa, $imagen = null, $estado = 'activa') {
        // ✅ AGREGAR LOG PARA DEBUG (temporal)
        error_log("🔍 Creando área: $nombreArea para institución: $institucionId");
        
        $query = "INSERT INTO areas_deportivas (institucion_deportiva_id, deporte_id, nombre_area, descripcion, capacidad_jugadores, tarifa_por_hora, imagen_area, estado) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("iissidss", $institucionId, $deporteId, $nombreArea, $descripcion, $capacidad, $tarifa, $imagen, $estado);
        
        $resultado = $stmt->execute();
        
        // ✅ LOG DEL RESULTADO
        error_log("✅ Área creada: " . ($resultado ? 'SÍ' : 'NO'));
        
        return $resultado;
    }

    // Actualizar área deportiva
    public function actualizarArea($id, $institucionId, $deporteId, $nombreArea, $descripcion, $capacidad, $tarifa, $imagen = null, $estado = 'activa') {
        if ($imagen) {
            $query = "UPDATE areas_deportivas SET 
                      institucion_deportiva_id = ?, deporte_id = ?, nombre_area = ?, descripcion = ?, 
                      capacidad_jugadores = ?, tarifa_por_hora = ?, imagen_area = ?, estado = ?
                      WHERE id = ?";
            $stmt = $this->conn->prepare($query);
            $stmt->bind_param("iissidssi", $institucionId, $deporteId, $nombreArea, $descripcion, $capacidad, $tarifa, $imagen, $estado, $id);
        } else {
            $query = "UPDATE areas_deportivas SET 
                      institucion_deportiva_id = ?, deporte_id = ?, nombre_area = ?, descripcion = ?, 
                      capacidad_jugadores = ?, tarifa_por_hora = ?, estado = ?
                      WHERE id = ?";
            $stmt = $this->conn->prepare($query);
            $stmt->bind_param("iissidsi", $institucionId, $deporteId, $nombreArea, $descripcion, $capacidad, $tarifa, $estado, $id);
        }
        return $stmt->execute();
    }

    // Eliminar área deportiva
    public function eliminarArea($id) {
        $query = "DELETE FROM areas_deportivas WHERE id = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("i", $id);
        return $stmt->execute();
    }

    // Obtener horarios de un área deportiva
    public function getHorariosArea($areaId) {
        $query = "SELECT * FROM areas_horarios WHERE area_deportiva_id = ? 
                  ORDER BY FIELD(dia, 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo')";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("i", $areaId);
        $stmt->execute();
        $result = $stmt->get_result();
        return $this->fetchAllAssoc($result);
    }

    // Obtener deportes disponibles
    public function getDeportes() {
        $query = "SELECT * FROM deportes ORDER BY nombre";
        $result = $this->conn->query($query);
        return $this->fetchAllAssoc($result);
    }

    // ✅ NUEVA FUNCIÓN: Actualizar horarios de área
    public function actualizarHorarios($areaId, $horarios) {
        try {
            // Primero eliminar horarios existentes
            $deleteQuery = "DELETE FROM areas_horarios WHERE area_deportiva_id = ?";
            $deleteStmt = $this->conn->prepare($deleteQuery);
            $deleteStmt->bind_param("i", $areaId);
            $deleteStmt->execute();
            
            // Insertar nuevos horarios
            $insertQuery = "INSERT INTO areas_horarios (area_deportiva_id, dia, hora_apertura, hora_cierre, disponible) VALUES (?, ?, ?, ?, ?)";
            $insertStmt = $this->conn->prepare($insertQuery);
            
            foreach ($horarios as $horario) {
                $insertStmt->bind_param("isssi", 
                    $areaId, 
                    $horario['dia'], 
                    $horario['hora_apertura'], 
                    $horario['hora_cierre'], 
                    $horario['disponible']
                );
                $insertStmt->execute();
            }
            
            return true;
        } catch (Exception $e) {
            return false;
        }
    }

    // ✅ NUEVA FUNCIÓN: Obtener áreas disponibles para torneos
    public function obtenerAreasDisponibles($sedeId, $deporteId, $fecha, $equiposNecesarios = 0) {
        // Obtener día de la semana en español
        $diaSemana = $this->obtenerDiaSemana($fecha);
        
        // ✅ CORRECCIÓN: Consulta más simple sin subconsultas complejas
        $sql = "SELECT 
                    ad.*,
                    ah.hora_apertura,
                    ah.hora_cierre,
                    ah.disponible as horario_disponible
                FROM areas_deportivas ad
                INNER JOIN areas_horarios ah ON ad.id = ah.area_deportiva_id
                WHERE ad.institucion_deportiva_id = ? 
                AND ad.deporte_id = ? 
                AND ad.estado = 'activa'
                AND ah.dia = ?
                AND ah.disponible = 1
                ORDER BY ad.nombre_area ASC";
    
        $stmt = $this->conn->prepare($sql);
        if (!$stmt) {
            error_log("Error en obtenerAreasDisponibles: " . $this->conn->error);
            return [];
        }
        
        $stmt->bind_param("iis", $sedeId, $deporteId, $diaSemana);
        $stmt->execute();
        
        $areas = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        
        // ✅ NUEVO: Verificar disponibilidad real verificando reservas
        $areasDisponibles = [];
        foreach ($areas as $area) {
            // Verificar si el área está libre en la fecha específica
            $libre = $this->verificarAreaLibreEnFecha($area['id'], $fecha, '08:00:00', '20:00:00');
            
            if ($libre) {
                // Filtrar por capacidad si se especifica equipos necesarios
                if ($equiposNecesarios <= 0 || $area['capacidad_jugadores'] >= $equiposNecesarios) {
                    $areasDisponibles[] = $area;
                }
            }
        }
        
        return $areasDisponibles;
    }

    // ✅ FUNCIÓN AUXILIAR: Obtener día de la semana en español
    private function obtenerDiaSemana($fecha) {
        $dias = [
            'Monday' => 'Lunes',
            'Tuesday' => 'Martes', 
            'Wednesday' => 'Miercoles',
            'Thursday' => 'Jueves',
            'Friday' => 'Viernes',
            'Saturday' => 'Sabado',
            'Sunday' => 'Domingo'
        ];
        
        $diaIngles = date('l', strtotime($fecha));
        return $dias[$diaIngles] ?? 'Lunes';
    }

    // ✅ NUEVA FUNCIÓN: Reservar área para torneo
    public function reservarAreaParaTorneo($areaId, $torneoId, $fecha, $horaInicio, $horaFin, $usuarioId) {
        // Primero verificar que la tabla tenga la columna observaciones
        $checkColumn = "SHOW COLUMNS FROM reservas LIKE 'observaciones'";
        $result = $this->conn->query($checkColumn);
        
        if ($result->num_rows > 0) {
            // Si existe la columna observaciones
            $sql = "INSERT INTO reservas 
                    (id_usuario, area_deportiva_id, fecha, hora_inicio, hora_fin, estado, observaciones)
                    VALUES (?, ?, ?, ?, ?, 'confirmada', ?)";
            
            $observaciones = "Reserva automática para torneo";
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("iissss", 
                $usuarioId, $areaId, $fecha, $horaInicio, $horaFin, $observaciones
            );
        } else {
            // Si no existe la columna observaciones
            $sql = "INSERT INTO reservas 
                    (id_usuario, area_deportiva_id, fecha, hora_inicio, hora_fin, estado)
                    VALUES (?, ?, ?, ?, ?, 'confirmada')";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("iisss", 
                $usuarioId, $areaId, $fecha, $horaInicio, $horaFin
            );
        }
        
        if ($stmt->execute()) {
            return [
                'success' => true,
                'reserva_id' => $this->conn->insert_id,
                'message' => 'Área reservada exitosamente para el torneo'
            ];
        } else {
            return [
                'success' => false,
                'message' => 'Error al reservar área: ' . $stmt->error
            ];
        }
    }

    // ✅ NUEVA FUNCIÓN: Verificar y reservar automáticamente áreas para torneo
    public function verificarYReservarAutomatico($sedeId, $deporteId, $fecha, $partidosNecesarios, $fase, $horarioTorneo) {
        // Obtener día de la semana en español
        $diaSemana = $this->obtenerDiaSemana($fecha);
        
        // Definir rango de horarios según el tipo
        switch($horarioTorneo) {
            case 'mananas':
                $horaInicio = '07:00:00';
                $horaFin = '13:00:00';
                break;
            case 'tardes':
                $horaInicio = '14:00:00';
                $horaFin = '20:00:00';
                break;
            case 'fines_semana':
                $horaInicio = '09:00:00';
                $horaFin = '18:00:00';
                break;
            default:
                $horaInicio = '07:00:00';
                $horaFin = '18:00:00';
        }
        
        // ✅ SÚPER SIMPLE: Solo buscar áreas disponibles
        $sql = "SELECT 
                    ad.*,
                    ah.hora_apertura,
                    ah.hora_cierre
                FROM areas_deportivas ad
                INNER JOIN areas_horarios ah ON ad.id = ah.area_deportiva_id
                WHERE ad.institucion_deportiva_id = ? 
                AND ad.deporte_id = ? 
                AND ad.estado = 'activa'
                AND ah.dia = ?
                AND ah.disponible = 1
                AND ah.hora_apertura <= ?
                AND ah.hora_cierre >= ?
                ORDER BY ad.nombre_area ASC";
    
        $stmt = $this->conn->prepare($sql);
        if (!$stmt) {
            return [
                'success' => false,
                'message' => 'Error en consulta: ' . $this->conn->error
            ];
        }
        
        $stmt->bind_param("iisss", $sedeId, $deporteId, $diaSemana, $horaInicio, $horaFin);
        $stmt->execute();
        
        $areasDisponibles = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        
        // ✅ SIMPLE: Verificar si hay conflictos con reservas existentes
        $areasLibres = [];
        foreach ($areasDisponibles as $area) {
            // Verificar si está libre
            $sqlConflictos = "SELECT COUNT(*) as total 
                             FROM reservas 
                             WHERE area_deportiva_id = ? 
                             AND fecha = ? 
                             AND estado IN ('confirmada', 'pendiente')";
            
            $stmtConflictos = $this->conn->prepare($sqlConflictos);
            $stmtConflictos->bind_param("is", $area['id'], $fecha);
            $stmtConflictos->execute();
            $conflictos = $stmtConflictos->get_result()->fetch_assoc();
            
            // Si no hay conflictos, está libre
            if ($conflictos['total'] == 0) {
                $areasLibres[] = $area;
            }
        }
        
        if (count($areasLibres) < $partidosNecesarios) {
            return [
                'success' => true,
                'reservas_realizadas' => 0,
                'message' => "Solo hay " . count($areasLibres) . " área(s) libre(s) de las " . $partidosNecesarios . " necesarias",
                'areas_encontradas' => count($areasLibres),
                'areas_necesarias' => $partidosNecesarios,
                'areas_libres' => $areasLibres
            ];
        }
        
        // ✅ SÚPER SIMPLE: Solo simular la reserva y mostrar horarios
        $reservasDetalle = [];
        $duracionPartido = 2; // 2 horas por partido
        
        for ($i = 0; $i < $partidosNecesarios; $i++) {
            $area = $areasLibres[$i];
            
            // Calcular horario específico para este partido
            $horaInicioPartido = date('H:i:s', strtotime($horaInicio) + ($i * $duracionPartido * 3600));
            $horaFinPartido = date('H:i:s', strtotime($horaInicioPartido) + ($duracionPartido * 3600));
            
            // Asegurar que no exceda el horario límite
            if (strtotime($horaFinPartido) > strtotime($horaFin)) {
                $horaFinPartido = $horaFin;
                $horaInicioPartido = date('H:i:s', strtotime($horaFin) - ($duracionPartido * 3600));
            }
            
            $reservasDetalle[] = [
                'area_id' => $area['id'],
                'nombre_area' => $area['nombre_area'],
                'hora_inicio' => $horaInicioPartido,
                'hora_fin' => $horaFinPartido,
                'tarifa_por_hora' => $area['tarifa_por_hora'],
                'partido_numero' => $i + 1,
                'simulado' => true // ✅ Indicar que es simulación
            ];
        }
        
        return [
            'success' => true,
            'reservas_realizadas' => count($reservasDetalle),
            'reservas_detalle' => $reservasDetalle,
            'message' => "Se encontraron " . count($reservasDetalle) . " área(s) disponibles para $fase",
            'simulado' => true
        ];
    }

    // ✅ NUEVA FUNCIÓN AUXILIAR: Verificar si área está libre en fecha específica
    private function verificarAreaLibreEnFecha($areaId, $fecha, $horaInicio, $horaFin) {
        $sql = "SELECT COUNT(*) as conflictos 
                FROM reservas 
                WHERE area_deportiva_id = ? 
                AND fecha = ? 
                AND estado IN ('confirmada', 'pendiente')
                AND (
                    (hora_inicio <= ? AND hora_fin > ?) OR 
                    (hora_inicio < ? AND hora_fin >= ?) OR
                    (hora_inicio >= ? AND hora_fin <= ?)
                )";
        
        $stmt = $this->conn->prepare($sql);
        if (!$stmt) {
            error_log("Error en verificarAreaLibreEnFecha: " . $this->conn->error);
            return false;
        }
        
        $stmt->bind_param("isssssss", $areaId, $fecha, $horaInicio, $horaInicio, $horaFin, $horaFin, $horaInicio, $horaFin);
        $stmt->execute();
        $result = $stmt->get_result();
        $conflictos = $result->fetch_assoc();
        
        // Si no hay conflictos (0), el área está libre
        return $conflictos['conflictos'] == 0;
    }

    // ✅ NUEVA FUNCIÓN: Obtener duración por deporte (CORREGIDA para futsal)
    private function obtenerDuracionPorDeporte($deporteId) {
        $duraciones = [
            1 => 1.0,  // Fútbol/Futsal: 1 hora (40 minutos + 20 min adicionales)
            2 => 1.0,  // Vóley: 1 hora  
            3 => 1.0   // Básquet: 1 hora
        ];
        
        return $duraciones[$deporteId] ?? 1.0; // Default 1 hora
    }

    // ✅ NUEVA FUNCIÓN: Obtener áreas por sede y deporte
    public function getAreasBySedeAndDeporte($sedeId, $deporteId) {
        $query = "SELECT ad.*, d.nombre as deporte_nombre, id.nombre as instalacion_nombre
                  FROM areas_deportivas ad
                  INNER JOIN deportes d ON ad.deporte_id = d.id
                  INNER JOIN instituciones_deportivas id ON ad.institucion_deportiva_id = id.id
                  WHERE ad.institucion_deportiva_id = ? 
                  AND ad.deporte_id = ? 
                  AND ad.estado = 'activa'
                  ORDER BY ad.nombre_area ASC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("ii", $sedeId, $deporteId);
        $stmt->execute();
        $result = $stmt->get_result();
        return $this->fetchAllAssoc($result);
    }
}

// ✅ MANEJO AJAX LIMPIO Y SEPARADO
if ($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'GET') {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    // Verificar autenticación solo para ciertas acciones
    $requireAuth = true;
    $action = '';
    
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        $action = $input['action'] ?? $_POST['action'] ?? '';
    } else {
        $action = $_GET['action'] ?? '';
    }
    
    // Acciones que no requieren autenticación específica
    $publicActions = ['verificar_disponibilidad_torneo', 'verificar_y_reservar_automatico', 'obtener_areas_institucion', 'get_area_cronograma', 'get_area'];
    
    if (in_array($action, $publicActions)) {
        $requireAuth = false;
    }
    
    if ($requireAuth && !in_array($action, $publicActions) && (!isset($_SESSION['user_id']) || $_SESSION['user_type'] !== 'instalacion')) {
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'No autorizado']);
        exit;
    }
    
    $model = new AreasDeportivasModel();
    
    try {
        // ✅ MANEJAR GET para obtener horarios
        if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action'])) {
            if ($_GET['action'] === 'get') {
                $areaId = $_GET['id'] ?? null;
                if ($areaId) {
                    $area = $model->getAreaById($areaId);
                    if ($area) {
                        header('Content-Type: application/json');
                        echo json_encode(['success' => true, 'data' => $area]);
                    } else {
                        header('Content-Type: application/json');
                        echo json_encode(['success' => false, 'message' => 'Área no encontrada']);
                    }
                } else {
                    header('Content-Type: application/json');
                    echo json_encode(['success' => false, 'message' => 'ID requerido']);
                }
                exit;
            } elseif ($_GET['action'] === 'getHorarios') {
                $areaId = $_GET['id'] ?? null;
                if ($areaId) {
                    $horarios = $model->getHorariosArea($areaId);
                    header('Content-Type: application/json');
                    echo json_encode(['success' => true, 'data' => $horarios]);
                } else {
                    header('Content-Type: application/json');
                    echo json_encode(['success' => false, 'message' => 'ID requerido']);
                }
                exit;
            } elseif ($_GET['action'] === 'obtener_areas_institucion') {
                $sedeId = $_GET['sede_id'] ?? null;
                if ($sedeId) {
                    $areas = $model->getAreasByInstitucion($sedeId);
                    header('Content-Type: application/json');
                    echo json_encode(['success' => true, 'areas' => $areas]);
                } else {
                    header('Content-Type: application/json');
                    echo json_encode(['success' => false, 'message' => 'ID requerido']);
                }
                exit;
            }
        }
        
        // Manejar POST
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $input = json_decode(file_get_contents('php://input'), true);
            $action = $input['action'] ?? $_POST['action'] ?? '';
            
            switch ($action) {
                case 'create':
                    $result = $model->crearArea(
                        $_POST['instalacionArea'],
                        $_POST['deporteArea'],
                        $_POST['nombreArea'],
                        $_POST['descripcionArea'] ?? '',
                        $_POST['capacidad'] ?? null,
                        $_POST['tarifaHora'],
                        $_POST['imagen_url'] ?? null,
                        $_POST['estadoArea'] ?? 'activa'
                    );
                    echo $result ? 'success' : 'error';
                    exit;
                    
                case 'update':
                    $result = $model->actualizarArea(
                        $_POST['areaId'],
                        $_POST['instalacionArea'],
                        $_POST['deporteArea'],
                        $_POST['nombreArea'],
                        $_POST['descripcionArea'] ?? '',
                        $_POST['capacidad'] ?? null,
                        $_POST['tarifaHora'],
                        $_POST['imagen_url'] ?? null,
                        $_POST['estadoArea'] ?? 'activa'
                    );
                    echo $result ? 'success' : 'error';
                    exit;
                    
                case 'delete':
                    $result = $model->eliminarArea($input['id']);
                    echo $result ? 'success' : 'error';
                    exit;
                    
                case 'updateHorarios':
                    $areaId = $input['areaId'];
                    $horarios = $input['horarios'];
                    $result = $model->actualizarHorarios($areaId, $horarios);
                    echo $result ? 'success' : 'error';
                    exit;
                
                // ✅ NUEVO CASO: Verificar disponibilidad para torneos
                case 'verificar_disponibilidad_torneo':
                    $sedeId = $input['sede_id'] ?? null;
                    $deporteId = $input['deporte_id'] ?? null;
                    $fecha = $input['fecha'] ?? null;
                    $equiposNecesarios = $input['equipos_necesarios'] ?? 0;
                    
                    if (!$sedeId || !$deporteId || !$fecha) {
                        header('Content-Type: application/json');
                        echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
                        exit;
                    }
                    
                    $areas = $model->obtenerAreasDisponibles($sedeId, $deporteId, $fecha, $equiposNecesarios);
                    header('Content-Type: application/json');
                    echo json_encode(['success' => true, 'areas' => $areas]);
                    exit;
                
                // ✅ NUEVO CASO: Verificar y reservar automáticamente para torneos
                case 'verificar_y_reservar_automatico':
                    $sedeId = $input['sede_id'] ?? null;
                    $deporteId = $input['deporte_id'] ?? null;
                    $fecha = $input['fecha'] ?? null;
                    $partidosNecesarios = $input['partidos_necesarios'] ?? 0;
                    $fase = $input['fase'] ?? '';
                    $horarioTorneo = $input['horario_torneo'] ?? 'mananas';
                    
                    if (!$sedeId || !$deporteId || !$fecha || !$partidosNecesarios) {
                        header('Content-Type: application/json');
                        echo json_encode(['success' => false, 'message' => 'Datos incompletos para reserva automática']);
                        exit;
                    }
                    
                    $resultado = $model->verificarYReservarAutomatico($sedeId, $deporteId, $fecha, $partidosNecesarios, $fase, $horarioTorneo);
                    header('Content-Type: application/json');
                    echo json_encode($resultado);
                    exit;
                    
                default:
                    header('Content-Type: application/json');
                    echo json_encode(['success' => false, 'message' => 'Acción no válida']);
                    exit;
            }
        }
        
    } catch (Exception $e) {
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
        exit;
    }
}
?>
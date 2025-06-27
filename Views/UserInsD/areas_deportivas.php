<?php
session_start();

// Verificar si el usuario está autenticado como institución deportiva
if (!isset($_SESSION['user_id']) || !isset($_SESSION['user_type']) || $_SESSION['user_type'] !== 'instalacion') {
    header("Location: ../Auth/login.php");
    exit();
}

// Usar los controladores
require_once '../../Controllers/InsDeporController.php';
require_once '../../Controllers/AreasDeportivasController.php';

$insDeporController = new InsDeporController();
$areasController = new AreasDeportivasController();

$usuarioInstalacionId = $_SESSION['user_id'];

// Obtener datos reales de la institución
$misInstalaciones = $insDeporController->getInstalacionesPorUsuario($usuarioInstalacionId);
$datosCalificacion = $insDeporController->getCalificacionPromedioPorUsuario($usuarioInstalacionId);
$deportesDisponibles = $areasController->getDeportes();

// ✅ OBTENER ÁREAS SIN PROCESAMIENTO ADICIONAL
$todasLasAreas = $areasController->getAreasByUsuarioInstalacion($usuarioInstalacionId);

// ✅ FILTROS MEJORADOS
$instalacionSeleccionada = isset($_GET['instalacion']) ? (int)$_GET['instalacion'] : null;
$deporteSeleccionado = isset($_GET['deporte']) ? (int)$_GET['deporte'] : null;
$nombreBusqueda = isset($_GET['nombre']) ? trim($_GET['nombre']) : '';

// Aplicar filtros
$areasDeportivas = $todasLasAreas;

// Filtrar por instalación
if ($instalacionSeleccionada) {
    $areasDeportivas = array_filter($areasDeportivas, function($area) use ($instalacionSeleccionada) {
        return $area['institucion_deportiva_id'] == $instalacionSeleccionada;
    });
}

// Filtrar por deporte
if ($deporteSeleccionado) {
    $areasDeportivas = array_filter($areasDeportivas, function($area) use ($deporteSeleccionado) {
        return $area['deporte_id'] == $deporteSeleccionado;
    });
}

// Filtrar por nombre
if ($nombreBusqueda) {
    $areasDeportivas = array_filter($areasDeportivas, function($area) use ($nombreBusqueda) {
        return stripos($area['nombre_area'], $nombreBusqueda) !== false;
    });
}

// Estadísticas para el filtro
$totalAreas = count($todasLasAreas);
$areasActivas = count(array_filter($todasLasAreas, function($area) { return $area['estado'] === 'activa'; }));
$areasFiltradas = count($areasDeportivas);

// Incluir cabecera
include_once 'header.php';
?>
<link rel="stylesheet" href="../../Public/cssInsDepor/instalaciones_areas.css">

<div class="instalaciones-container-inst">
    <!-- Sección de Áreas Deportivas -->
    <div class="areas-section">
        <div class="areas-header">
            <h2><i class="fas fa-running"></i> Gestión de Áreas Deportivas</h2>
            <button class="btn-primary-inst" id="nuevaArea">
                <i class="fas fa-plus"></i> Nueva Área Deportiva
            </button>
        </div>

        <!-- ✅ FILTROS MEJORADOS -->
        <div class="instalaciones-filter">
            <div class="filter-header">
                <h3><i class="fas fa-filter"></i> Filtros de Búsqueda</h3>
                <div class="filter-stats">
                    <div class="filter-stat">
                        <i class="fas fa-chart-bar"></i>
                        <span class="number"><?= $totalAreas ?></span>
                        <span class="label">Total</span>
                    </div>
                    <div class="filter-stat">
                        <i class="fas fa-check-circle"></i>
                        <span class="number"><?= $areasActivas ?></span>
                        <span class="label">Activas</span>
                    </div>
                    <div class="filter-stat">
                        <i class="fas fa-search"></i>
                        <span class="number"><?= $areasFiltradas ?></span>
                        <span class="label">Mostradas</span>
                    </div>
                </div>
            </div>
            <form method="GET" class="filter-controls">
                <div class="filter-row">
                    <?php if (count($misInstalaciones) > 1): ?>
                    <div class="filter-group">
                        <label for="instalacion">Instalación:</label>
                        <select name="instalacion" id="instalacion" class="filter-select">
                            <option value="">Todas las instalaciones</option>
                            <?php foreach ($misInstalaciones as $instalacion): ?>
                                <option value="<?= $instalacion['id'] ?>" <?= $instalacionSeleccionada == $instalacion['id'] ? 'selected' : '' ?>>
                                    <?= htmlspecialchars($instalacion['nombre']) ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <?php endif; ?>
                    
                    <div class="filter-group">
                        <label for="deporte">Deporte:</label>
                        <select name="deporte" id="deporte" class="filter-select">
                            <option value="">Todos los deportes</option>
                            <?php foreach ($deportesDisponibles as $deporte): ?>
                                <option value="<?= $deporte['id'] ?>" <?= $deporteSeleccionado == $deporte['id'] ? 'selected' : '' ?>>
                                    <?= ucfirst($deporte['nombre']) ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    
                    <div class="filter-group">
                        <label for="nombre">Buscar por nombre:</label>
                        <input type="text" name="nombre" id="nombre" class="filter-input" 
                               placeholder="Nombre del área..." value="<?= htmlspecialchars($nombreBusqueda) ?>">
                    </div>
                    
                    <div class="filter-actions">
                        <button type="submit" class="btn-filter">
                            <i class="fas fa-search"></i> Filtrar
                        </button>
                        <a href="areas_deportivas.php" class="btn-filter-reset">
                            <i class="fas fa-times"></i> Limpiar
                        </a>
                    </div>
                </div>
            </form>
        </div>

        <!-- Formulario de nueva área (oculto por defecto) -->
        <div class="nueva-area-form" id="formularioNuevaArea">
            <div class="form-header">
                <h2><i class="fas fa-plus-circle"></i> Nueva Área Deportiva</h2>
                <button class="btn-secondary-inst" id="cancelarNuevaArea">
                    <i class="fas fa-times"></i> Cancelar
                </button>
            </div>
            <form id="formNuevaArea">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="instalacionArea">Instalación</label>
                        <select id="instalacionArea" name="instalacionArea" required>
                            <option value="">Seleccionar instalación</option>
                            <?php foreach ($misInstalaciones as $instalacion): ?>
                                <option value="<?= $instalacion['id'] ?>">
                                    <?= htmlspecialchars($instalacion['nombre']) ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="deporteArea">Deporte</label>
                        <select id="deporteArea" name="deporteArea" required>
                            <option value="">Seleccionar deporte</option>
                            <?php foreach ($deportesDisponibles as $deporte): ?>
                                <option value="<?= $deporte['id'] ?>">
                                    <?= ucfirst($deporte['nombre']) ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="nombreArea">Nombre del Área</label>
                        <input type="text" id="nombreArea" name="nombreArea" placeholder="Ej: Cancha de Fútbol 1" required>
                    </div>
                    <div class="form-group">
                        <label for="capacidad">Capacidad de Jugadores</label>
                        <input type="number" id="capacidad" name="capacidad" min="2" max="50" placeholder="22">
                    </div>
                    <div class="form-group">
                        <label for="tarifaHora">Tarifa por Hora (S/.)</label>
                        <input type="number" id="tarifaHora" name="tarifaHora" step="0.01" min="0" placeholder="50.00" required>
                    </div>
                    <div class="form-group">
                        <label for="estadoArea">Estado</label>
                        <select id="estadoArea" name="estadoArea" required>
                            <option value="activa">Activa</option>
                            <option value="mantenimiento">En Mantenimiento</option>
                            <option value="inactiva">Inactiva</option>
                        </select>
                    </div>
                    <div class="form-group full-width">
                        <label for="descripcionArea">Descripción</label>
                        <textarea id="descripcionArea" name="descripcionArea" rows="3" placeholder="Descripción del área deportiva"></textarea>
                    </div>
                    <div class="form-group full-width">
                        <label for="imagenArea">Imagen del Área</label>
                        <div class="image-upload-container">
                            <input type="file" id="imagenArea" name="imagenArea" accept="image/*" class="file-input">
                            <div class="image-preview" id="imagePreview">
                                <div class="upload-placeholder">
                                    <i class="fas fa-cloud-upload-alt"></i>
                                    <p>Arrastra una imagen aquí o haz clic para seleccionar</p>
                                    <small>Máximo 5MB - JPG, PNG, GIF</small>
                                </div>
                            </div>
                            <div class="upload-progress" id="uploadProgress" style="display: none;">
                                <div class="progress-bar">
                                    <div class="progress-fill" id="progressFill"></div>
                                </div>
                                <span class="progress-text" id="progressText">0%</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn-primary-inst">
                        <i class="fas fa-save"></i> Crear Área
                    </button>
                </div>
            </form>
        </div>

        <!-- Formulario de editar área (oculto por defecto) -->
        <div class="nueva-area-form" id="formularioEditarArea">
            <div class="form-header">
                <h2><i class="fas fa-edit"></i> Editar Área Deportiva</h2>
                <button class="btn-secondary-inst" id="cancelarEditarArea">
                    <i class="fas fa-times"></i> Cancelar
                </button>
            </div>
            <form id="formEditarArea">
                <input type="hidden" id="editAreaId" name="areaId">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="editInstalacionArea">Instalación</label>
                        <select id="editInstalacionArea" name="instalacionArea" required>
                            <option value="">Seleccionar instalación</option>
                            <?php foreach ($misInstalaciones as $instalacion): ?>
                                <option value="<?= $instalacion['id'] ?>">
                                    <?= htmlspecialchars($instalacion['nombre']) ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="editDeporteArea">Deporte</label>
                        <select id="editDeporteArea" name="deporteArea" required>
                            <option value="">Seleccionar deporte</option>
                            <?php foreach ($deportesDisponibles as $deporte): ?>
                                <option value="<?= $deporte['id'] ?>">
                                    <?= ucfirst($deporte['nombre']) ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="editNombreArea">Nombre del Área</label>
                        <input type="text" id="editNombreArea" name="nombreArea" required>
                    </div>
                    <div class="form-group">
                        <label for="editCapacidad">Capacidad de Jugadores</label>
                        <input type="number" id="editCapacidad" name="capacidad" min="2" max="50">
                    </div>
                    <div class="form-group">
                        <label for="editTarifaHora">Tarifa por Hora (S/.)</label>
                        <input type="number" id="editTarifaHora" name="tarifaHora" step="0.01" min="0" required>
                    </div>
                    <div class="form-group">
                        <label for="editEstadoArea">Estado</label>
                        <select id="editEstadoArea" name="estadoArea" required>
                            <option value="activa">Activa</option>
                            <option value="mantenimiento">En Mantenimiento</option>
                            <option value="inactiva">Inactiva</option>
                        </select>
                    </div>
                    <div class="form-group full-width">
                        <label for="editDescripcionArea">Descripción</label>
                        <textarea id="editDescripcionArea" name="descripcionArea" rows="3"></textarea>
                    </div>
                    <div class="form-group full-width">
                        <label for="editImagenArea">Imagen del Área</label>
                        <div class="image-upload-container">
                            <input type="file" id="editImagenArea" name="imagenArea" accept="image/*" class="file-input">
                            <div class="image-preview" id="editImagePreview">
                                <div class="upload-placeholder">
                                    <i class="fas fa-cloud-upload-alt"></i>
                                    <p>Arrastra una imagen aquí o haz clic para cambiar</p>
                                    <small>Máximo 5MB - JPG, PNG, GIF</small>
                                </div>
                            </div>
                            <div class="upload-progress" id="editUploadProgress" style="display: none;">
                                <div class="progress-bar">
                                    <div class="progress-fill" id="editProgressFill"></div>
                                </div>
                                <span class="progress-text" id="editProgressText">0%</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn-primary-inst">
                        <i class="fas fa-save"></i> Guardar Cambios
                    </button>
                </div>
            </form>
        </div>

        <!-- ✅ CAMBIAR COMPLETAMENTE EL GRID DE ÁREAS DEPORTIVAS -->
        <div class="areas-grid">
            <?php if (!empty($areasDeportivas)): ?>
                <?php 
                // ✅ RESETEAR ÍNDICE PARA FORZAR ORDEN CORRECTO
                $areasOrdenadas = array_values($areasDeportivas);
                $totalAreasAMostrar = count($areasOrdenadas);
                ?>
                
                <!-- ✅ DEBUG: Mostrar total de áreas a renderizar -->
                <!-- Total áreas a mostrar: <?= $totalAreasAMostrar ?> -->
                
                <?php for ($i = 0; $i < $totalAreasAMostrar; $i++): ?>
                    <?php 
                    // ✅ OBTENER ÁREA POR ÍNDICE ESPECÍFICO
                    $areaActual = $areasOrdenadas[$i];
                    
                    // ✅ LIMPIAR Y PREPARAR DATOS DE ESTA ÁREA ESPECÍFICA
                    $areaId = (int)$areaActual['id'];
                    $areaNombre = htmlspecialchars($areaActual['nombre_area'] ?? 'Sin nombre');
                    $areaDescripcion = htmlspecialchars($areaActual['descripcion'] ?? 'Sin descripción');
                    $areaDeporte = ucfirst($areaActual['deporte_nombre'] ?? 'Sin deporte');
                    $areaEstado = $areaActual['estado'] ?? 'activa';
                    $areaCapacidad = $areaActual['capacidad_jugadores'] ?? 'N/A';
                    $areaTarifa = number_format((float)$areaActual['tarifa_por_hora'], 2);
                    $areaImagen = $areaActual['imagen_area'] ?? '';
                    $institucionNombre = htmlspecialchars($areaActual['institucion_nombre'] ?? 'Sin institución');
                    
                    // ✅ OBTENER HORARIOS ESPECÍFICOS PARA ESTA ÁREA
                    $horariosEspecificos = [];
                    try {
                        $horariosEspecificos = $areasController->getHorariosAreaFormateados($areaId);
                        if (empty($horariosEspecificos)) {
                            $horariosEspecificos = [
                                'Lunes' => '07:00 - 21:00',
                                'Martes' => '07:00 - 21:00',
                                'Miércoles' => '07:00 - 21:00',
                                'Jueves' => '07:00 - 21:00',
                                'Viernes' => '07:00 - 22:00',
                                'Sábado' => '08:00 - 22:00',
                                'Domingo' => '09:00 - 20:00'
                            ];
                        }
                    } catch (Exception $e) {
                        $horariosEspecificos = ['Error' => 'No disponible'];
                    }
                    ?>
                    
                    <!-- ✅ DEBUG: Información de cada área -->
                    <!-- Área <?= $i + 1 ?>: ID=<?= $areaId ?>, Nombre=<?= $areaNombre ?> -->
                    
                    <div class="area-card" data-area-index="<?= $i ?>" data-area-id="<?= $areaId ?>">
                        <div class="area-image">
                            <?php if (!empty($areaImagen)): ?>
                                <img src="<?= $areaImagen ?>" alt="<?= $areaNombre ?>" loading="lazy">
                            <?php else: ?>
                                <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: linear-gradient(135deg, #e9ecef, #f8f9fa); color: #6c757d;">
                                    <i class="fas fa-image" style="font-size: 3rem;"></i>
                                </div>
                            <?php endif; ?>
                            <div class="area-deporte"><?= $areaDeporte ?></div>
                            <div class="area-status <?= $areaEstado ?>"><?= ucfirst($areaEstado) ?></div>
                        </div>
                        
                        <div class="area-content">
                            <h3><?= $areaNombre ?></h3>
                            <p class="area-description">
                                <i class="fas fa-building"></i> <?= $institucionNombre ?>
                            </p>
                            <p class="area-description"><?= $areaDescripcion ?></p>
                            
                            <div class="area-details">
                                <div class="detail-item">
                                    <i class="fas fa-users"></i>
                                    <span>Capacidad: <span class="value"><?= $areaCapacidad ?> jugadores</span></span>
                                </div>
                                <div class="detail-item">
                                    <i class="fas fa-clock"></i>
                                    <span>Estado: <span class="value"><?= ucfirst($areaEstado) ?></span></span>
                                </div>
                            </div>

                            <div class="area-tarifa">
                                <div class="tarifa-amount">S/. <?= $areaTarifa ?></div>
                                <div class="tarifa-label">por hora</div>
                            </div>

                            <?php if (!empty($horariosEspecificos)): ?>
                            <div class="horarios-area">
                                <h4><i class="fas fa-calendar-alt"></i> Horarios de Atención</h4>
                                <div class="horarios-grid">
                                    <?php foreach ($horariosEspecificos as $dia => $horario): ?>
                                    <div class="horario-dia">
                                        <span class="dia-nombre"><?= $dia ?></span>
                                        <span class="dia-horario"><?= $horario ?></span>
                                    </div>
                                    <?php endforeach; ?>
                                </div>
                            </div>
                            <?php endif; ?>

                            <div class="area-actions">
                                <button class="btn-small btn-success" onclick="editarArea(<?= $areaId ?>)">
                                    <i class="fas fa-edit"></i> Editar
                                </button>
                                <button class="btn-small btn-warning" onclick="gestionarHorariosArea(<?= $areaId ?>, '<?= $areaNombre ?>')">
                                    <i class="fas fa-clock"></i> Horarios
                                </button>
                                <button class="btn-small btn-danger" onclick="eliminarArea(<?= $areaId ?>)">
                                    <i class="fas fa-trash"></i> Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                    
                <?php endfor; ?>
                
            <?php elseif ($instalacionSeleccionada || $deporteSeleccionado || $nombreBusqueda): ?>
                <div class="no-selection">
                    <i class="fas fa-search"></i>
                    <h3>No se encontraron áreas deportivas</h3>
                    <p>No hay áreas que coincidan con los filtros aplicados. Intenta con otros criterios de búsqueda.</p>
                    <a href="areas_deportivas.php" class="btn-primary-inst" style="margin-top: 15px;">
                        <i class="fas fa-times"></i> Limpiar Filtros
                    </a>
                </div>
            <?php else: ?>
                <div class="empty-areas">
                    <i class="fas fa-running"></i>
                    <h3>¡Crea tu primera área deportiva!</h3>
                    <p>Aún no tienes áreas deportivas registradas. Comienza agregando espacios para que los usuarios puedan reservar.</p>
                    <button class="btn-primary-inst" onclick="document.getElementById('nuevaArea').click()" style="margin-top: 15px;">
                        <i class="fas fa-plus"></i> Nueva Área Deportiva
                    </button>
                </div>
            <?php endif; ?>
        </div>
    </div>
</div>

<!-- ✅ MODAL DE HORARIOS -->
<div class="modal-overlay" id="modalHorarios">
    <div class="modal-content">
        <div class="modal-header">
            <h3><i class="fas fa-clock"></i> Gestionar Horarios</h3>
            <button class="modal-close" onclick="cerrarModalHorarios()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="modal-body">
            <div class="horarios-info">
                <h4 id="modalAreaNombre">Área Deportiva</h4>
                <p class="modal-description">Configure los horarios de disponibilidad para esta área deportiva</p>
            </div>
            
            <form id="formHorarios">
                <input type="hidden" id="modalAreaId" name="areaId">
                <div class="horarios-grid-modal">
                    <?php 
                    $diasSemana = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
                    foreach ($diasSemana as $dia): 
                    ?>
                    <div class="horario-item">
                        <div class="horario-dia-header">
                            <label class="horario-dia-label">
                                <input type="checkbox" id="disponible_<?= $dia ?>" name="disponible[<?= $dia ?>]" value="1" checked>
                                <span><?= $dia ?></span>
                            </label>
                        </div>
                        <div class="horario-inputs">
                            <div class="input-group">
                                <label>Apertura:</label>
                                <input type="time" id="apertura_<?= $dia ?>" name="apertura[<?= $dia ?>]" value="07:00">
                            </div>
                            <div class="input-group">
                                <label>Cierre:</label>
                                <input type="time" id="cierre_<?= $dia ?>" name="cierre[<?= $dia ?>]" value="21:00">
                            </div>
                        </div>
                    </div>
                    <?php endforeach; ?>
                </div>
            </form>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn-secondary-inst" onclick="cerrarModalHorarios()">
                <i class="fas fa-times"></i> Cancelar
            </button>
            <button type="button" class="btn-primary-inst" onclick="guardarHorarios()">
                <i class="fas fa-save"></i> Guardar Horarios
            </button>
        </div>
    </div>
</div>

<!-- Solo incluir el archivo JS - SIN código duplicado -->
<script src="../../Public/js/areas_deportivas.js"></script>

<?php 
require_once __DIR__ . '/../../Helpers/GameOnBotE.php'; // Ajusta la ruta si lo pusiste en otro lado
$secret = 'wn37wf4xze9u4cdokc1no5xfqwecd75u'; // Tu clave secreta de Chatbase
$userId = $SESSION['user_id'] ?? uniqid('user');
$botId  = 'Vk9zMweVEIr6M0u_y9-z5'; // El ID de tu bot de Chatbase (del script embed)
$bot = new GameOnBot($secret, $userId, $botId);
echo $bot->getEmbedScript();
include_once 'footer.php'; ?>

<?php
// ✅ DEBUG TEMPORAL - AGREGAR DESPUÉS DE: $todasLasAreas = $areasController->getAreasByUsuarioInstalacion($usuarioInstalacionId);

echo "<!-- DEBUG PHP: \n";
echo "Total áreas obtenidas: " . count($todasLasAreas) . "\n";
foreach ($todasLasAreas as $idx => $area) {
    echo "Área $idx: ID={$area['id']}, Nombre={$area['nombre_area']}\n";
}
echo " -->";

// ✅ VERIFICAR DUPLICADOS EN PHP
$idsUnicos = [];
$duplicados = [];
foreach ($todasLasAreas as $area) {
    if (in_array($area['id'], $idsUnicos)) {
        $duplicados[] = $area['id'];
        echo "<!-- ❌ DUPLICADO DETECTADO EN PHP: ID={$area['id']} -->";
    } else {
        $idsUnicos[] = $area['id'];
    }
}

if (!empty($duplicados)) {
    echo "<!-- ❌ DUPLICADOS ENCONTRADOS: " . implode(', ', $duplicados) . " -->";
} else {
    echo "<!-- ✅ NO HAY DUPLICADOS EN PHP -->";
}
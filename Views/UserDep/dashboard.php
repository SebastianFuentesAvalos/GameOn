<?php
// filepath: c:\xampp\htdocs\GameOn_Network\Views\UserDep\dashboard.php
session_start();

// Verificar si el usuario está autenticado como deportista
if (!isset($_SESSION['user_id']) || !isset($_SESSION['user_type']) || $_SESSION['user_type'] !== 'deportista') {
    header("Location: ../Auth/login.php");
    exit();
}

// Obtener las instalaciones deportivas
require_once '../../Controllers/InsDeporController.php';
require_once '../../Controllers/PerfilController.php';

$insDeporController = new InsDeporController();
$perfilController = new PerfilController();
$instalaciones = $insDeporController->getInstalacionesCompletas($_SESSION['user_id']);

// ✅ AGREGAR DESPUÉS DE OBTENER LAS INSTALACIONES
$instalaciones = $insDeporController->getInstalacionesCompletas($_SESSION['user_id']);

// ✅ DEBUG: Verificar estructura de datos
error_log("DEBUG - Total instalaciones obtenidas: " . count($instalaciones));
if (!empty($instalaciones)) {
    error_log("DEBUG - Primera instalación: " . print_r($instalaciones[0], true));
    if (isset($instalaciones[0]['deportes'])) {
        error_log("DEBUG - Deportes primera instalación: " . print_r($instalaciones[0]['deportes'], true));
    }
}

// Obtener datos del perfil y deportes del usuario
$perfilUsuario = $perfilController->getPerfilDeportista($_SESSION['user_id']);
$deportesUsuario = $perfilController->getDeportesUsuario($_SESSION['user_id']);

// Incluir cabecera (ya incluye dashboard_dep.css y dashboard_modales.css)
include_once 'header.php';
?>

<!-- ✅ AGREGAR CSS ESPECÍFICO AQUÍ -->
<link rel="stylesheet" href="../../Public/css/dashboard_dep.css">
<link rel="stylesheet" href="../../Public/css/dashboard_modales.css">

<div class="dashboard-container">
    <div class="dashboard-row">
        <!-- Información Personal -->
        <div class="dashboard-card">
            <h2><i class="fas fa-user"></i> Información Personal</h2>
            <div class="user-profile">
                <div class="profile-image">
                    <img src="../../Resources/logo_user.jpg" alt="Foto de perfil">
                </div>
                <div class="profile-info">
                    <h3><?php echo $_SESSION['username']; ?></h3>
                    <p><?php echo $perfilUsuario['nombre'] ?? 'Nombre'; ?> <?php echo $perfilUsuario['apellidos'] ?? 'Apellido'; ?></p>
                    <p><i class="fas fa-phone"></i> <?php echo $perfilUsuario['telefono'] ?? 'Sin teléfono'; ?></p>
                </div>
            </div>
            <button class="btn-outline" onclick="abrirModalPerfil()">
                <i class="fas fa-edit"></i> Editar Perfil
            </button>
        </div>

        <!-- Deportes Favoritos -->
        <div class="dashboard-card">
            <h2><i class="fas fa-heart"></i> Deportes Favoritos</h2>
            <div class="sports-tags" id="deportesFavoritos">
                <?php if (!empty($deportesUsuario)): ?>
                    <?php foreach ($deportesUsuario as $deporte): ?>
                        <span class="sport-tag" data-deporte-id="<?= $deporte['id'] ?>">
                            <i class="fas fa-running"></i>
                            <?= ucfirst($deporte['nombre']) ?>
                            <i class="fas fa-times" onclick="eliminarDeporte(<?= $deporte['id'] ?>)" title="Eliminar deporte"></i>
                        </span>
                    <?php endforeach; ?>
                <?php else: ?>
                    <p class="text-muted">No tienes deportes agregados</p>
                <?php endif; ?>
            </div>
            <button class="btn-outline" onclick="abrirModalDeportes()">
                <i class="fas fa-plus"></i> Agregar Deportes
            </button>
        </div>
    </div>

    <!-- Opciones de Reserva en Tiempo Real -->
    <div class="dashboard-wide-card">
        <h2><i class="fas fa-clock"></i> Opciones de Reserva en Tiempo Real</h2>
        <div class="reservation-options">
            <?php foreach (array_slice($instalaciones, 0, 3) as $instalacion): ?>
            <div class="reservation-card">
                <h3><?= $instalacion['nombre'] ?></h3>
                <p><strong><i class="fas fa-running"></i> Deportes:</strong> <?= implode(', ', array_column($instalacion['deportes'], 'nombre')) ?></p>
                <p><strong><i class="fas fa-money-bill"></i> Tarifa:</strong> S/. <?= number_format($instalacion['tarifa'], 2) ?></p>
                <button class="btn-primary" onclick="verInstalacionCompleta(<?= $instalacion['id'] ?>)">
                    <i class="fas fa-eye"></i> Ver Detalles
                </button>
            </div>
            <?php endforeach; ?>
        </div>
    </div>

    <!-- Instalaciones Deportivas Cercanas -->
    <div class="dashboard-wide-card">
        <h2>
            <i class="fas fa-map-marker-alt"></i> 
            Instalaciones Deportivas 
            <?php if (!empty($deportesUsuario)): ?>
                <span class="filtro-info">
                    (Filtradas por tus deportes favoritos: <?= implode(', ', array_column($deportesUsuario, 'nombre')) ?>)
                </span>
            <?php else: ?>
                <span class="filtro-info">(Mostrando todas las instalaciones)</span>
            <?php endif; ?>
        </h2>
        
        <?php if (empty($instalaciones)): ?>
            <div class="sin-instalaciones-mensaje">
                <i class="fas fa-info-circle" style="font-size: 3rem; color: #ffc107; margin-bottom: 15px;"></i>
                <h3>No hay instalaciones para tus deportes favoritos</h3>
                <p>Las instalaciones disponibles no ofrecen los deportes que tienes marcados como favoritos.</p>
                
                <?php if (empty($deportesUsuario)): ?>
                    <p><strong>Sugerencia:</strong> Agrega deportes favoritos para ver instalaciones específicas.</p>
                    <button class="btn-primary" onclick="abrirModalDeportes()">
                        <i class="fas fa-plus"></i> Agregar Deportes Favoritos
                    </button>
                <?php else: ?>
                    <p><strong>Sugerencia:</strong> Puedes agregar más deportes o ver todas las instalaciones.</p>
                    <div style="display: flex; gap: 15px; justify-content: center; margin-top: 15px;">
                        <button class="btn-primary" onclick="abrirModalDeportes()">
                            <i class="fas fa-plus"></i> Agregar Más Deportes
                        </button>
                        <button class="btn-outline" onclick="mostrarTodasInstalaciones()">
                            <i class="fas fa-eye"></i> Ver Todas las Instalaciones
                        </button>
                    </div>
                <?php endif; ?>
            </div>
        <?php else: ?>
            <div class="map-container">
                <div id="map">
                    <div class="loading">
                        <div class="spinner-border"></div>
                        <p>Cargando mapa de instalaciones...</p>
                    </div>
                </div>
            </div>
            
            <!-- Lista de instalaciones filtradas -->
            <div class="nearby-facilities">
                <?php foreach ($instalaciones as $instalacion): ?>
                <div class="facility-item">
                    <h3><?= $instalacion['nombre'] ?></h3>
                    <p><i class="fas fa-running"></i> <?= implode(', ', array_column($instalacion['deportes'], 'nombre')) ?></p>
                    <p><i class="fas fa-map-marker-alt"></i> <?= $instalacion['direccion'] ?></p>
                    <p><i class="fas fa-star"></i> <?= number_format($instalacion['calificacion'], 1) ?> estrellas</p>
                    <button class="btn-primary btn-sm" onclick="verInstalacionCompleta(<?= $instalacion['id'] ?>)">
                        <i class="fas fa-eye"></i> Ver más
                    </button>
                </div>
                <?php endforeach; ?>
            </div>
            
            <!-- ✅ BOTÓN PARA VER TODAS LAS INSTALACIONES -->
            <div class="ver-todas-instalaciones">
                <button class="btn-outline" onclick="mostrarTodasInstalaciones()">
                    <i class="fas fa-globe"></i> Ver Todas las Instalaciones Disponibles
                </button>
            </div>
        <?php endif; ?>
    </div>

    <!-- Historia de Reservas -->
    <div class="dashboard-wide-card">
        <h2><i class="fas fa-history"></i> Historia de Reservas</h2>
        <div class="reservation-history">
            <div class="history-card">
                <h3>Cancha de Baloncesto - Tacna Arena</h3>
                <p><i class="fas fa-calendar"></i> Fecha: 12 de mayo, 2023</p>
                <p><i class="fas fa-check-circle"></i> Estado: Completada</p>
            </div>
            <div class="history-card">
                <h3>Cancha de Tenis - City Sports Club</h3>
                <p><i class="fas fa-calendar"></i> Fecha: 5 de mayo, 2023</p>
                <p><i class="fas fa-check-circle"></i> Estado: Completada</p>
            </div>
            <div class="history-card">
                <h3>Piscina Olímpica - AquaCenter</h3>
                <p><i class="fas fa-calendar"></i> Fecha: 28 de abril, 2023</p>
                <p><i class="fas fa-times-circle"></i> Estado: Cancelada</p>
            </div>
        </div>
    </div>
</div>

<!-- ✅ MODALES CON DISEÑO MEJORADO -->

<!-- Modal Agregar Deportes -->
<div id="modalDeportes" class="modal-dashboard" style="display: none;">
    <div class="modal-backdrop" onclick="cerrarModal('modalDeportes')"></div>
    <div class="modal-container-dashboard">
        <div class="modal-header-dashboard">
            <h3 class="modal-title-dashboard">
                <i class="fas fa-plus-circle"></i>
                Agregar Deportes Favoritos
            </h3>
            <button class="modal-close-btn" onclick="cerrarModal('modalDeportes')">&times;</button>
        </div>
        <div class="modal-body-dashboard">
            <div id="listaDeportes" class="deportes-container">
                <div class="loading">
                    <div class="spinner-border"></div>
                    <p>Cargando deportes disponibles...</p>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Modal Editar Perfil -->
<div id="modalPerfil" class="modal-dashboard" style="display: none;">
    <div class="modal-backdrop" onclick="cerrarModal('modalPerfil')"></div>
    <div class="modal-container-dashboard">
        <div class="modal-header-dashboard">
            <h3 class="modal-title-dashboard">
                <i class="fas fa-user-edit"></i>
                Editar Información Personal
            </h3>
            <button class="modal-close-btn" onclick="cerrarModal('modalPerfil')">&times;</button>
        </div>
        <div class="modal-body-dashboard">
            <form id="formPerfil" class="form-dashboard">
                <div class="form-row-dashboard">
                    <div class="form-group-dashboard">
                        <label for="nombre">
                            <i class="fas fa-user"></i>
                            Nombre
                        </label>
                        <input type="text" id="nombre" name="nombre" class="form-input-dashboard" required>
                    </div>
                    <div class="form-group-dashboard">
                        <label for="apellidos">
                            <i class="fas fa-user-tag"></i>
                            Apellidos
                        </label>
                        <input type="text" id="apellidos" name="apellidos" class="form-input-dashboard" required>
                    </div>
                </div>
                
                <div class="form-row-dashboard">
                    <div class="form-group-dashboard">
                        <label for="email">
                            <i class="fas fa-envelope"></i>
                            Email
                        </label>
                        <input type="email" id="email" name="email" class="form-input-dashboard" required>
                    </div>
                    <div class="form-group-dashboard">
                        <label for="telefono">
                            <i class="fas fa-phone"></i>
                            Teléfono
                        </label>
                        <input type="tel" id="telefono" name="telefono" class="form-input-dashboard">
                    </div>
                </div>
                
                <div class="form-row-dashboard">
                    <div class="form-group-dashboard">
                        <label for="fecha_nacimiento">
                            <i class="fas fa-birthday-cake"></i>
                            Fecha de Nacimiento
                        </label>
                        <input type="date" id="fecha_nacimiento" name="fecha_nacimiento" class="form-input-dashboard">
                    </div>
                    <div class="form-group-dashboard">
                        <label for="genero">
                            <i class="fas fa-venus-mars"></i>
                            Género
                        </label>
                        <select id="genero" name="genero" class="form-input-dashboard">
                            <option value="Masculino">Masculino</option>
                            <option value="Feminino">Femenino</option>
                            <option value="Otro">Otro</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-actions-dashboard">
                    <button type="button" class="btn-cancel-dashboard" onclick="cerrarModal('modalPerfil')">
                        <i class="fas fa-times"></i>
                        Cancelar
                    </button>
                    <button type="submit" class="btn-save-dashboard">
                        <i class="fas fa-save"></i>
                        Guardar Cambios
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Container para notificaciones -->
<div id="notificaciones-container"></div>

<!-- Scripts -->
<script>
    if (window.mostrarModal && typeof window.mostrarModal === 'function') {
        console.log('⚠️ Detectado conflicto con horarios_modal.js - Resolviendo...');
        delete window.mostrarModal; // Eliminar función conflictiva
    }
</script>

<script src="../../Public/js/dashboard-perfil.js"></script>
<script src="../../Public/js/insdepor.js"></script>

<script>
    // Función para redirigir a la página de instalaciones con instalación específica
    function verInstalacionCompleta(instalacionId) {
        window.location.href = `insdepor.php?highlight=${instalacionId}`;
    }

    // ✅ RESTAURAR: Función global para inicializar el mapa (requerida por Google Maps API)
    function initMap() {
        console.log('✅ initMap llamada desde Google Maps API - Dashboard');
        if (window.insDeporManager) {
            window.insDeporManager.initMap();
        } else {
            console.log('⏳ insDeporManager no está disponible aún, esperando...');
            setTimeout(() => {
                if (window.insDeporManager) {
                    window.insDeporManager.initMap();
                } else {
                    console.error('❌ insDeporManager no se pudo cargar');
                    document.getElementById('map').innerHTML = `
                        <div class="loading" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #666;">
                            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 15px; color: #dc3545;"></i>
                            <p>Error cargando el mapa</p>
                            <small>Verifica tu conexión a internet</small>
                        </div>
                    `;
                }
            }, 1000);
        }
    }

    // ✅ RESTAURAR: Función para manejar errores del mapa
    function handleMapError() {
        console.error('❌ Error cargando Google Maps API - Dashboard');
        document.getElementById('map').innerHTML = `
            <div class="loading" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #666;">
                <i class="fas fa-map-marked-alt" style="font-size: 3rem; margin-bottom: 15px; color: #ffc107;"></i>
                <p>Mapa no disponible temporalmente</p>
                <small>Problema con el servicio de mapas</small>
            </div>
        `;
    }

    // ✅ RESTAURAR: Cargar Google Maps API de forma asíncrona
    function loadGoogleMaps() {
        // Verificar si ya está cargado
        if (window.google && window.google.maps) {
            console.log('✅ Google Maps ya estaba cargado');
            initMap();
            return;
        }

        console.log('🔄 Cargando Google Maps API...');
        
        // Crear script para cargar Google Maps
        const script = document.createElement('script');
        script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyBjRa0PWfLEyt1Ba02c-3M6zWnyEM7lU2A&loading=async&callback=initMap';
        script.async = true;
        script.defer = true;
        script.onerror = handleMapError;
        
        // Agregar timeout de seguridad
        setTimeout(() => {
            if (!window.google || !window.google.maps) {
                console.warn('⚠️ Google Maps tardó mucho en cargar, mostrando mensaje alternativo');
                handleMapError();
            }
        }, 10000); // 10 segundos timeout
        
        document.head.appendChild(script);
    }

    // ✅ RESTAURAR: Inicializar cuando el DOM esté listo
    document.addEventListener('DOMContentLoaded', function() {
        console.log('✅ Dashboard inicializado');
        
        const instalacionesData = <?= json_encode($instalaciones) ?>;
        console.log('📍 Instalaciones cargadas:', instalacionesData.length);
        
        // ✅ VERIFICAR ESTRUCTURA DE DATOS
        if (instalacionesData.length > 0) {
            console.log('🔍 Primera instalación (muestra):', instalacionesData[0]);
            console.log('🏃 Deportes de primera instalación:', instalacionesData[0].deportes);
        }
        
        // Crear instancia del manager con configuración para dashboard
        if (typeof InsDeporManager !== 'undefined') {
            try {
                window.insDeporManager = new InsDeporManager(instalacionesData);
                console.log('✅ InsDeporManager creado exitosamente');
            } catch (error) {
                console.error('❌ Error creando InsDeporManager:', error);
                console.log('📊 Datos que causaron el error:', instalacionesData);
            }
        } else {
            console.error('❌ InsDeporManager no está disponible');
        }
        
        // ✅ CARGAR EL MAPA después de un breve retraso
        setTimeout(() => {
            loadGoogleMaps();
        }, 500);
    });

    // ✅ AGREGAR ESTAS FUNCIONES AL FINAL DEL SCRIPT
    // Función para mostrar todas las instalaciones
    async function mostrarTodasInstalaciones() {
        try {
            // Mostrar loading
            document.querySelector('.nearby-facilities').innerHTML = `
                <div class="loading" style="text-align: center; padding: 40px;">
                    <div class="spinner-border"></div>
                    <p>Cargando todas las instalaciones...</p>
                </div>
            `;
            
            // Obtener todas las instalaciones
            const response = await fetch('../../Controllers/InsDeporController.php?action=obtener_todas_instalaciones');
            const data = await response.json();
            
            if (data.success) {
                // Actualizar mapa con todas las instalaciones
                if (window.insDeporManager) {
                    window.insDeporManager.instalaciones = data.instalaciones;
                    window.insDeporManager.facilities = window.insDeporManager.procesarInstalaciones();
                    
                    // Limpiar marcadores existentes
                    window.insDeporManager.markers.forEach(marker => marker.setMap(null));
                    window.insDeporManager.markers = [];
                    
                    // Agregar nuevos marcadores
                    window.insDeporManager.addFacilityMarkers();
                }
                
                // Actualizar lista de instalaciones
                actualizarListaInstalaciones(data.instalaciones);
                
                // Actualizar título
                document.querySelector('.dashboard-wide-card h2').innerHTML = `
                    <i class="fas fa-map-marker-alt"></i> 
                    Todas las Instalaciones Deportivas 
                    <span class="filtro-info">(${data.instalaciones.length} instalaciones encontradas)</span>
                `;
                
                showNotification('✅ Mostrando todas las instalaciones disponibles', 'success');
                
            } else {
                throw new Error(data.message || 'Error obteniendo instalaciones');
            }
            
        } catch (error) {
            console.error('Error:', error);
            showNotification('❌ Error cargando instalaciones: ' + error.message, 'error');
        }
    }

    // Función para actualizar la lista de instalaciones en el DOM
    function actualizarListaInstalaciones(instalaciones) {
        const container = document.querySelector('.nearby-facilities');
        
        if (instalaciones.length === 0) {
            container.innerHTML = `
                <div class="sin-instalaciones-mensaje">
                    <i class="fas fa-info-circle" style="font-size: 3rem; color: #ffc107;"></i>
                    <h3>No hay instalaciones disponibles</h3>
                </div>
            `;
            return;
        }
        
        container.innerHTML = instalaciones.map(instalacion => `
            <div class="facility-item">
                <h3>${instalacion.nombre}</h3>
                <p><i class="fas fa-running"></i> ${instalacion.deportes ? instalacion.deportes.map(d => d.nombre).join(', ') : 'Sin deportes'}</p>
                <p><i class="fas fa-map-marker-alt"></i> ${instalacion.direccion}</p>
                <p><i class="fas fa-star"></i> ${parseFloat(instalacion.calificacion).toFixed(1)} estrellas</p>
                <button class="btn-primary btn-sm" onclick="verInstalacionCompleta(${instalacion.id})">
                    <i class="fas fa-eye"></i> Ver más
                </button>
            </div>
        `).join('');
    }

    // Función para restaurar filtro por deportes favoritos
    async function restaurarFiltroDeportes() {
        try {
            const response = await fetch('../../Controllers/InsDeporController.php?action=obtener_instalaciones_filtradas');
            const data = await response.json();
            
            if (data.success) {
                // Actualizar con instalaciones filtradas
                if (window.insDeporManager) {
                    window.insDeporManager.instalaciones = data.instalaciones;
                    window.insDeporManager.facilities = window.insDeporManager.procesarInstalaciones();
                    
                    // Limpiar y recargar marcadores
                    window.insDeporManager.markers.forEach(marker => marker.setMap(null));
                    window.insDeporManager.markers = [];
                    window.insDeporManager.addFacilityMarkers();
                }
                
                actualizarListaInstalaciones(data.instalaciones);
                showNotification('✅ Filtro por deportes favoritos restaurado', 'success');
            }
            
        } catch (error) {
            console.error('Error:', error);
            showNotification('❌ Error restaurando filtro', 'error');
        }
    }
</script>

<?php

require_once __DIR__ . '/../../Helpers/GameOnBot.php'; // Ajusta la ruta si lo pusiste en otro lado
$secret = 'adg17goyqhl2845es8y6c6n7ezhnjfnx'; // Cambia esto por tu clave secreta de Chatbase
$userId = $_SESSION['user_id'] ?? uniqid('user_');
$bot = new GameOnBot($secret, $userId);
echo $bot->getEmbedScript();

// Incluir pie de página
include_once 'footer.php';
?>
class InsDeporManager {
    constructor(instalacionesData) {
        this.instalaciones = instalacionesData;
        this.map = null;
        this.markers = [];
        this.infoWindow = null;
        this.userMarker = null;
        this.facilities = this.procesarInstalaciones();
        this.mapLoaded = false;
        
        this.init();
    }
    
    init() {
        // Esperar un poco para que el DOM esté completamente cargado
        setTimeout(() => {
            this.configurarEventos();
        }, 100);
    }
    
    procesarInstalaciones() {
        if (!this.instalaciones) return [];
        
        return this.instalaciones.map(instalacion => ({
            position: { 
                lat: parseFloat(instalacion.latitud), 
                lng: parseFloat(instalacion.longitud) 
            },
            name: instalacion.nombre,
            type: instalacion.deportes ? instalacion.deportes.map(d => d.nombre).join(', ') : 'Sin deportes',
            id: instalacion.id,
            tarifa: `S/. ${parseFloat(instalacion.tarifa).toFixed(2)}`,
            calificacion: parseFloat(instalacion.calificacion)
        }));
    }
    
    configurarEventos() {
        // Verificar que los elementos existan antes de agregar eventos
        this.configurarEventosHorarios();
        this.configurarEventosMapa();
        this.configurarEventosFiltros();
        this.configurarEventosModal();
    }
    
    configurarEventosHorarios() {
        const botonesHorarios = document.querySelectorAll('.btn-ver-horarios');
        botonesHorarios.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                this.toggleHorarios(id, e.target);
            });
        });
    }
    
    configurarEventosMapa() {
        const botonesMapa = document.querySelectorAll('.btn-ver-mapa');
        botonesMapa.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const lat = parseFloat(e.target.getAttribute('data-lat'));
                const lng = parseFloat(e.target.getAttribute('data-lng'));
                const nombre = e.target.getAttribute('data-nombre');
                this.centrarMapa(lat, lng, nombre);
            });
        });
    }
    
    configurarEventosFiltros() {
        const btnFiltrar = document.getElementById('btnFiltrar');
        const btnCercanas = document.getElementById('btnCercanas');
        
        if (btnFiltrar) {
            btnFiltrar.addEventListener('click', () => {
                this.aplicarFiltros();
            });
        }
        
        if (btnCercanas) {
            btnCercanas.addEventListener('click', () => {
                this.mostrarInstalacionesCercanas();
            });
        }
    }
    
    configurarEventosModal() {
        // Eventos para cronograma
        document.querySelectorAll('.btn-ver-cronograma').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                this.verCronograma(id);
            });
        });
        
        // Eventos para comentarios
        document.querySelectorAll('.btn-ver-comentarios').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                this.verComentarios(id);
            });
        });
        
        // Eventos para imágenes
        document.querySelectorAll('.btn-ver-imagenes').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                this.verImagenes(id);
            });
        });
        
        // Cerrar modal
        const modalClose = document.getElementById('modal-horarios-close');
        if (modalClose) {
            modalClose.addEventListener('click', () => {
                this.cerrarModal();
            });
        }
        
        // Cerrar modal al hacer clic en el backdrop
        const modalBackdrop = document.querySelector('.modal-horarios-backdrop');
        if (modalBackdrop) {
            modalBackdrop.addEventListener('click', () => {
                this.cerrarModal();
            });
        }
    }
    
    initMap() {
        console.log('Inicializando mapa...');
        
        // Verificar que el elemento del mapa exista
        const mapElement = document.getElementById("map");
        if (!mapElement) {
            console.error('Elemento del mapa no encontrado');
            return;
        }
        
        // Coordenadas predeterminadas (Tacna, Perú)
        const defaultLocation = { lat: -18.0066, lng: -70.2463 };
        
        try {
            // Crear el mapa
            this.map = new google.maps.Map(mapElement, {
                zoom: 14,
                center: defaultLocation,
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                styles: [
                    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] }
                    // ... resto de estilos
                ]
            });
            
            this.infoWindow = new google.maps.InfoWindow();
            this.mapLoaded = true;
            
            console.log('Mapa creado exitosamente');
            
            // Agregar marcadores
            this.addFacilityMarkers();
            
            // Intentar obtener la ubicación del usuario
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const userLocation = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude,
                        };
                        
                        this.map.setCenter(userLocation);
                        this.addUserMarker(userLocation);
                    },
                    (error) => {
                        console.log('Error de geolocalización:', error);
                        this.handleLocationError(true);
                    }
                );
            } else {
                this.handleLocationError(false);
            }
            
        } catch (error) {
            console.error('Error inicializando el mapa:', error);
        }
    }
    
    addUserMarker(location) {
        if (!this.map) return;
        
        this.userMarker = new google.maps.Marker({
            position: location,
            map: this.map,
            title: "Tu ubicación",
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: "#00bcd4",
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 2,
            },
        });
    }
    
    handleLocationError(browserHasGeolocation) {
        if (!this.map || !this.infoWindow) return;
        
        const pos = this.map.getCenter();
        this.infoWindow.setPosition(pos);
        this.infoWindow.setContent(
            browserHasGeolocation
                ? "Error: El servicio de geolocalización falló."
                : "Error: Tu navegador no soporta geolocalización."
        );
        this.infoWindow.open(this.map);
    }
    
    addFacilityMarkers() {
        if (!this.map || !this.facilities) return;
        
        console.log('Agregando marcadores de instalaciones:', this.facilities.length);
        
        this.facilities.forEach((facility) => {
            const marker = new google.maps.Marker({
                position: facility.position,
                map: this.map,
                title: facility.name,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: "#006644",
                    fillOpacity: 1,
                    strokeColor: "#00bcd4",
                    strokeWeight: 2,
                }
            });
            
            this.markers.push(marker);
            
            // ✅ ENCONTRAR LA INSTALACIÓN COMPLETA CON IMAGEN
            const instalacionCompleta = this.instalaciones.find(inst => inst.id === facility.id);
            const imagenUrl = instalacionCompleta?.imagen || '../../Resources/default_instalacion.jpg';
            
            marker.addListener("click", () => {
                // ✅ INFO WINDOW CON DISEÑO OSCURO Y SIN BOTÓN VER DETALLES
                const infoContent = `
                    <div class="info-window-custom">
                        <div class="info-header">
                            <img src="${imagenUrl}" alt="${facility.name}" class="info-image" 
                                 onerror="this.src='../../Resources/default_instalacion.jpg'">
                        </div>
                        <div class="info-body">
                            <h3 class="info-title">${facility.name}</h3>
                            <div class="info-details">
                                <p class="info-sport">
                                    <i class="fas fa-running"></i>
                                    ${facility.type}
                                </p>
                                <p class="info-price">
                                    <i class="fas fa-money-bill-wave"></i>
                                    Tarifa: ${facility.tarifa}
                                </p>
                                <p class="info-rating">
                                    <i class="fas fa-star"></i>
                                    ${facility.calificacion.toFixed(1)} estrellas
                                </p>
                            </div>
                        </div>
                    </div>
                `;
                
                this.infoWindow.setContent(infoContent);
                this.infoWindow.open(this.map, marker);
            });
        });
    }
    
    toggleHorarios(id, button) {
        const horariosContainer = document.getElementById(`horarios-${id}`);
        if (horariosContainer) {
            if (horariosContainer.style.display === 'none' || !horariosContainer.style.display) {
                horariosContainer.style.display = 'block';
                button.textContent = 'Ocultar horarios';
            } else {
                horariosContainer.style.display = 'none';
                button.textContent = 'Ver horarios';
            }
        }
    }
    
    centrarMapa(lat, lng, nombre) {
        if (!this.map) {
            console.log('Mapa no está inicializado');
            return;
        }
        
        const position = { lat, lng };
        this.map.setCenter(position);
        this.map.setZoom(16);
        
        // Abrir info window en el marcador correspondiente
        for (let i = 0; i < this.markers.length; i++) {
            if (this.markers[i].getTitle() === nombre) {
                google.maps.event.trigger(this.markers[i], 'click');
                break;
            }
        }
    }
    
    aplicarFiltros() {
        const nombreBusqueda = document.getElementById('busquedaNombre')?.value.toLowerCase() || '';
        const deporteSeleccionado = document.getElementById('filtroDeporte')?.value || '';
        const calificacionMinima = parseFloat(document.getElementById('filtroCalificacion')?.value) || 0;
        
        document.querySelectorAll('.instalacion-card').forEach(card => {
            const nombre = card.querySelector('.card-title')?.textContent.toLowerCase() || '';
            const deportes = card.getAttribute('data-deportes')?.split(',') || [];
            const calificacion = parseFloat(card.getAttribute('data-calificacion')) || 0;
            
            let mostrar = true;
            
            // Filtrar por nombre
            if (nombreBusqueda && !nombre.includes(nombreBusqueda)) {
                mostrar = false;
            }
            
            // Filtrar por deporte
            if (deporteSeleccionado && !deportes.includes(deporteSeleccionado)) {
                mostrar = false;
            }
            
            // Filtrar por calificación
            if (calificacion < calificacionMinima) {
                mostrar = false;
            }
            
            card.style.display = mostrar ? 'block' : 'none';
        });
    }
    
    mostrarInstalacionesCercanas() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.ordenarPorDistancia(position.coords.latitude, position.coords.longitude);
                },
                () => {
                    alert('No se pudo acceder a tu ubicación. Permite el acceso a la ubicación para usar esta función.');
                }
            );
        } else {
            alert('Tu navegador no soporta geolocalización.');
        }
    }
    
    ordenarPorDistancia(userLat, userLng) {
        const instalacionesConDistancia = [];
        
        document.querySelectorAll('.instalacion-card').forEach(card => {
            const btn = card.querySelector('.btn-ver-mapa');
            if (btn) {
                const lat = parseFloat(btn.getAttribute('data-lat'));
                const lng = parseFloat(btn.getAttribute('data-lng'));
                
                const distance = this.calcularDistancia(userLat, userLng, lat, lng);
                
                instalacionesConDistancia.push({
                    element: card,
                    distance: distance
                });
            }
        });
        
        // Ordenar por distancia
        instalacionesConDistancia.sort((a, b) => a.distance - b.distance);
        
        // Reorganizar elementos en el DOM
        const container = document.getElementById('listaInstalaciones');
        if (container) {
            instalacionesConDistancia.forEach(item => {
                container.appendChild(item.element);
            });
        }
        
        alert('Instalaciones ordenadas por cercanía a tu ubicación actual.');
    }
    
    calcularDistancia(lat1, lng1, lat2, lng2) {
        const R = 6371; // Radio de la Tierra en km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
                Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
    
    verCronograma(id) {
        // Mostrar loading
        this.mostrarModal('Áreas Deportivas', '<div class="loading"><i class="fas fa-futbol"></i> Cargando áreas deportivas...</div>');

        // Obtener deportes para filtro
        fetch(`../../Controllers/AreasDeportivasController.php?action=obtener_areas_institucion&sede_id=${id}`)
            .then(res => res.json())
            .then(data => {
                if (!data.success) {
                    this.mostrarModal('Áreas Deportivas', '<div class="text-danger">No se pudieron cargar las áreas deportivas.</div>');
                    return;
                }
                const areas = data.areas;
                if (!areas.length) {
                    this.mostrarModal('Áreas Deportivas', '<div class="text-warning">No hay áreas deportivas registradas.</div>');
                    return;
                }

                // Obtener deportes únicos para filtro
                const deportesUnicos = [];
                areas.forEach(a => {
                    if (!deportesUnicos.find(d => d.id == a.deporte_id)) {
                        deportesUnicos.push({ id: a.deporte_id, nombre: a.deporte_nombre });
                    }
                });

                // Renderizar filtro y galería
                let html = `
                    <div style="margin-bottom:16px;">
                        <label for="filtro-area-deporte"><i class="fas fa-filter"></i> Filtrar por deporte:</label>
                        <select id="filtro-area-deporte" style="margin-left:8px; padding:4px 8px; border-radius:6px;">
                            <option value="">Todos</option>
                            ${deportesUnicos.map(d => `<option value="${d.id}">${d.nombre}</option>`).join('')}
                        </select>
                    </div>
                    <div id="galeria-areas" style="display:flex; flex-wrap:wrap; gap:18px; justify-content:center;">
                        ${areas.map(area => renderAreaCard(area)).join('')}
                    </div>
                `;
                this.mostrarModal('Áreas Deportivas', html);

                // Filtro por deporte
                document.getElementById('filtro-area-deporte').addEventListener('change', function() {
                    const val = this.value;
                    const cards = document.querySelectorAll('.area-card');
                    cards.forEach(card => {
                        if (!val || card.getAttribute('data-deporte') == val) {
                            card.style.display = '';
                        } else {
                            card.style.display = 'none';
                        }
                    });
                });

                setTimeout(() => {
                    document.querySelectorAll('.btn-reservar-area').forEach(btn => {
                        btn.addEventListener('click', function() {
                            const areaId = this.getAttribute('data-area-id');
                            const areaNombre = this.getAttribute('data-area-nombre');
                            window.location.href = `reservar_area.php?area_id=${areaId}&area_nombre=${areaNombre}`;
                        });
                    });
                }, 100);
            });

        // Función para renderizar cada área
        function renderAreaCard(area) {
            const img = area.imagen_area ? area.imagen_area : '../../Resources/default_area.jpg';
            return `
            <div class="area-card" data-deporte="${area.deporte_id}" style="background:#23272b; border-radius:12px; box-shadow:0 2px 8px #0004; width:320px; overflow:hidden; display:flex; flex-direction:column;">
                <div style="height:160px; background:#111;">
                    <img src="${img}" alt="${area.nombre_area}" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='../../Resources/default_area.jpg'">
                </div>
                <div style="padding:14px 16px; flex:1; display:flex; flex-direction:column; gap:6px;">
                    <h4 style="margin:0; color:#00bcd4; font-size:18px;">${area.nombre_area}</h4>
                    <div style="font-size:13px; color:#b0b0b0;"><i class="fas fa-running"></i> ${area.deporte_nombre}</div>
                    <div style="font-size:13px; color:#b0b0b0;"><i class="fas fa-users"></i> Capacidad: ${area.capacidad_jugadores ?? '-'}</div>
                    <div style="font-size:13px; color:#b0b0b0;"><i class="fas fa-money-bill-wave"></i> Tarifa: S/. ${parseFloat(area.tarifa_por_hora).toFixed(2)}</div>
                    <div style="font-size:13px; color:#b0b0b0;"><i class="fas fa-info-circle"></i> Estado: <span style="color:${area.estado=='activa'?'#25D366':'#ffc107'}">${area.estado}</span></div>
                    <div style="font-size:13px; color:#b0b0b0;"><i class="fas fa-align-left"></i> ${area.descripcion ?? ''}</div>
                    <button class="btn btn-primary btn-reservar-area" 
    data-area-id="${area.id}" 
    data-area-nombre="${encodeURIComponent(area.nombre_area)}"
    style="margin-top:10px;">
    <i class="fas fa-calendar-plus"></i> ¡RESERVAR AHORA!
</button>
                </div>
            </div>
            `;
        }
    }
    
    verComentarios(id) {
        console.log('Ver comentarios de instalación:', id);
        this.mostrarModal('Comentarios', 'Cargando comentarios...');
    }
    
    verImagenes(id) {
        console.log('Ver imágenes de instalación:', id);
        this.mostrarModal('Imágenes', 'Cargando imágenes...');
    }
    
    mostrarModal(titulo, contenido) {
        const modal = document.getElementById('modal-horarios');
        const modalTitulo = document.querySelector('.modal-horarios-title');
        const modalContenido = document.querySelector('.modal-horarios-content');
        
        if (modal && modalTitulo && modalContenido) {
            modalTitulo.textContent = titulo;
            modalContenido.innerHTML = contenido;
            modal.style.display = 'block';
        }
    }
    
    cerrarModal() {
        const modal = document.getElementById('modal-horarios');
        if (modal) {
            modal.style.display = 'none';
        }
    }
}

// Función global para inicializar el mapa (requerida por Google Maps API)
function initMap() {
    console.log('initMap llamada desde Google Maps API');
    if (window.insDeporManager) {
        window.insDeporManager.initMap();
    } else {
        console.log('insDeporManager no está disponible aún');
        // Intentar de nuevo en 100ms
        setTimeout(() => {
            if (window.insDeporManager) {
                window.insDeporManager.initMap();
            }
        }, 100);
    }
}

// ✅ FUNCIÓN PARA MANEJAR CLIC EN BOTONES DE ACCIÓN
document.addEventListener('DOMContentLoaded', function() {
    // ✅ AGREGAR EVENT LISTENERS PARA BOTONES DE ACCIÓN
    document.addEventListener('click', function(e) {
        // Botón de horarios
        if (e.target.closest('.btn-horarios')) {
            const btn = e.target.closest('.btn-horarios');
            const instalacionId = btn.getAttribute('data-id');
            toggleHorarios(instalacionId);
        }
        
        // Botón de cronograma
        if (e.target.closest('.btn-cronograma')) {
            const btn = e.target.closest('.btn-cronograma');
            const instalacionId = btn.getAttribute('data-id');
            if (window.insDeporManager) {
                window.insDeporManager.verCronograma(instalacionId);
            }
        }
        
        // Botón de mapa
        if (e.target.closest('.btn-mapa')) {
            const btn = e.target.closest('.btn-mapa');
            const lat = parseFloat(btn.getAttribute('data-lat'));
            const lng = parseFloat(btn.getAttribute('data-lng'));
            const nombre = btn.getAttribute('data-nombre');
            centrarMapaEnInstalacion(lat, lng, nombre);
        }
        
        // Botón de comentarios
        if (e.target.closest('.btn-comentarios')) {
            const btn = e.target.closest('.btn-comentarios');
            const instalacionId = btn.getAttribute('data-id');
            mostrarComentarios(instalacionId);
        }
        
        // Botón de imágenes
        if (e.target.closest('.btn-imagenes')) {
            const btn = e.target.closest('.btn-imagenes');
            const instalacionId = btn.getAttribute('data-id');
            mostrarGaleria(instalacionId);
        }
        
        // Botón de reservar
        if (e.target.closest('.btn-reservar')) {
            const btn = e.target.closest('.btn-reservar');
            const instalacionId = btn.getAttribute('data-id');
            iniciarReserva(instalacionId);
        }
    });
});

// ✅ FUNCIÓN PARA MOSTRAR/OCULTAR HORARIOS
function toggleHorarios(instalacionId) {
    const horariosDiv = document.getElementById(`horarios-${instalacionId}`);
    const btn = document.querySelector(`[data-id="${instalacionId}"].btn-horarios`);
    
    if (horariosDiv.style.display === 'none' || horariosDiv.style.display === '') {
        horariosDiv.style.display = 'block';
        btn.innerHTML = '<i class="fas fa-clock"></i> Ocultar';
        btn.style.background = 'linear-gradient(135deg, #dc3545, #c82333)';
    } else {
        horariosDiv.style.display = 'none';
        btn.innerHTML = '<i class="fas fa-clock"></i> Horarios';
        btn.style.background = 'linear-gradient(135deg, var(--info-color), #138496)';
    }
}

// ✅ FUNCIÓN PARA CENTRAR MAPA EN INSTALACIÓN
function centrarMapaEnInstalacion(lat, lng, nombre) {
    if (window.insDeporManager && window.insDeporManager.map) {
        const position = new google.maps.LatLng(lat, lng);
        window.insDeporManager.map.setCenter(position);
        window.insDeporManager.map.setZoom(17);
        
        // Scroll al mapa
        document.getElementById('map').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
        
        // Mostrar notificación
        mostrarNotificacion(`📍 Mostrando ubicación de ${nombre}`, 'success');
    } else {
        mostrarNotificacion('⚠️ El mapa no está disponible', 'warning');
    }
}

// ✅ FUNCIÓN PARA INICIAR RESERVA
function iniciarReserva(instalacionId) {
    mostrarNotificacion('🚀 Redirigiendo a reservas...', 'info');
    setTimeout(() => {
        window.location.href = `reservas.php?instalacion=${instalacionId}`;
    }, 1000);
}

// ✅ FUNCIÓN PARA MOSTRAR NOTIFICACIONES
function mostrarNotificacion(mensaje, tipo = 'info') {
    // Crear contenedor si no existe
    let container = document.getElementById('notificaciones-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notificaciones-container';
        container.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            z-index: 1002;
            pointer-events: none;
        `;
        document.body.appendChild(container);
    }
    
    const colores = {
        'success': { bg: '#28a745', icon: 'check-circle' },
        'error': { bg: '#dc3545', icon: 'exclamation-circle' },
        'warning': { bg: '#ffc107', icon: 'exclamation-triangle' },
        'info': { bg: '#17a2b8', icon: 'info-circle' }
    };
    
    const config = colores[tipo] || colores['info'];
    
    const notificacion = document.createElement('div');
    notificacion.style.cssText = `
        background: ${config.bg};
        color: white;
        padding: 12px 18px;
        border-radius: 8px;
        margin-bottom: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideInRight 0.3s ease;
        pointer-events: all;
        font-size: 14px;
        font-weight: 500;
        max-width: 300px;
    `;
    
    notificacion.innerHTML = `
        <i class="fas fa-${config.icon}"></i>
        <span>${mensaje}</span>
    `;
    
    container.appendChild(notificacion);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        if (notificacion.parentNode) {
            notificacion.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notificacion.parentNode) {
                    notificacion.remove();
                }
            }, 300);
        }
    }, 3000);
}

// ✅ AGREGAR ANIMACIONES CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);
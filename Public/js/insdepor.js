class InsDeporManager {
    constructor(instalacionesData) {
        this.instalaciones = instalacionesData;
        this.map = null;
        this.markers = [];
        this.infoWindow = null;
        this.userMarker = null;
        this.facilities = this.procesarInstalaciones();
        this.mapLoaded = false;
        this.currentDirectionsRenderer = null;
        this.rutaInfoWindow = null;
        
        this.init();
    }
    
    init() {
        // Esperar un poco para que el DOM esté completamente cargado
        setTimeout(() => {
            this.configurarEventos();
        }, 100);
    }
    
    // ✅ MEJORAR FUNCIÓN procesarInstalaciones con validación
    procesarInstalaciones() {
        if (!this.instalaciones || !Array.isArray(this.instalaciones)) {
            console.warn('⚠️ No hay instalaciones válidas para procesar');
            return [];
        }
        
        return this.instalaciones.map(instalacion => {
            // ✅ VALIDAR QUE DEPORTES SEA UN ARRAY
            let deportesTexto = 'Sin deportes';
            
            if (instalacion.deportes && Array.isArray(instalacion.deportes) && instalacion.deportes.length > 0) {
                deportesTexto = instalacion.deportes.map(d => d.nombre).join(', ');
            } else {
                console.warn(`⚠️ Instalación ${instalacion.nombre} sin deportes válidos:`, instalacion.deportes);
            }
            
            return {
                position: { 
                    lat: parseFloat(instalacion.latitud), 
                    lng: parseFloat(instalacion.longitud) 
                },
                name: instalacion.nombre,
                type: deportesTexto,
                id: instalacion.id,
                tarifa: `S/. ${parseFloat(instalacion.tarifa || 0).toFixed(2)}`,
                calificacion: parseFloat(instalacion.calificacion || 0)
            };
        });
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
        const mapElement = document.getElementById("map");
        if (!mapElement) {
            console.error('Elemento del mapa no encontrado');
            return;
        }
        
        // Coordenadas predeterminadas (Tacna, Perú)
        const defaultLocation = { lat: -18.005618, lng: -70.225320 };
        
        try {
            // ✅ CREAR EL MAPA CON ESTILOS MEJORADOS
            this.map = new google.maps.Map(mapElement, {
                zoom: 14,
                center: defaultLocation,
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                // ✅ ESTILOS OSCUROS PERO CON CALLES VISIBLES
                styles: [
                    {
                        "elementType": "geometry",
                        "stylers": [{"color": "#212121"}]
                    },
                    {
                        "elementType": "labels.icon",
                        "stylers": [{"visibility": "off"}]
                    },
                    {
                        "elementType": "labels.text.fill",
                        "stylers": [{"color": "#757575"}]
                    },
                    {
                        "elementType": "labels.text.stroke",
                        "stylers": [{"color": "#212121"}]
                    },
                    {
                        "featureType": "administrative",
                        "elementType": "geometry",
                        "stylers": [{"color": "#757575"}]
                    },
                    {
                        "featureType": "administrative.country",
                        "elementType": "labels.text.fill",
                        "stylers": [{"color": "#9e9e9e"}]
                    },
                    {
                        "featureType": "administrative.land_parcel",
                        "stylers": [{"visibility": "off"}]
                    },
                    {
                        "featureType": "administrative.locality",
                        "elementType": "labels.text.fill",
                        "stylers": [{"color": "#bdbdbd"}]
                    },
                    {
                        "featureType": "poi",
                        "elementType": "labels.text.fill",
                        "stylers": [{"color": "#757575"}]
                    },
                    {
                        "featureType": "poi.park",
                        "elementType": "geometry",
                        "stylers": [{"color": "#181818"}]
                    },
                    {
                        "featureType": "poi.park",
                        "elementType": "labels.text.fill",
                        "stylers": [{"color": "#616161"}]
                    },
                    {
                        "featureType": "poi.park",
                        "elementType": "labels.text.stroke",
                        "stylers": [{"color": "#1b1b1b"}]
                    },
                    {
                        "featureType": "road",
                        "elementType": "geometry.fill",
                        "stylers": [{"color": "#2c2c2c"}]
                    },
                    {
                        "featureType": "road",
                        "elementType": "labels.text.fill",
                        "stylers": [{"color": "#8a8a8a"}]
                    },
                    {
                        "featureType": "road.arterial",
                        "elementType": "geometry",
                        "stylers": [{"color": "#373737"}]
                    },
                    {
                        "featureType": "road.highway",
                        "elementType": "geometry",
                        "stylers": [{"color": "#3c3c3c"}]
                    },
                    {
                        "featureType": "road.highway.controlled_access",
                        "elementType": "geometry",
                        "stylers": [{"color": "#4e4e4e"}]
                    },
                    {
                        "featureType": "road.local",
                        "elementType": "labels.text.fill",
                        "stylers": [{"color": "#616161"}]
                    },
                    {
                        "featureType": "transit",
                        "elementType": "labels.text.fill",
                        "stylers": [{"color": "#757575"}]
                    },
                    {
                        "featureType": "water",
                        "elementType": "geometry",
                        "stylers": [{"color": "#000000"}]
                    },
                    {
                        "featureType": "water",
                        "elementType": "labels.text.fill",
                        "stylers": [{"color": "#3d3d3d"}]
                    }
                ],
                // ✅ OPCIONES ADICIONALES
                mapTypeControl: true,
                mapTypeControlOptions: {
                    style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
                    position: google.maps.ControlPosition.TOP_CENTER,
                },
                zoomControl: true,
                zoomControlOptions: {
                    position: google.maps.ControlPosition.RIGHT_CENTER,
                },
                scaleControl: true,
                streetViewControl: true,
                streetViewControlOptions: {
                    position: google.maps.ControlPosition.RIGHT_TOP,
                },
                fullscreenControl: true,
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
            map: this.map,
            position: location,
            title: "Tu ubicación",
            icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="8" fill="#00bcd4" stroke="#fff" stroke-width="2"/>
                        <circle cx="12" cy="12" r="3" fill="#fff"/>
                    </svg>
                `),
                scaledSize: new google.maps.Size(24, 24),
                anchor: new google.maps.Point(12, 12)
            },
            animation: google.maps.Animation.BOUNCE
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
                map: this.map,
                position: facility.position,
                title: facility.name,
                icon: {
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                        <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="16" cy="16" r="12" fill="#006644" stroke="#fff" stroke-width="2"/>
                            <text x="16" y="20" text-anchor="middle" fill="white" font-size="12">🏟️</text>
                        </svg>
                    `),
                    scaledSize: new google.maps.Size(32, 32),
                    anchor: new google.maps.Point(16, 16)
                },
                animation: google.maps.Animation.DROP
            });
            
            this.markers.push(marker);
            
            const instalacionCompleta = this.instalaciones.find(inst => inst.id === facility.id);
            
            marker.addListener('click', () => {
                this.mostrarInfoWindow(marker, facility, instalacionCompleta);
            });
            
            marker.addListener('mouseover', () => {
                marker.setAnimation(google.maps.Animation.BOUNCE);
            });
            
            marker.addListener('mouseout', () => {
                marker.setAnimation(null);
            });
        });
        
        console.log('✅ Marcadores agregados:', this.markers.length);
    }
    
    mostrarInfoWindow(marker, facility, instalacionCompleta) {
        const imagenUrl = instalacionCompleta?.imagen || '../../Resources/default_instalacion.jpg';
        
        const infoContent = `
            <div class="info-window-custom">
                <div class="info-header">
                    <img src="${imagenUrl}" 
                         alt="${facility.name}" 
                         class="info-image"
                         loading="lazy"
                         onerror="this.parentElement.innerHTML='<div class=\\'info-image-placeholder\\'><i class=\\'fas fa-building\\'></i><span>Sin imagen</span></div>'">
                </div>
                <div class="info-body">
                    <h3 class="info-title">${facility.name}</h3>
                    <div class="info-details">
                        <div class="info-sport">
                            <i class="fas fa-running"></i>
                            <span>${facility.type}</span>
                        </div>
                        <div class="info-price">
                            <i class="fas fa-money-bill-wave"></i>
                            <span>Desde ${facility.tarifa}/hora</span>
                        </div>
                        <div class="info-rating">
                            <i class="fas fa-star"></i>
                            <span>${facility.calificacion.toFixed(1)} estrellas</span>
                        </div>
                    </div>
                </div>
                <div class="info-actions">
                    <button class="info-btn info-btn-primary" onclick="verDetallesDesdeMap(${facility.id})">
                        <i class="fas fa-info-circle"></i>
                        Ver detalles completos
                    </button>
                    
                    <!-- ✅ NUEVO BOTÓN DE RECORRIDO -->
                    <button class="info-btn info-btn-route" onclick="window.insDeporManager.iniciarRecorridoCaminando(${facility.position.lat}, ${facility.position.lng}, '${facility.name}')">
                        <i class="fas fa-route"></i>
                        Iniciar recorrido a pie
                    </button>
                </div>
            </div>
        `;
        
        if (!this.infoWindow) {
            this.infoWindow = new google.maps.InfoWindow({
                pixelOffset: new google.maps.Size(0, -10)
            });
        }
        
        this.infoWindow.setContent(infoContent);
        this.infoWindow.open(this.map, marker);
        this.map.panTo(marker.position);
        
        if (this.map.getZoom() < 15) {
            this.map.setZoom(15);
        }
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
    
    // ✅ MEJORAR FUNCIÓN centrarMapa
    centrarMapa(lat, lng, nombre) {
        if (!this.map) {
            console.log('Mapa no está inicializado');
            return;
        }
        
        const position = { lat, lng };
        
        // ✅ ANIMACIÓN SUAVE AL CENTRAR
        this.map.panTo(position);
        
        setTimeout(() => {
            this.map.setZoom(16);
            
            // ✅ ENCONTRAR Y ACTIVAR EL MARCADOR CORRESPONDIENTE
            const marker = this.markers.find(m => {
                const markerPos = m.getPosition();
                return Math.abs(markerPos.lat() - lat) < 0.001 && 
                       Math.abs(markerPos.lng() - lng) < 0.001;
            });
            
            if (marker) {
                // ✅ EFECTO DE "REBOTE" EN EL MARCADOR
                marker.setAnimation(google.maps.Animation.BOUNCE);
                setTimeout(() => {
                    marker.setAnimation(null);
                    // ✅ ABRIR INFO WINDOW DESPUÉS DEL REBOTE
                    google.maps.event.trigger(marker, 'click');
                }, 1500);
            }
        }, 800);
    }
    
    mostrarOpcionesRuta(instalacionId, instalacionNombre, lat, lng) {
        const opciones = [
            {
                texto: '🚗 Ruta en auto',
                action: 'driving',
                icono: '🚗',
                descripcion: 'La ruta más rápida en vehículo'
            },
            {
                texto: '🚶 Ruta caminando',
                action: 'walking',
                icono: '🚶',
                descripcion: 'Perfecta para ejercitarse'
            }
        ];
        
        const contenido = `
            <div class="rutas-container">
                <div class="destino-info">
                    <h4><i class="fas fa-map-marker-alt"></i> ${instalacionNombre}</h4>
                    <p class="coords">📍 ${lat.toFixed(6)}, ${lng.toFixed(6)}</p>
                </div>
                
                <div class="opciones-ruta">
                    ${opciones.map(opcion => `
                        <button class="ruta-option-btn" 
                                data-action="${opcion.action}"
                                data-lat="${lat}"
                                data-lng="${lng}"
                                data-instalacion="${instalacionId}"
                                data-nombre="${instalacionNombre}">
                            <span class="ruta-icon">${opcion.icono}</span>
                            <div class="ruta-info">
                                <span class="ruta-text">${opcion.texto}</span>
                                <small class="ruta-desc">${opcion.descripcion}</small>
                            </div>
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    `).join('')}
                </div>
                
                <div class="acciones-ruta">
                    <button class="btn-ubicacion-actual" onclick="window.insDeporManager.obtenerUbicacionUsuario(${lat}, ${lng}, '${instalacionNombre}')">
                        <i class="fas fa-crosshairs"></i>
                        Usar mi ubicación actual
                    </button>
                    
                    <button class="btn-abrir-google-maps" onclick="window.insDeporManager.abrirEnGoogleMaps(${lat}, ${lng}, '${instalacionNombre}')">
                        <i class="fab fa-google"></i>
                        Abrir en Google Maps
                    </button>
                </div>
                
                <div id="ruta-resultado" style="display: none;">
                    <div class="ruta-info-detallada">
                    </div>
                </div>
            </div>
        `;
        
        this.mostrarModal('🗺️ Cómo llegar', contenido);
        
        setTimeout(() => {
            document.querySelectorAll('.ruta-option-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const action = e.currentTarget.getAttribute('data-action');
                    const lat = parseFloat(e.currentTarget.getAttribute('data-lat'));
                    const lng = parseFloat(e.currentTarget.getAttribute('data-lng'));
                    const instalacionId = e.currentTarget.getAttribute('data-instalacion');
                    const nombre = e.currentTarget.getAttribute('data-nombre');
                    
                    this.calcularRutaConGoogleMaps(action, lat, lng, nombre);
                });
            });
        }, 100);
    }

    async calcularRutaConGoogleMaps(travelMode, destLat, destLng, nombreDestino) {
        try {
            const resultadoDiv = document.getElementById('ruta-resultado');
            resultadoDiv.style.display = 'block';
            resultadoDiv.innerHTML = `
                <div class="calculando-ruta">
                    <div class="ruta-loading">
                        <i class="fas fa-route"></i>
                        <p>Calculando la mejor ruta...</p>
                        <div class="loading-bar">
                            <div class="loading-progress"></div>
                        </div>
                    </div>
                </div>
            `;
            
            if (!navigator.geolocation) {
                throw new Error('Geolocalización no disponible');
            }
            
            const position = await this.obtenerPosicionActual();
            const origen = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
            const destino = new google.maps.LatLng(destLat, destLng);
            
            const directionsService = new google.maps.DirectionsService();
            const directionsRenderer = new google.maps.DirectionsRenderer({
                suppressMarkers: false,
                suppressInfoWindows: true,
                polylineOptions: {
                    strokeColor: '#00bcd4',
                    strokeWeight: 4,
                    strokeOpacity: 0.8
                }
            });
            
            const request = {
                origin: origen,
                destination: destino,
                travelMode: google.maps.TravelMode[travelMode.toUpperCase()],
                unitSystem: google.maps.UnitSystem.METRIC,
                avoidHighways: false,
                avoidTolls: false
            };
            
            if (travelMode === 'transit') {
                request.transitOptions = {
                    modes: [
                        google.maps.TransitMode.BUS,
                        google.maps.TransitMode.RAIL
                    ],
                    routingPreference: google.maps.TransitRoutePreference.FEWER_TRANSFERS
                };
            }
            
            directionsService.route(request, (result, status) => {
                if (status === 'OK') {
                    this.mostrarResultadoRuta(result, travelMode, nombreDestino);
                    
                    if (this.map) {
                        directionsRenderer.setMap(this.map);
                        directionsRenderer.setDirections(result);
                        this.map.fitBounds(result.routes[0].bounds);
                    }
                } else {
                    this.mostrarErrorRuta(status, travelMode, destLat, destLng, nombreDestino);
                }
            });
            
        } catch (error) {
            console.error('Error calculando ruta:', error);
            this.mostrarErrorRuta(error.message, travelMode, destLat, destLng, nombreDestino);
        }
    }

    obtenerPosicionActual() {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                resolve,
                reject,
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000
                }
            );
        });
    }

    mostrarResultadoRuta(directionsResult, travelMode, nombreDestino) {
        const route = directionsResult.routes[0];
        const leg = route.legs[0];
        
        const iconos = {
            'driving': '🚗',
            'walking': '🚶'
        };
        
        const modos = {
            'driving': 'En auto',
            'walking': 'Caminando'
        };
        
        let contenidoRuta = `
            <div class="ruta-exitosa">
                <div class="ruta-header">
                    <h4>${iconos[travelMode]} ${modos[travelMode]} a ${nombreDestino}</h4>
                    <div class="ruta-resumen">
                        <div class="ruta-stat">
                            <i class="fas fa-route"></i>
                            <span><strong>${leg.distance.text}</strong></span>
                            <small>Distancia</small>
                        </div>
                        <div class="ruta-stat">
                            <i class="fas fa-clock"></i>
                            <span><strong>${leg.duration.text}</strong></span>
                            <small>Tiempo estimado</small>
                        </div>
                    </div>
                </div>
                
                <div class="ruta-detalles">
                    <h5><i class="fas fa-list"></i> Instrucciones paso a paso:</h5>
                    <div class="instrucciones-lista">
        `;
        
        leg.steps.forEach((step, index) => {
            const instruccion = step.instructions.replace(/<[^>]*>/g, '');
            let icono = '📍';
            
            if (instruccion.includes('left') || instruccion.includes('izquierda')) icono = '↪️';
            else if (instruccion.includes('right') || instruccion.includes('derecha')) icono = '↩️';
            else if (instruccion.includes('straight') || instruccion.includes('recto')) icono = '⬆️';
            else if (instruccion.includes('bus') || instruccion.includes('Bus')) icono = '🚌';
            
            contenidoRuta += `
                <div class="instruccion-paso">
                    <div class="paso-numero">${index + 1}</div>
                    <div class="paso-info">
                        <div class="paso-instruccion">
                            ${icono} ${instruccion}
                        </div>
                        <div class="paso-distancia">
                            <small>${step.distance.text} • ${step.duration.text}</small>
                        </div>
                    </div>
                </div>
            `;
        });
        
        if (travelMode === 'transit' && leg.steps.some(step => step.transit)) {
            contenidoRuta += `
                <div class="transporte-info">
                    <h6><i class="fas fa-bus"></i> Información de transporte:</h6>
            `;
            
            leg.steps.forEach(step => {
                if (step.transit) {
                    const transit = step.transit;
                    contenidoRuta += `
                        <div class="transporte-detalle">
                            <strong>${transit.line.name || 'Línea de transporte'}</strong>
                            <div class="paradas-info">
                                <span>Subir en: ${transit.departure_stop.name}</span>
                                <span>Bajar en: ${transit.arrival_stop.name}</span>
                                <span>Paradas: ${transit.num_stops}</span>
                            </div>
                        </div>
                    `;
                }
            });
            
            contenidoRuta += '</div>';
        }
        
        contenidoRuta += `
                    </div>
                </div>
                
                <div class="ruta-acciones">
                    <button class="btn-iniciar-navegacion" onclick="window.insDeporManager.iniciarNavegacion('${leg.start_location.lat()}', '${leg.start_location.lng()}', '${leg.end_location.lat()}', '${leg.end_location.lng()}', '${travelMode}')">
                        <i class="fas fa-navigation"></i>
                        Iniciar navegación
                    </button>
                    
                    <button class="btn-compartir-ruta" onclick="window.insDeporManager.compartirRuta('${nombreDestino}', '${leg.distance.text}', '${leg.duration.text}', '${modos[travelMode]}')">
                        <i class="fas fa-share"></i>
                        Compartir ruta
                    </button>
                </div>
            </div>
        `;
        
        document.getElementById('ruta-resultado').innerHTML = contenidoRuta;
    }

    mostrarErrorRuta(status, travelMode, destLat, destLng, nombreDestino) {
        let mensaje = 'No se pudo calcular la ruta';
        let solucion = '';
        
        switch (status) {
            case 'ZERO_RESULTS':
                mensaje = 'No se encontró una ruta disponible';
                solucion = 'Intenta con otro modo de transporte o verifica la ubicación.';
                break;
            case 'OVER_QUERY_LIMIT':
                mensaje = 'Límite de consultas excedido';
                solucion = 'Intenta nuevamente en unos minutos.';
                break;
            case 'REQUEST_DENIED':
                mensaje = 'Solicitud denegada';
                solucion = 'Verifica los permisos de ubicación.';
                break;
            case 'INVALID_REQUEST':
                mensaje = 'Solicitud inválida';
                solucion = 'Verifica las coordenadas de destino.';
                break;
            default:
                solucion = 'Intenta nuevamente o usa Google Maps directamente.';
        }
        
        const contenidoError = `
            <div class="ruta-error">
                <div class="error-icon">❌</div>
                <h4>${mensaje}</h4>
                <p>${solucion}</p>
                
                <div class="alternativas-error">
                    <button class="btn-google-maps-fallback" onclick="window.insDeporManager.abrirEnGoogleMaps(${destLat}, ${destLng}, '${nombreDestino}')">
                        <i class="fab fa-google"></i>
                        Abrir en Google Maps
                    </button>
                    
                    <button class="btn-reintentar" onclick="window.insDeporManager.calcularRutaConGoogleMaps('${travelMode}', ${destLat}, ${destLng}, '${nombreDestino}')">
                        <i class="fas fa-redo"></i>
                        Reintentar
                    </button>
                </div>
            </div>
        `;
        
        document.getElementById('ruta-resultado').innerHTML = contenidoError;
    }

    iniciarNavegacion(origenLat, origenLng, destinoLat, destinoLng, modo) {
        const modoGoogle = this.getModoGoogleMaps(modo);
        const url = `https://www.google.com/maps/dir/${origenLat},${origenLng}/${destinoLat},${destinoLng}/@${destinoLat},${destinoLng},15z/data=!3m1!4b1!4m2!4m1!3e${modoGoogle}`;
        window.open(url, '_blank');
    }

    abrirEnGoogleMaps(lat, lng, nombre) {
        const url = `https://www.google.com/maps/search/${encodeURIComponent(nombre)}/@${lat},${lng},15z`;
        window.open(url, '_blank');
    }

    obtenerUbicacionUsuario(destLat, destLng, nombreDestino) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    mostrarNotificacion('📍 Ubicación obtenida. Calculando rutas...', 'success');
                    
                    this.calcularRutaConGoogleMaps('driving', destLat, destLng, nombreDestino);
                },
                (error) => {
                    let mensaje = 'No se pudo obtener la ubicación';
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            mensaje = 'Permiso de ubicación denegado';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            mensaje = 'Ubicación no disponible';
                            break;
                        case error.TIMEOUT:
                            mensaje = 'Tiempo de espera agotado';
                            break;
                    }
                    mostrarNotificacion(`❌ ${mensaje}`, 'error');
                }
            );
        } else {
            mostrarNotificacion('❌ Geolocalización no disponible', 'error');
        }
    }

    compartirRuta(destino, distancia, tiempo, modo) {
        const texto = `🗺️ Ruta a ${destino}:\n📏 Distancia: ${distancia}\n⏱️ Tiempo: ${tiempo}\n🚀 Modo: ${modo}`;
        if (navigator.share) {
            navigator.share({
                title: `Ruta a ${destino}`,
                text: texto,
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(texto).then(() => {
                mostrarNotificacion('📋 Ruta copiada al portapapeles', 'success');
            }).catch(() => {
                mostrarNotificacion('❌ No se pudo compartir la ruta', 'error');
            });
        }
    }

    iniciarRecorridoCaminando(destLat, destLng, nombreDestino) {
        if (!navigator.geolocation) {
            mostrarNotificacion('❌ Tu dispositivo no soporta geolocalización', 'error');
            return;
        }
        if (!this.map) {
            mostrarNotificacion('❌ El mapa no está disponible', 'error');
            return;
        }
        mostrarNotificacion('🚶 Calculando recorrido a pie en el mapa...', 'info');
        if (this.infoWindow) {
            this.infoWindow.close();
        }
        
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const origenLat = position.coords.latitude;
                    const origenLng = position.coords.longitude;
                    const origen = new google.maps.LatLng(origenLat, origenLng);
                    const destino = new google.maps.LatLng(destLat, destLng);
                    
                    const directionsService = new google.maps.DirectionsService();
                    if (this.currentDirectionsRenderer) {
                        this.currentDirectionsRenderer.setMap(null);
                    }
                    this.currentDirectionsRenderer = new google.maps.DirectionsRenderer({
                        suppressMarkers: false,
                        suppressInfoWindows: true,
                        polylineOptions: {
                            strokeColor: '#25D366',
                            strokeWeight: 5,
                            strokeOpacity: 0.8
                        },
                        markerOptions: {
                            icon: {
                                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                                    <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="16" cy="16" r="12" fill="#25D366" stroke="#fff" stroke-width="2"/>
                                        <text x="16" y="20" text-anchor="middle" fill="white" font-size="14">🚶</text>
                                    </svg>
                                `),
                                scaledSize: new google.maps.Size(32, 32),
                                anchor: new google.maps.Point(16, 16)
                            }
                        }
                    });
                    
                    const request = {
                        origin: origen,
                        destination: destino,
                        travelMode: google.maps.TravelMode.WALKING,
                        unitSystem: google.maps.UnitSystem.METRIC,
                        avoidHighways: false,
                        avoidTolls: false
                    };
                    directionsService.route(request, (result, status) => {
                        if (status === 'OK') {
                            this.currentDirectionsRenderer.setMap(this.map);
                            this.currentDirectionsRenderer.setDirections(result);
                            
                            this.map.fitBounds(result.routes[0].bounds);
                            
                            const route = result.routes[0];
                            const leg = route.legs[0];
                            
                            this.mostrarInfoRutaEnMapa(leg, nombreDestino);
                            
                            mostrarNotificacion(`✅ Ruta a pie calculada: ${leg.distance.text} - ${leg.duration.text}`, 'success');
                            
                            console.log('✅ Ruta caminando mostrada en el mapa');
                            
                        } else {
                            console.error('Error calculando ruta:', status);
                            this.manejarErrorRutaEnMapa(status, destLat, destLng, nombreDestino);
                        }
                    });
                    
                } catch (error) {
                    console.error('Error calculando ruta:', error);
                    mostrarNotificacion('❌ Error calculando la ruta', 'error');
                }
            },
            (error) => {
                let mensaje = '❌ No se pudo obtener tu ubicación';
                
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        mensaje = '🔒 Permisos de ubicación denegados';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        mensaje = '📡 Ubicación no disponible';
                        break;
                    case error.TIMEOUT:
                        mensaje = '⏱️ Tiempo de espera agotado';
                        break;
                }
                
                console.warn('Error de geolocalización para recorrido:', error);
                mostrarNotificacion(mensaje, 'error');
            },
            {
                enableHighAccuracy: true,
                timeout: 8000,
                maximumAge: 300000
            }
        );
    }

    mostrarInfoRutaEnMapa(leg, nombreDestino) {
        const infoRuta = new google.maps.InfoWindow({
            content: `
                <div style="padding: 10px; min-width: 200px;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                        <div style="font-size: 24px;">🚶</div>
                        <div>
                            <strong style="color: #25D366;">Ruta a pie a ${nombreDestino}</strong>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 15px; margin-bottom: 10px;">
                        <div style="text-align: center;">
                            <div style="font-size: 12px; color: #666;">📏 Distancia</div>
                            <div style="font-weight: bold; color: #25D366;">${leg.distance.text}</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 12px; color: #666;">⏱️ Tiempo</div>
                            <div style="font-weight: bold; color: #25D366;">${leg.duration.text}</div>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 5px;">
                        <button onclick="window.insDeporManager.limpiarRutaDelMapa()" 
                                style="flex: 1; background: #dc3545; color: white; border: none; padding: 6px 10px; border-radius: 4px; font-size: 12px; cursor: pointer;">
                            <i class="fas fa-times"></i> Limpiar ruta
                        </button>
                        <button onclick="window.insDeporManager.abrirEnGoogleMaps(${leg.end_location.lat()}, ${leg.end_location.lng()}, '${nombreDestino}')" 
                                style="flex: 1; background: #4285f4; color: white; border: none; padding: 6px 10px; border-radius: 4px; font-size: 12px; cursor: pointer;">
                            <i class="fab fa-google"></i> Google Maps
                        </button>
                    </div>
                </div>
            `,
            position: leg.end_location,
            pixelOffset: new google.maps.Size(0, -30)
        });
        
        infoRuta.open(this.map);
        
        this.rutaInfoWindow = infoRuta;
        
        setTimeout(() => {
            if (this.rutaInfoWindow) {
                this.rutaInfoWindow.close();
            }
        }, 10000);
    }

    getModoGoogleMaps(modo) {
        const modos = {
            'driving': '0',    // Auto
            'walking': '2'     // Caminando
        };
        return modos[modo] || '0';
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

    limpiarRutaDelMapa() {
        if (this.currentDirectionsRenderer) {
            this.currentDirectionsRenderer.setMap(null);
            this.currentDirectionsRenderer = null;
        }
        
        if (this.rutaInfoWindow) {
            this.rutaInfoWindow.close();
            this.rutaInfoWindow = null;
        }
        
        mostrarNotificacion('🗺️ Ruta eliminada del mapa', 'info');
    }

    manejarErrorRutaEnMapa(status, destLat, destLng, nombreDestino) {
        let mensaje = 'No se pudo calcular la ruta';
        
        switch (status) {
            case 'ZERO_RESULTS':
                mensaje = 'No se encontró una ruta caminando disponible';
                break;
            case 'OVER_QUERY_LIMIT':
                mensaje = 'Límite de consultas excedido';
                break;
            case 'REQUEST_DENIED':
                mensaje = 'Solicitud denegada';
                break;
            case 'INVALID_REQUEST':
                mensaje = 'Solicitud inválida';
                break;
        }
        
        mostrarNotificacion(`❌ ${mensaje}`, 'error');
        setTimeout(() => {
            const confirmar = confirm(`${mensaje}. ¿Quieres abrir Google Maps en su lugar?`);
            if (confirmar) {
                this.abrirEnGoogleMaps(destLat, destLng, nombreDestino);
            }
        }, 2000);
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

document.addEventListener('DOMContentLoaded', function() {
    document.addEventListener('click', function(e) {
        // Botón de horarios
        if (e.target.closest('.btn-horarios')) {
            const btn = e.target.closest('.btn-horarios');
            const instalacionId = btn.getAttribute('data-id');
            toggleHorarios(instalacionId);
        }
        if (e.target.closest('.btn-cronograma')) {
            const btn = e.target.closest('.btn-cronograma');
            const instalacionId = btn.getAttribute('data-id');
            if (window.insDeporManager) {
                window.insDeporManager.verCronograma(instalacionId);
            }
        }
        if (e.target.closest('.btn-mapa')) {
            const btn = e.target.closest('.btn-mapa');
            const lat = parseFloat(btn.getAttribute('data-lat'));
            const lng = parseFloat(btn.getAttribute('data-lng'));
            const nombre = btn.getAttribute('data-nombre');
            centrarMapaEnInstalacion(lat, lng, nombre);
        }
        if (e.target.closest('.btn-comentarios')) {
            const btn = e.target.closest('.btn-comentarios');
            const instalacionId = btn.getAttribute('data-id');
            mostrarComentarios(instalacionId);
        }
        if (e.target.closest('.btn-imagenes')) {
            const btn = e.target.closest('.btn-imagenes');
            const instalacionId = btn.getAttribute('data-id');
            mostrarGaleria(instalacionId);
        }
        if (e.target.closest('.btn-reservar')) {
            const btn = e.target.closest('.btn-reservar');
            const instalacionId = btn.getAttribute('data-id');
            iniciarReserva(instalacionId);
        }
        if (e.target.closest('.btn-rutas')) {
            const btn = e.target.closest('.btn-rutas');
            const instalacionId = btn.getAttribute('data-id');
            const lat = parseFloat(btn.getAttribute('data-lat'));
            const lng = parseFloat(btn.getAttribute('data-lng'));
            const nombre = btn.getAttribute('data-nombre');
            
            if (window.insDeporManager) {
                window.insDeporManager.mostrarOpcionesRuta(instalacionId, nombre, lat, lng);
            }
        }
    });
});

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

function iniciarReserva(instalacionId) {
    mostrarNotificacion('🚀 Redirigiendo a reservas...', 'info');
    setTimeout(() => {
        window.location.href = `reservas.php?instalacion=${instalacionId}`;
    }, 1000);
}

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
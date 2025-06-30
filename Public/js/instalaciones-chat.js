class InstalacionesChat {
    constructor(insDeporManager) {
        this.insDeporManager = insDeporManager;
        this.instalacionesOriginales = [...insDeporManager.instalaciones];
        this.historialConversacion = [];
        this.filtrosActivos = {};
        this.sugerenciasRapidas = [
            { texto: "🏈 Canchas de fútbol", query: "futbol" },
            { texto: "🏀 Canchas de básquet", query: "basquet" },
            { texto: "🏐 Canchas de vóley", query: "voley" },
            { texto: "💰 Menos de 50 soles", query: "precio menos 50" },
            { texto: "⭐ Mejor calificadas", query: "mejor calificadas" },
            { texto: "📍 Cerca de mí", query: "cerca" }
        ];
        
        this.init();
    }
    
    init() {
        this.crearChatUI();
        this.configurarEventos();
        this.mostrarSaludo();
    }
    
    // ✅ CORREGIR FUNCIÓN crearChatUI para posicionar arriba del mapa
    crearChatUI() {
        const chatHTML = `
            <div id="chat-instalaciones" class="chat-container">
                <!-- Header del Chat -->
                <div class="chat-header">
                    <div class="chat-avatar">
                        <i class="fas fa-robot"></i>
                    </div>
                    <div class="chat-info">
                        <h3>🤖 GameOn Filtros</h3>
                    </div>
                    <button class="chat-toggle" onclick="instalacionesChat.toggleChat()">
                        <i class="fas fa-minus"></i>
                    </button>
                </div>
                
                <!-- Área de Mensajes -->
                <div class="chat-messages" id="chat-messages">
                    <!-- Los mensajes se cargan aquí -->
                </div>
                
                <!-- Sugerencias Rápidas -->
                <div class="chat-suggestions" id="chat-suggestions">
                    ${this.sugerenciasRapidas.map(sug => `
                        <button class="suggestion-btn" data-query="${sug.query}">
                            ${sug.texto}
                        </button>
                    `).join('')}
                </div>
                
                <!-- Input de Chat -->
                <div class="chat-input-container">
                    <div class="chat-input-wrapper">
                        <input type="text" 
                               id="chat-input" 
                               placeholder="Ej: 'canchas de fútbol baratas' o 'cerca de mí'"
                               autocomplete="off">
                        <button class="chat-send-btn" id="chat-send">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                    <div class="chat-actions">
                        <button class="action-btn" onclick="instalacionesChat.limpiarFiltros()">
                            <i class="fas fa-refresh"></i> Limpiar filtros
                        </button>
                        <button class="action-btn" onclick="instalacionesChat.mostrarAyuda()">
                            <i class="fas fa-question-circle"></i> Ayuda
                        </button>
                    </div>
                </div>
                
                <!-- Indicador de Estado -->
                <div class="chat-typing" id="chat-typing" style="display: none;">
                    <div class="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <span>GameOn Assistant está escribiendo...</span>
                </div>
            </div>
        `;
        
        // ✅ BUSCAR ESPECÍFICAMENTE EL MAPA PARA INSERTAR ARRIBA
        let targetElement = null;
        
        // Buscar el elemento del mapa
        const mapElement = document.getElementById('map');
        if (mapElement) {
            targetElement = mapElement.parentElement; // Contenedor del mapa
            console.log('✅ Mapa encontrado, insertando chat arriba');
        }
        
        // Si no encuentra el mapa, buscar por clase
        if (!targetElement) {
            const mapaCard = document.querySelector('.dashboard-wide-card h2');
            if (mapaCard && mapaCard.textContent.includes('MAPA')) {
                targetElement = mapaCard.closest('.dashboard-wide-card');
                console.log('✅ Tarjeta del mapa encontrada');
            }
        }
        
        // Fallback: contenedor principal
        if (!targetElement) {
            targetElement = document.querySelector('.container.mt-4');
            console.log('⚠️ Usando contenedor principal como fallback');
        }
        
        if (targetElement) {
            // ✅ INSERTAR ANTES DEL MAPA
            targetElement.insertAdjacentHTML('beforebegin', chatHTML);
            console.log('✅ Chat UI creado e insertado ARRIBA del mapa');
        } else {
            console.error('❌ No se encontró elemento objetivo para insertar el chat');
            return;
        }
    }
    
    // ✅ CONFIGURAR EVENTOS DEL CHAT
    configurarEventos() {
        // ✅ ESPERAR A QUE LOS ELEMENTOS ESTÉN EN EL DOM
        setTimeout(() => {
            const chatInput = document.getElementById('chat-input');
            const chatSend = document.getElementById('chat-send');
            
            if (!chatInput) {
                console.error('❌ chat-input no encontrado en el DOM');
                return;
            }
            
            if (!chatSend) {
                console.error('❌ chat-send no encontrado en el DOM');
                return;
            }
            
            console.log('✅ Elementos del chat encontrados, configurando eventos...');
            
            // Enviar mensaje al presionar Enter
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.enviarMensaje();
                }
            });
            
            // Enviar mensaje al hacer clic
            chatSend.addEventListener('click', () => {
                this.enviarMensaje();
            });
            
            // Sugerencias rápidas
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('suggestion-btn')) {
                    const query = e.target.getAttribute('data-query');
                    this.procesarConsulta(query);
                    this.ocultarSugerencias();
                }
            });
            
            console.log('✅ Eventos del chat configurados correctamente');
            
        }, 100); // Pequeño delay para asegurar que el DOM esté actualizado
    }
    
    // ✅ ENVIAR MENSAJE DEL USUARIO
    enviarMensaje() {
        const input = document.getElementById('chat-input');
        const mensaje = input.value.trim();
        
        if (!mensaje) return;
        
        // Mostrar mensaje del usuario
        this.agregarMensaje(mensaje, 'usuario');
        
        // Limpiar input
        input.value = '';
        
        // Procesar consulta
        this.procesarConsulta(mensaje);
    }
    
    // ✅ AGREGAR MENSAJE AL CHAT
    agregarMensaje(texto, tipo, opciones = null) {
        const messagesContainer = document.getElementById('chat-messages');
        const timestamp = new Date().toLocaleTimeString('es-PE', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        const mensajeHTML = `
            <div class="chat-message ${tipo}">
                <div class="message-content">
                    <div class="message-text">${texto}</div>
                    ${opciones ? this.crearOpcionesBotones(opciones) : ''}
                    <div class="message-time">${timestamp}</div>
                </div>
            </div>
        `;
        
        messagesContainer.insertAdjacentHTML('beforeend', mensajeHTML);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Guardar en historial
        this.historialConversacion.push({
            texto: texto,
            tipo: tipo,
            timestamp: new Date(),
            opciones: opciones
        });
    }
    
    // ✅ CREAR BOTONES DE OPCIONES
    crearOpcionesBotones(opciones) {
        return `
            <div class="message-options">
                ${opciones.map(opcion => `
                    <button class="option-btn" onclick="instalacionesChat.procesarOpcion('${opcion.action}', '${opcion.value}')">
                        ${opcion.icono} ${opcion.texto}
                    </button>
                `).join('')}
            </div>
        `;
    }
    
    // ✅ MOSTRAR SALUDO INICIAL
    mostrarSaludo() {
        setTimeout(() => {
            this.agregarMensaje(
                `¡Hola! 👋 Soy tu asistente para encontrar instalaciones deportivas.<br><br>
                 Puedes preguntarme cosas como:<br>
                 • "Canchas de fútbol baratas"<br>
                 • "Instalaciones cerca de mí"<br>
                 • "Menos de 60 soles por hora"<br>
                 • "Mejor calificadas"<br><br>
                 ¿Qué tipo de instalación buscas? 🏟️`,
                'bot'
            );
        }, 500);
    }
    
    // ✅ PROCESAR CONSULTA DEL USUARIO
    async procesarConsulta(consulta) {
        this.mostrarTyping();
        
        // Simular tiempo de procesamiento
        await this.delay(1000);
        
        try {
            // Parsear la consulta
            const filtros = this.parsearConsulta(consulta);
            
            // Aplicar filtros
            const resultados = this.aplicarFiltros(filtros);
            
            // Responder al usuario
            this.responderConsulta(consulta, filtros, resultados);
            
        } catch (error) {
            console.error('Error procesando consulta:', error);
            this.agregarMensaje(
                '❌ Lo siento, hubo un error procesando tu consulta. ¿Puedes intentar de nuevo?',
                'bot'
            );
        } finally {
            this.ocultarTyping();
        }
    }
    
    // ✅ PARSER DE CONSULTAS CON PALABRAS CLAVE
    parsearConsulta(consulta) {
        const query = consulta.toLowerCase();
        const filtros = {};
        
        // 🏈 DETECTAR DEPORTES
        const deportes = {
            'futbol': ['futbol', 'fútbol', 'soccer', 'football'],
            'basquet': ['basquet', 'básquet', 'basketball', 'baloncesto'],
            'voley': ['voley', 'vóley', 'voleibol', 'volleyball']
        };
        
        for (const [deporte, variaciones] of Object.entries(deportes)) {
            if (variaciones.some(v => query.includes(v))) {
                filtros.deporte = deporte;
                break;
            }
        }
        
        // 💰 DETECTAR PRECIOS
        const precioRegex = /(?:menos|menor|bajo|máximo|max|hasta)\s*(?:de\s*)?(\d+)/i;
        const precioMatch = query.match(precioRegex);
        if (precioMatch) {
            filtros.precioMax = parseInt(precioMatch[1]);
        }
        
        const precioRango = /entre\s*(\d+)\s*y\s*(\d+)/i;
        const rangoMatch = query.match(precioRango);
        if (rangoMatch) {
            filtros.precioMin = parseInt(rangoMatch[1]);
            filtros.precioMax = parseInt(rangoMatch[2]);
        }
        
        // ⭐ DETECTAR CALIFICACIÓN
        if (query.includes('mejor') || query.includes('buena') || query.includes('calificada')) {
            filtros.calificacionMin = 4.0;
        }
        
        if (query.includes('excelente') || query.includes('5 estrella')) {
            filtros.calificacionMin = 4.5;
        }
        
        // 📍 DETECTAR UBICACIÓN
        if (query.includes('cerca') || query.includes('cercana') || query.includes('próxima')) {
            filtros.ubicacion = 'cerca';
        }
        
        // 💸 DETECTAR TÉRMINOS DE PRECIO
        if (query.includes('barato') || query.includes('económico') || query.includes('accesible')) {
            filtros.precioMax = 45;
        }
        
        if (query.includes('caro') || query.includes('premium') || query.includes('exclusivo')) {
            filtros.precioMin = 80;
        }
        
        return filtros;
    }
    
    // ✅ APLICAR FILTROS A LAS INSTALACIONES
    aplicarFiltros(filtros) {
        let instalacionesFiltradas = [...this.instalacionesOriginales];
        
        // Filtrar por deporte
        if (filtros.deporte) {
            instalacionesFiltradas = instalacionesFiltradas.filter(instalacion => {
                return instalacion.deportes && instalacion.deportes.some(d => 
                    d.nombre.toLowerCase().includes(filtros.deporte)
                );
            });
        }
        
        // Filtrar por precio máximo
        if (filtros.precioMax) {
            instalacionesFiltradas = instalacionesFiltradas.filter(instalacion => {
                const tarifa = parseFloat(instalacion.tarifa || 0);
                return tarifa <= filtros.precioMax;
            });
        }
        
        // Filtrar por precio mínimo
        if (filtros.precioMin) {
            instalacionesFiltradas = instalacionesFiltradas.filter(instalacion => {
                const tarifa = parseFloat(instalacion.tarifa || 0);
                return tarifa >= filtros.precioMin;
            });
        }
        
        // Filtrar por calificación
        if (filtros.calificacionMin) {
            instalacionesFiltradas = instalacionesFiltradas.filter(instalacion => {
                const calificacion = parseFloat(instalacion.calificacion || 0);
                return calificacion >= filtros.calificacionMin;
            });
        }
        
        // Guardar filtros activos
        this.filtrosActivos = filtros;
        
        // Actualizar vista
        this.actualizarVista(instalacionesFiltradas);
        
        return instalacionesFiltradas;
    }
    
    // ✅ RESPONDER SEGÚN RESULTADOS
    responderConsulta(consulta, filtros, resultados) {
        const total = resultados.length;
        
        if (total === 0) {
            this.responderSinResultados(filtros);
        } else if (total === 1) {
            this.responderUnResultado(resultados[0]);
        } else {
            this.responderMultiplesResultados(resultados, filtros);
        }
    }
    
    responderSinResultados(filtros) {
        let mensaje = '🔍 No encontré instalaciones que coincidan exactamente con tu búsqueda.';
        
        const sugerencias = [];
        
        if (filtros.precioMax) {
            sugerencias.push({
                texto: `💰 Ver hasta S/${filtros.precioMax + 20}`,
                action: 'modificar_precio',
                value: filtros.precioMax + 20,
                icono: '💰'
            });
        }
        
        if (filtros.deporte) {
            sugerencias.push({
                texto: '🏃 Ver todos los deportes',
                action: 'quitar_deporte',
                value: '',
                icono: '🏃'
            });
        }
        
        if (filtros.calificacionMin) {
            sugerencias.push({
                texto: '⭐ Ver todas las calificaciones',
                action: 'quitar_calificacion',
                value: '',
                icono: '⭐'
            });
        }
        
        sugerencias.push({
            texto: '🔄 Ver todas las instalaciones',
            action: 'limpiar_filtros',
            value: '',
            icono: '🔄'
        });
        
        mensaje += '<br><br>¿Te gustaría probar con:';
        
        this.agregarMensaje(mensaje, 'bot', sugerencias);
    }
    
    responderUnResultado(instalacion) {
        const deportesTexto = instalacion.deportes.map(d => d.nombre).join(', ');
        
        const mensaje = `
            🎯 ¡Encontré la instalación perfecta!<br><br>
            <strong>📍 ${instalacion.nombre}</strong><br>
            🏃 Deportes: ${deportesTexto}<br>
            💰 Tarifa: S/${parseFloat(instalacion.tarifa).toFixed(2)}/hora<br>
            ⭐ Calificación: ${parseFloat(instalacion.calificacion).toFixed(1)} estrellas<br>
            📍 ${instalacion.direccion}
        `;
        
        const opciones = [
            {
                texto: '🗺️ Ver en mapa',
                action: 'ver_mapa',
                value: instalacion.id,
                icono: '🗺️'
            },
            {
                texto: '📅 Ver áreas deportivas',
                action: 'ver_areas',
                value: instalacion.id,
                icono: '📅'
            }
        ];
        
        this.agregarMensaje(mensaje, 'bot', opciones);
    }
    
    responderMultiplesResultados(resultados, filtros) {
        const total = resultados.length;
        let mensaje = `🎉 ¡Encontré ${total} instalaciones que coinciden con tu búsqueda!<br><br>`;
        
        // Mostrar las 3 mejores
        const mejores = resultados
            .sort((a, b) => parseFloat(b.calificacion) - parseFloat(a.calificacion))
            .slice(0, 3);
        
        mensaje += '<strong>🏆 Las mejor calificadas:</strong><br>';
        mejores.forEach((inst, i) => {
            const deportes = inst.deportes.map(d => d.nombre).join(', ');
            mensaje += `${i + 1}. <strong>${inst.nombre}</strong> (⭐${parseFloat(inst.calificacion).toFixed(1)}) - ${deportes}<br>`;
        });
        
        // Estadísticas
        const tarifaPromedio = resultados.reduce((sum, inst) => sum + parseFloat(inst.tarifa), 0) / total;
        const tarifaMin = Math.min(...resultados.map(inst => parseFloat(inst.tarifa)));
        const tarifaMax = Math.max(...resultados.map(inst => parseFloat(inst.tarifa)));
        
        mensaje += `<br>📊 <strong>Resumen:</strong><br>`;
        mensaje += `💰 Precios: S/${tarifaMin.toFixed(2)} - S/${tarifaMax.toFixed(2)}<br>`;
        mensaje += `📈 Promedio: S/${tarifaPromedio.toFixed(2)}/hora`;
        
        const opciones = [
            {
                texto: '🗺️ Ver todas en mapa',
                action: 'mostrar_mapa',
                value: 'todas',
                icono: '🗺️'
            },
            {
                texto: '💰 Solo las más baratas',
                action: 'filtrar_baratas',
                value: tarifaMin + 10,
                icono: '💰'
            },
            {
                texto: '⭐ Solo las mejor valoradas',
                action: 'filtrar_mejores',
                value: '4.0',
                icono: '⭐'
            }
        ];
        
        this.agregarMensaje(mensaje, 'bot', opciones);
    }
    
    // ✅ PROCESAR OPCIONES DE BOTONES
    procesarOpcion(action, value) {
        switch (action) {
            case 'modificar_precio':
                this.filtrosActivos.precioMax = parseInt(value);
                delete this.filtrosActivos.precioMin;
                this.aplicarFiltros(this.filtrosActivos);
                this.agregarMensaje(`Ampliando búsqueda hasta S/${value}...`, 'usuario');
                break;
                
            case 'quitar_deporte':
                delete this.filtrosActivos.deporte;
                this.aplicarFiltros(this.filtrosActivos);
                this.agregarMensaje('Mostrando todos los deportes...', 'usuario');
                break;
                
            case 'limpiar_filtros':
                this.limpiarFiltros();
                break;
                
            case 'ver_mapa':
                this.verEnMapa(value);
                break;
                
            case 'ver_areas':
                this.verAreasDeportivas(value);
                break;
                
            case 'filtrar_baratas':
                this.filtrosActivos.precioMax = parseInt(value);
                this.aplicarFiltros(this.filtrosActivos);
                this.agregarMensaje('Mostrando solo las más económicas...', 'usuario');
                break;
                
            case 'filtrar_mejores':
                this.filtrosActivos.calificacionMin = parseFloat(value);
                this.aplicarFiltros(this.filtrosActivos);
                this.agregarMensaje('Mostrando solo las mejor valoradas...', 'usuario');
                break;
        }
    }
    
    // ✅ ACTUALIZAR VISTA DE INSTALACIONES
    actualizarVista(instalacionesFiltradas) {
        const cards = document.querySelectorAll('.instalacion-card');
        
        cards.forEach(card => {
            const id = parseInt(card.getAttribute('data-id'));
            const encontrada = instalacionesFiltradas.find(inst => inst.id === id);
            
            if (encontrada) {
                card.style.display = 'block';
                card.classList.add('chat-filtered');
            } else {
                card.style.display = 'none';
                card.classList.remove('chat-filtered');
            }
        });
        
        // Actualizar mapa si existe
        if (this.insDeporManager && this.insDeporManager.map) {
            this.actualizarMapa(instalacionesFiltradas);
        }
        
        // Scroll a la lista
        setTimeout(() => {
            document.getElementById('listaInstalaciones').scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }, 500);
    }
    
    // ✅ ACTUALIZAR MARCADORES DEL MAPA
    actualizarMapa(instalacionesFiltradas) {
        // Limpiar marcadores existentes
        this.insDeporManager.markers.forEach(marker => marker.setMap(null));
        this.insDeporManager.markers = [];
        
        // Crear nuevos marcadores solo para instalaciones filtradas
        const facilitiesFiltradas = instalacionesFiltradas.map(instalacion => {
            const deportesTexto = instalacion.deportes.map(d => d.nombre).join(', ');
            return {
                position: { 
                    lat: parseFloat(instalacion.latitud), 
                    lng: parseFloat(instalacion.longitud) 
                },
                name: instalacion.nombre,
                type: deportesTexto,
                id: instalacion.id,
                tarifa: `S/. ${parseFloat(instalacion.tarifa).toFixed(2)}`,
                calificacion: parseFloat(instalacion.calificacion)
            };
        });
        
        // Agregar marcadores filtrados
        facilitiesFiltradas.forEach((facility) => {
            const marker = new google.maps.Marker({
                position: facility.position,
                map: this.insDeporManager.map,
                title: facility.name,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: "#00bcd4", // Color destacado para resultados filtrados
                    fillOpacity: 1,
                    strokeColor: "#ffffff",
                    strokeWeight: 2,
                }
            });
            
            this.insDeporManager.markers.push(marker);
            
            // Info window para marcadores filtrados
            marker.addListener("click", () => {
                const instalacionCompleta = instalacionesFiltradas.find(inst => inst.id === facility.id);
                const imagenUrl = instalacionCompleta?.imagen || '../../Resources/default_instalacion.jpg';
                
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
                
                this.insDeporManager.infoWindow.setContent(infoContent);
                this.insDeporManager.infoWindow.open(this.insDeporManager.map, marker);
            });
        });
        
        // Ajustar vista del mapa para mostrar todos los marcadores
        if (facilitiesFiltradas.length > 0) {
            const bounds = new google.maps.LatLngBounds();
            facilitiesFiltradas.forEach(facility => {
                bounds.extend(facility.position);
            });
            this.insDeporManager.map.fitBounds(bounds);
        }
    }
    
    // ✅ FUNCIONES AUXILIARES
    limpiarFiltros() {
        this.filtrosActivos = {};
        this.actualizarVista(this.instalacionesOriginales);
        this.agregarMensaje('🔄 Filtros limpiados. Mostrando todas las instalaciones.', 'bot');
        this.mostrarSugerencias();
    }
    
    mostrarTyping() {
        const typingElement = document.getElementById('chat-typing');
        if (typingElement) {
            typingElement.style.display = 'flex';
            const messagesContainer = document.getElementById('chat-messages');
            if (messagesContainer) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        }
    }
    
    ocultarTyping() {
        const typingElement = document.getElementById('chat-typing');
        if (typingElement) {
            typingElement.style.display = 'none';
        }
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    mostrarSugerencias() {
        const suggestionsElement = document.getElementById('chat-suggestions');
        if (suggestionsElement) {
            suggestionsElement.style.display = 'block';
        }
    }
    
    ocultarSugerencias() {
        const suggestionsElement = document.getElementById('chat-suggestions');
        if (suggestionsElement) {
            suggestionsElement.style.display = 'none';
        }
    }
    
    toggleChat() {
        const chat = document.getElementById('chat-instalaciones');
        if (!chat) return;
        
        const toggleBtn = chat.querySelector('.chat-toggle i');
        
        if (chat.classList.contains('minimized')) {
            chat.classList.remove('minimized');
            if (toggleBtn) toggleBtn.className = 'fas fa-minus';
        } else {
            chat.classList.add('minimized');
            if (toggleBtn) toggleBtn.className = 'fas fa-plus';
        }
    }
    
    mostrarAyuda() {
        const ayuda = `
            💡 <strong>¿Cómo usar el asistente?</strong><br><br>
            
            <strong>🏃 Deportes:</strong><br>
            • "canchas de fútbol"<br>
            • "instalaciones de básquet"<br>
            • "áreas de vóley"<br><br>
            
            <strong>💰 Precios:</strong><br>
            • "menos de 50 soles"<br>
            • "entre 30 y 60 soles"<br>
            • "baratas" o "económicas"<br><br>
            
            <strong>⭐ Calidad:</strong><br>
            • "mejor calificadas"<br>
            • "4 estrellas o más"<br>
            • "excelentes"<br><br>
            
            <strong>📍 Ubicación:</strong><br>
            • "cerca de mí"<br>
            • "instalaciones cercanas"<br><br>
            
            <strong>🎯 Ejemplos completos:</strong><br>
            • "canchas de fútbol baratas cerca de mí"<br>
            • "instalaciones de básquet menos de 45 soles"<br>
            • "mejor calificadas de vóley"
        `;
        
        this.agregarMensaje(ayuda, 'bot');
    }
    
    // ✅ FUNCIÓN PARA CENTRAR MAPA (si existe)
    verEnMapa(instalacionId) {
        const instalacion = this.instalacionesOriginales.find(inst => inst.id == instalacionId);
        if (instalacion && this.insDeporManager && this.insDeporManager.map) {
            // Centrar el mapa en la instalación
            const position = {
                lat: parseFloat(instalacion.latitud),
                lng: parseFloat(instalacion.longitud)
            };
            
            this.insDeporManager.map.setCenter(position);
            this.insDeporManager.map.setZoom(16);
            
            // Buscar el marcador correspondiente y abrirlo
            const marker = this.insDeporManager.markers.find(m => {
                const markerPos = m.getPosition();
                return Math.abs(markerPos.lat() - position.lat) < 0.001 && 
                       Math.abs(markerPos.lng() - position.lng) < 0.001;
            });
            
            if (marker) {
                google.maps.event.trigger(marker, 'click');
            }
        }
        this.agregarMensaje('📍 Mostrando ubicación en el mapa...', 'bot');
    }
    
    verAreasDeportivas(instalacionId) {
        if (this.insDeporManager && typeof this.insDeporManager.verCronograma === 'function') {
            this.insDeporManager.verCronograma(instalacionId);
        }
        this.agregarMensaje('📅 Abriendo áreas deportivas...', 'bot');
    }
    
    debugDOM() {
        console.log('🔍 DEBUG DOM:');
        console.log('- chat-instalaciones:', document.getElementById('chat-instalaciones'));
        console.log('- chat-input:', document.getElementById('chat-input'));
        console.log('- chat-send:', document.getElementById('chat-send'));
        console.log('- chat-messages:', document.getElementById('chat-messages'));
        console.log('- Total elementos con clase dashboard-wide-card:', document.querySelectorAll('.dashboard-wide-card').length);
        
        // Listar todos los IDs en la página
        const elementos = document.querySelectorAll('[id]');
        console.log('- Todos los IDs:', Array.from(elementos).map(el => el.id));
    }
} // ✅ CIERRE DE LA CLASE InstalacionesChat

// ✅ VARIABLE GLOBAL
window.instalacionesChat = null;

console.log('✅ InstalacionesChat cargado correctamente');
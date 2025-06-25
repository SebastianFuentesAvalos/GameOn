class TorneosManager {
    constructor() {
        this.baseUrl = '../../Controllers/TorneosController.php';
        this.filtroActual = {
            deporte_id: '',
            estado: '',
            calificacion_min: 0,
            nombre: '',
            organizador_tipo: ''
        };
        this.init();
    }

    init() {
        this.configurarEventos();
        this.cargarTorneosIniciales();
    }

    configurarEventos() {
        // Evento para filtros rápidos por estado
        document.querySelectorAll('[data-estado]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remover clase active de todos los botones
                document.querySelectorAll('[data-estado]').forEach(b => b.classList.remove('active'));
                // Agregar active al clickeado
                e.target.classList.add('active');
                
                this.filtroActual.estado = e.target.dataset.estado;
                this.cargarTorneos();
            });
        });

        // Evento para botón de búsqueda
        document.getElementById('btnFiltrar').addEventListener('click', () => {
            this.aplicarFiltros();
        });

        // Eventos para filtros en tiempo real
        document.getElementById('busquedaNombre').addEventListener('input', (e) => {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.filtroActual.nombre = e.target.value;
                this.cargarTorneos();
            }, 500);
        });

        // Eventos para selects
        document.getElementById('filtroDeporte').addEventListener('change', (e) => {
            this.filtroActual.deporte_id = e.target.value;
            this.cargarTorneos();
        });

        document.getElementById('filtroCalificacion').addEventListener('change', (e) => {
            this.filtroActual.calificacion_min = e.target.value;
            this.cargarTorneos();
        });

        document.getElementById('filtroOrganizador').addEventListener('change', (e) => {
            this.filtroActual.organizador_tipo = e.target.value;
            this.cargarTorneos();
        });
    }

    aplicarFiltros() {
        this.filtroActual = {
            deporte_id: document.getElementById('filtroDeporte').value,
            calificacion_min: document.getElementById('filtroCalificacion').value,
            nombre: document.getElementById('busquedaNombre').value,
            organizador_tipo: document.getElementById('filtroOrganizador').value,
            estado: this.filtroActual.estado // Mantener estado de filtros rápidos
        };
        this.cargarTorneos();
    }

    async cargarTorneosIniciales() {
        this.cargarTorneos();
    }

    async cargarTorneos() {
        const container = document.getElementById('torneosContainer');
        
        // Mostrar loading
        container.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
            </div>
        `;

        try {
            const params = new URLSearchParams({
                action: 'obtener_torneos',
                ...this.filtroActual
            });

            const response = await fetch(`${this.baseUrl}?${params}`);
            const data = await response.json();

            if (data.success) {
                this.mostrarTorneos(data.torneos);
            } else {
                this.mostrarError('Error cargando torneos: ' + data.message);
            }
        } catch (error) {
            console.error('Error:', error);
            this.mostrarError('Error de conexión al cargar torneos');
        }
    }

    // ✅ FUNCIÓN ACTUALIZADA: Mostrar torneos con estados de inscripción
    mostrarTorneos(torneos) {
        const container = document.getElementById('torneosContainer');

        if (torneos.length === 0) {
            container.innerHTML = `
                <div class="sin-torneos">
                    <i class="fas fa-trophy"></i>
                    <h4>No se encontraron torneos</h4>
                    <p>Prueba ajustar los filtros de búsqueda</p>
                </div>
            `;
            return;
        }

        let html = '<div class="torneos-grid">';
        
        torneos.forEach(torneo => {
            const fechaInicio = new Date(torneo.fecha_inicio).toLocaleDateString('es-PE');
            const fechaFin = torneo.fecha_fin ? new Date(torneo.fecha_fin).toLocaleDateString('es-PE') : 'Por definir';
            const inscripcionFin = new Date(torneo.fecha_inscripcion_fin).toLocaleDateString('es-PE');
            
            const precio = parseFloat(torneo.costo_inscripcion) === 0 ? 
                '<span class="torneo-precio gratis"><i class="fas fa-gift"></i> GRATIS</span>' :
                `<span class="torneo-precio"><i class="fas fa-coins"></i> S/. ${parseFloat(torneo.costo_inscripcion).toFixed(2)}</span>`;

            const calificacion = this.generarEstrellas(torneo.sede_calificacion);
            
            // ✅ USAR ESTADO DE TARJETA DEL BACKEND
            const estadoTarjeta = torneo.estado_tarjeta;
            const estadoClass = estadoTarjeta.clase;
            
            // ✅ IMAGEN
            const imagenHtml = torneo.imagen_torneo ? 
                `<img src="${torneo.imagen_torneo}" alt="${torneo.nombre}" class="torneo-imagen" 
                     loading="lazy" onerror="this.parentElement.innerHTML=this.parentElement.querySelector('.torneo-imagen-placeholder').outerHTML;">
                 <div class="torneo-imagen-overlay">
                     <i class="fas fa-eye"></i> Ver torneo
                 </div>` :
                `<div class="torneo-imagen-placeholder">
                     <i class="fas fa-trophy"></i>
                     <span>Torneo ${torneo.deporte_nombre}</span>
                 </div>`;

            // ✅ DETERMINAR ESTADO Y BOTONES DINÁMICAMENTE
            let estadoInfo = '';
            let botones = `
                <button class="btn-torneo btn-ver-detalles" onclick="torneosManager.verDetalles(${torneo.id})">
                    <i class="fas fa-info-circle"></i> Ver Detalles
                </button>
            `;

            // ✅ LÓGICA DE ESTADO MEJORADA
            if (torneo.usuario_inscrito > 0) {
                // ✅ USUARIO YA INSCRITO
                estadoInfo = `
                    <div class="torneo-estado estado-ya-inscrito">
                        <i class="fas fa-check-circle"></i> Ya Inscrito
                        <small>Tu equipo está inscrito</small>
                    </div>
                `;
                botones += `
                    <button class="btn-torneo btn-ya-inscrito" onclick="torneosManager.verMisInscripciones(${torneo.id})">
                        <i class="fas fa-check-circle"></i> Ver Mi Inscripción
                    </button>
                `;
                
            } else if (torneo.aforo_lleno) {
                // ✅ AFORO LLENO
                estadoInfo = `
                    <div class="torneo-estado estado-aforo-lleno">
                        <i class="fas fa-users-slash"></i> Aforo Lleno
                        <small>No hay cupos disponibles</small>
                    </div>
                `;
                botones += `
                    <button class="btn-torneo btn-no-disponible" disabled>
                        <i class="fas fa-users-slash"></i> Sin Cupos
                    </button>
                `;
                
            } else if (torneo.estado === 'inscripciones_abiertas' && torneo.cupos_disponibles > 0) {
                // ✅ DISPONIBLE PARA INSCRIPCIÓN
                estadoInfo = `
                    <div class="torneo-estado estado-inscripciones-abiertas">
                        <i class="fas fa-door-open"></i> Inscripciones Abiertas
                        <small>${torneo.cupos_disponibles} cupos disponibles</small>
                    </div>
                `;
                botones += `
                    <button class="btn-torneo btn-inscribir" onclick="torneosManager.mostrarInscripcion(${torneo.id})">
                        <i class="fas fa-user-plus"></i> Inscribir Equipo
                    </button>
                `;
                
            } else {
                // ✅ OTROS ESTADOS
                const estadosTexto = {
                    'proximo': { texto: 'Próximo', icono: 'fas fa-calendar-plus', clase: 'estado-proximo' },
                    'activo': { texto: 'En Curso', icono: 'fas fa-play', clase: 'estado-activo' },
                    'finalizado': { texto: 'Finalizado', icono: 'fas fa-flag-checkered', clase: 'estado-finalizado' },
                    'inscripciones_cerradas': { texto: 'Inscripciones Cerradas', icono: 'fas fa-door-closed', clase: 'estado-cerrado' }
                };
                
                const infoEstado = estadosTexto[torneo.estado] || { texto: torneo.estado_texto, icono: 'fas fa-info-circle', clase: 'estado-default' };
                
                estadoInfo = `
                    <div class="torneo-estado ${infoEstado.clase}">
                        <i class="${infoEstado.icono}"></i> ${infoEstado.texto}
                    </div>
                `;
            }

            // ✅ INFORMACIÓN DE CUPOS
            let infoCupos = '';
            if (torneo.usuario_inscrito > 0) {
                infoCupos = `
                    <div class="torneo-info inscrito">
                        <i class="fas fa-check-circle"></i> 
                        <strong>Estado:</strong> <span style="color: #28a745;">Ya inscrito</span>
                    </div>
                `;
            } else {
                infoCupos = `
                    <div class="torneo-info">
                        <i class="fas fa-users"></i> 
                        <strong>Cupos:</strong> ${torneo.equipos_inscritos}/${torneo.max_equipos}
                        ${torneo.cupos_disponibles > 0 ? 
                            `<span style="color: #28a745;">(${torneo.cupos_disponibles} disponibles)</span>` :
                            `<span style="color: #dc3545;">(Lleno)</span>`
                        }
                    </div>
                `;
            }

            html += `
                <div class="torneo-card ${torneo.usuario_inscrito > 0 ? 'ya_inscrito' : ''} ${torneo.aforo_lleno ? 'aforo_lleno' : ''}">
                    <div class="torneo-imagen-container">
                        ${imagenHtml}
                    </div>
                    
                    <div class="torneo-content">
                        <div class="torneo-deporte">
                            <i class="fas fa-${this.obtenerIconoDeporte(torneo.deporte_nombre)}"></i> 
                            ${torneo.deporte_nombre}
                        </div>
                        
                        <h3 class="torneo-titulo">${torneo.nombre}</h3>
                        
                        <div class="torneo-info">
                            <i class="fas fa-calendar"></i> 
                            <strong>Inicio:</strong> ${fechaInicio}
                        </div>
                        
                        <div class="torneo-info">
                            <i class="fas fa-calendar-check"></i> 
                            <strong>Fin:</strong> ${fechaFin}
                        </div>
                        
                        <div class="torneo-info">
                            <i class="fas fa-clock"></i> 
                            <strong>Inscripciones hasta:</strong> ${inscripcionFin}
                        </div>
                        
                        ${infoCupos}
                        
                        <div class="sede-info">
                            <div class="torneo-info">
                                <i class="fas fa-map-marker-alt"></i> 
                                <strong>Sede:</strong> ${torneo.sede_nombre}
                            </div>
                            <div class="calificacion-sede">
                                ${calificacion} (${torneo.sede_calificacion}/5)
                            </div>
                            <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
                                <i class="fas fa-${torneo.tipo_usuario === 'ipd' ? 'landmark' : 'building'}"></i>
                                ${torneo.tipo_usuario === 'ipd' ? 'IPD' : 'Privado'}
                            </div>
                        </div>
                        
                        ${precio}
                        
                        ${estadoInfo}
                        
                        <div class="torneo-acciones">
                            ${botones}
                        </div>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    }

    // ✅ NUEVA FUNCIÓN: Ver mis inscripciones en un torneo
    async verMisInscripciones(torneoId) {
        try {
            const response = await fetch(`${this.baseUrl}?action=obtener_mis_inscripciones&torneo_id=${torneoId}`);
            const data = await response.json();
            
            if (data.success) {
                this.mostrarModalMisInscripciones(data.torneo, data.equipos_inscritos);
            } else {
                this.mostrarError('Error: ' + data.message);
            }
        } catch (error) {
            console.error('Error:', error);
            this.mostrarError('Error cargando inscripciones');
        }
    }

    // ✅ NUEVA FUNCIÓN: Modal de mis inscripciones
    mostrarModalMisInscripciones(torneo, equipos) {
        const equiposHtml = equipos.map(equipo => `
            <div class="equipo-inscrito-detalle">
                <h4>${equipo.equipo_nombre}</h4>
                <p><strong>Mi rol:</strong> ${equipo.rol_usuario === 'creador' ? 'Líder' : 'Miembro'}</p>
                <p><strong>Fecha de inscripción:</strong> ${new Date(equipo.fecha_inscripcion).toLocaleDateString('es-PE')}</p>
                <p><strong>Estado:</strong> <span class="estado-${equipo.estado_inscripcion}">${equipo.estado_inscripcion}</span></p>
                <p><strong>Método de pago:</strong> ${equipo.metodo_pago || 'Gratuito'}</p>
                <p><strong>Monto pagado:</strong> S/ ${parseFloat(equipo.monto_pagado || 0).toFixed(2)}</p>
            </div>
        `).join('');
        
        const contenidoModal = `
            <div class="mis-inscripciones-modal">
                <div class="inscripciones-header">
                    <h2>Mis Inscripciones</h2>
                    <h3>${torneo.nombre}</h3>
                </div>
                
                <div class="inscripciones-lista">
                    ${equiposHtml}
                </div>
                
                <div class="inscripciones-acciones">
                    <button class="btn btn-primary" onclick="torneosManager.verDetalles(${torneo.id})">
                        <i class="fas fa-info-circle"></i> Ver Detalles del Torneo
                    </button>
                    <button class="btn btn-secondary" onclick="torneosManager.cerrarModalInscripcion()">
                        <i class="fas fa-times"></i> Cerrar
                    </button>
                </div>
            </div>
        `;
        
        this.mostrarModalInscripcion(contenidoModal, false);
    }

    // ✅ FUNCIÓN NUEVA: Obtener iconos de deportes
    obtenerIconoDeporte(nombreDeporte) {
        const iconos = {
            'futbol': 'futbol',
            'fútbol': 'futbol',
            'football': 'futbol',
            'basketball': 'basketball-ball',
            'basquet': 'basketball-ball',
            'básquet': 'basketball-ball',
            'tenis': 'table-tennis',
            'voley': 'volleyball-ball',
            'vóley': 'volleyball-ball',
            'volleyball': 'volleyball-ball',
            'natacion': 'swimmer',
            'natación': 'swimmer',
            'running': 'running',
            'atletismo': 'running',
            'ciclismo': 'biking',
            'boxeo': 'fist-raised',
            'gimnasia': 'dumbbell',
        };
        
        const nombre = nombreDeporte.toLowerCase();
        return iconos[nombre] || 'trophy';
    }

    generarEstrellas(calificacion) {
        const estrellasLlenas = Math.floor(calificacion);
        const mediaEstrella = calificacion % 1 >= 0.5;
        let html = '';

        for (let i = 0; i < estrellasLlenas; i++) {
            html += '<i class="fas fa-star"></i>';
        }

        if (mediaEstrella) {
            html += '<i class="fas fa-star-half-alt"></i>';
        }

        const estrellasVacias = 5 - estrellasLlenas - (mediaEstrella ? 1 : 0);
        for (let i = 0; i < estrellasVacias; i++) {
            html += '<i class="far fa-star"></i>';
        }

        return html;
    }

    async verDetalles(torneoId) {
        try {
            // ✅ MOSTRAR LOADING
            this.mostrarModalDetalles('Cargando detalles del torneo...', true);
            
            // ✅ HACER PETICIÓN AL SERVIDOR
            const response = await fetch(`${this.baseUrl}?action=obtener_detalles&torneo_id=${torneoId}`);
            const data = await response.json();
            
            if (data.success) {
                this.mostrarDetallesCompletos(data);
            } else {
                this.mostrarError('Error cargando detalles: ' + data.message);
            }
            
        } catch (error) {
            console.error('Error:', error);
            this.mostrarError('Error de conexión al cargar detalles del torneo');
        }
    }

    // ✅ NUEVA FUNCIÓN: Mostrar detalles completos del torneo
    mostrarDetallesCompletos(data) {
        const { torneo, equipos_inscritos, cupos_disponibles, total_equipos_inscritos, 
                porcentaje_ocupacion, inscripciones_abiertas, puede_inscribirse } = data;
        
        // ✅ FORMATEAR FECHAS
        const fechaInicio = new Date(torneo.fecha_inicio).toLocaleDateString('es-PE', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
        const fechaFin = torneo.fecha_fin ? 
            new Date(torneo.fecha_fin).toLocaleDateString('es-PE', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            }) : 'Por definir';
        const fechaInscripcionFin = new Date(torneo.fecha_inscripcion_fin).toLocaleDateString('es-PE', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
        
        // ✅ GENERAR ESTRELLAS DE CALIFICACIÓN
        const estrellas = this.generarEstrellas(torneo.sede_calificacion);
        
        // ✅ PROCESAR PREMIOS
        const premios = this.procesarPremios(torneo.premio_1, torneo.premio_2, torneo.premio_3);
        
        // ✅ ESTADO DEL TORNEO
        const estadoClass = `estado-${torneo.estado.replace('_', '-')}`;
        const estadoBadge = `<span class="torneo-estado-badge ${estadoClass}">${torneo.estado_texto}</span>`;
        
        // ✅ COSTO DE INSCRIPCIÓN
        const costoHtml = parseFloat(torneo.costo_inscripcion) === 0 ? 
            '<span class="costo-gratis"><i class="fas fa-gift"></i> GRATIS</span>' :
            `<span class="costo-pago"><i class="fas fa-coins"></i> S/. ${parseFloat(torneo.costo_inscripcion).toFixed(2)}</span>`;
        
        // ✅ PROGRESS BAR DE CUPOS
        const progressBarHtml = `
            <div class="cupos-progress">
                <div class="cupos-info">
                    <span><strong>${total_equipos_inscritos}</strong> de <strong>${torneo.max_equipos}</strong> equipos inscritos</span>
                    <span class="cupos-disponibles">${cupos_disponibles} cupos disponibles</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${porcentaje_ocupacion}%"></div>
                </div>
                <div class="porcentaje">${porcentaje_ocupacion}% ocupado</div>
            </div>
        `;
        
        // ✅ LISTA DE EQUIPOS INSCRITOS
        const equiposHtml = equipos_inscritos.length > 0 ? 
            equipos_inscritos.map((equipo, index) => `
                <div class="equipo-inscrito">
                    <span class="equipo-numero">${index + 1}</span>
                    <div class="equipo-info">
                        <strong>${equipo.equipo_nombre}</strong>
                        <small>Líder: ${equipo.lider_nombre} ${equipo.lider_apellidos}</small>
                        <small>Inscrito: ${new Date(equipo.fecha_inscripcion).toLocaleDateString('es-PE')}</small>
                    </div>
                    <span class="equipo-estado estado-${equipo.estado_inscripcion}">
                        ${equipo.estado_inscripcion}
                    </span>
                </div>
            `).join('') :
            '<div class="sin-equipos"><i class="fas fa-users-slash"></i> Aún no hay equipos inscritos</div>';
        
        // ✅ BOTONES DE ACCIÓN
        const botonesAccion = puede_inscribirse ? `
            <button class="btn btn-primary btn-inscribir-equipo" onclick="torneosManager.mostrarInscripcion(${torneo.id})">
                <i class="fas fa-user-plus"></i> Inscribir mi Equipo
            </button>
        ` : '';
        
        // ✅ CONTENIDO COMPLETO DEL MODAL
        const contenidoModal = `
            <div class="torneo-detalles-modal">
                <!-- HEADER DEL TORNEO -->
                <div class="torneo-header">
                    <div class="torneo-imagen-detalle">
                        ${torneo.imagen_torneo ? 
                            `<img src="${torneo.imagen_torneo}" alt="${torneo.nombre}" />` :
                            `<div class="torneo-placeholder"><i class="fas fa-trophy"></i></div>`
                        }
                    </div>
                    <div class="torneo-info-principal">
                        <h2>${torneo.nombre}</h2>
                        <div class="torneo-deporte-badge">
                            <i class="fas fa-${this.obtenerIconoDeporte(torneo.deporte_nombre)}"></i>
                            ${torneo.deporte_nombre}
                        </div>
                        ${estadoBadge}
                        ${costoHtml}
                    </div>
                </div>
                
                <!-- INFORMACIÓN BÁSICA -->
                <div class="torneo-info-grid">
                    <div class="info-card">
                        <h4><i class="fas fa-calendar"></i> Fechas del Torneo</h4>
                        <div class="info-item">
                            <strong>Inicio:</strong> ${fechaInicio}
                        </div>
                        <div class="info-item">
                            <strong>Fin:</strong> ${fechaFin}
                        </div>
                        <div class="info-item">
                            <strong>Inscripciones hasta:</strong> ${fechaInscripcionFin}
                        </div>
                    </div>
                    
                    <div class="info-card">
                        <h4><i class="fas fa-map-marker-alt"></i> Sede del Torneo</h4>
                        <div class="info-item">
                            <strong>${torneo.sede_nombre}</strong>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-map-marker-alt"></i> ${torneo.sede_direccion}
                        </div>
                        <div class="info-item">
                            <i class="fas fa-phone"></i> ${torneo.sede_telefono}
                        </div>
                        <div class="calificacion-sede">
                            ${estrellas} (${torneo.sede_calificacion}/5)
                        </div>
                    </div>
                    
                    <div class="info-card">
                        <h4><i class="fas fa-trophy"></i> Premios</h4>
                        ${premios}
                    </div>
                    
                    <div class="info-card">
                        <h4><i class="fas fa-info-circle"></i> Modalidad</h4>
                        <div class="info-item">
                            <strong>${this.formatearModalidad(torneo.modalidad)}</strong>
                        </div>
                        <div class="info-item">
                            Máximo ${torneo.max_equipos} equipos
                        </div>
                    </div>
                </div>
                
                <!-- DESCRIPCIÓN -->
                ${torneo.descripcion ? `
                    <div class="torneo-descripcion">
                        <h4><i class="fas fa-align-left"></i> Descripción</h4>
                        <p>${torneo.descripcion}</p>
                    </div>
                ` : ''}
                
                <!-- CUPOS DISPONIBLES -->
                <div class="cupos-section">
                    <h4><i class="fas fa-users"></i> Equipos Participantes</h4>
                    ${progressBarHtml}
                </div>
                
                <!-- EQUIPOS INSCRITOS -->
                <div class="equipos-section">
                    <h4><i class="fas fa-list"></i> Equipos Inscritos</h4>
                    <div class="equipos-lista">
                        ${equiposHtml}
                    </div>
                </div>
            </div>
        `;
        
        this.mostrarModalDetalles(contenidoModal, false);
    }

    // ✅ FUNCIONES AUXILIARES
    procesarPremios(premio1, premio2, premio3) {
        const premios = [];
        if (premio1) premios.push(`<div class="premio-item premio-1"><i class="fas fa-medal"></i> 1° Lugar: ${premio1}</div>`);
        if (premio2) premios.push(`<div class="premio-item premio-2"><i class="fas fa-medal"></i> 2° Lugar: ${premio2}</div>`);
        if (premio3) premios.push(`<div class="premio-item premio-3"><i class="fas fa-medal"></i> 3° Lugar: ${premio3}</div>`);
        
        return premios.length > 0 ? premios.join('') : 
            '<div class="sin-premios"><i class="fas fa-trophy"></i> Premios por anunciar</div>';
    }

    formatearModalidad(modalidad) {
        const modalidades = {
            'eliminacion_simple': 'Eliminación Simple',
            'eliminacion_doble': 'Eliminación Doble',
            'todos_contra_todos': 'Todos contra Todos',
            'grupos_eliminatoria': 'Grupos + Eliminatoria'
        };
        return modalidades[modalidad] || modalidad;
    }

    // ✅ FUNCIÓN PARA MOSTRAR MODAL
    mostrarModalDetalles(contenido, esLoading = false) {
        // ✅ CREAR MODAL SI NO EXISTE
        let modal = document.getElementById('modalDetalesTorneo');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modalDetalesTorneo';
            modal.className = 'modal-torneo-detalles';
            modal.innerHTML = `
                <div class="modal-torneo-content">
                    <div class="modal-torneo-header">
                        <h3>Detalles del Torneo</h3>
                        <button class="modal-close" onclick="torneosManager.cerrarModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-torneo-body">
                        <div id="modalDetallesContenido"></div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        
        // ✅ ACTUALIZAR CONTENIDO
        const contenidoDiv = document.getElementById('modalDetallesContenido');
        if (esLoading) {
            contenidoDiv.innerHTML = `
                <div class="loading-detalles">
                    <div class="spinner"></div>
                    <p>${contenido}</p>
                </div>
            `;
        } else {
            contenidoDiv.innerHTML = contenido;
        }
        
        // ✅ MOSTRAR MODAL
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    // ✅ FUNCIÓN PARA CERRAR MODAL
    cerrarModal() {
        const modal = document.getElementById('modalDetalesTorneo');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    mostrarError(mensaje) {
        const container = document.getElementById('torneosContainer');
        container.innerHTML = `
            <div class="sin-torneos">
                <i class="fas fa-exclamation-triangle" style="color: #dc3545;"></i>
                <h4>Error</h4>
                <p>${mensaje}</p>
                <button class="btn btn-primary" onclick="torneosManager.cargarTorneos()">
                    <i class="fas fa-redo"></i> Reintentar
                </button>
            </div>
        `;
    }

    // ✅ AGREGAR ESTAS FUNCIONES AL FINAL DE torneos.js

    // FUNCIÓN PARA MOSTRAR MENSAJES
    mostrarMensaje(mensaje, tipo = 'info') {
        const alert = document.createElement('div');
        alert.className = `alert alert-${tipo} alert-dismissible`;
        alert.innerHTML = `
            <div class="alert-content">
                <span>${mensaje}</span>
                <button class="alert-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // ✅ AGREGAR AL INICIO DE LA PÁGINA
        const container = document.querySelector('.container') || document.body;
        container.insertBefore(alert, container.firstChild);
        
        // ✅ AUTO-REMOVER DESPUÉS DE 5 SEGUNDOS
        setTimeout(() => {
            if (alert.parentElement) {
                alert.remove();
            }
        }, 5000);
    }

    // FUNCIÓN PARA ACTUALIZAR LISTA DE TORNEOS
    actualizarListaTorneos() {
        // ✅ RECARGAR LA PÁGINA PARA MOSTRAR CAMBIOS
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    }

    // FUNCIÓN PARA OBTENER ÍCONO DEL DEPORTE
    obtenerIconoDeporte(deporte) {
        const iconos = {
            'Fútbol': 'futbol',
            'Básquet': 'basketball-ball',
            'Vóley': 'volleyball-ball',
            'Tenis': 'table-tennis',
            'Padel': 'table-tennis'
        };
        return iconos[deporte] || 'trophy';
    }

    // FUNCIÓN PARA GENERAR ESTRELLAS
    generarEstrellas(calificacion) {
        const estrellas = [];
        for (let i = 1; i <= 5; i++) {
            if (i <= calificacion) {
                estrellas.push('<i class="fas fa-star"></i>');
            } else {
                estrellas.push('<i class="far fa-star"></i>');
            }
        }
        return estrellas.join('');
    }

    // ✅ AGREGAR AL FINAL DE torneos.js

    // MOSTRAR MODAL DE INSCRIPCIÓN
    async mostrarInscripcion(torneoId) {
        try {
            // ✅ MOSTRAR LOADING
            this.mostrarModalInscripcion('Cargando equipos disponibles...', true);
            
            // ✅ OBTENER EQUIPOS DEL USUARIO
            const response = await fetch(`${this.baseUrl}?action=obtener_equipos_inscripcion&torneo_id=${torneoId}`);
            const data = await response.json();
            
            if (data.success) {
                if (data.equipos.length === 0) {
                    this.mostrarError('No tienes equipos disponibles para inscribir en este torneo');
                    return;
                }
                this.mostrarFormularioInscripcion(data.torneo, data.equipos);
            } else {
                this.mostrarError('Error: ' + data.message);
            }
            
        } catch (error) {
            console.error('Error:', error);
            this.mostrarError('Error cargando equipos para inscripción');
        }
    }

    // MOSTRAR FORMULARIO DE INSCRIPCIÓN
    mostrarFormularioInscripcion(torneo, equipos) {
        const costoInscripcion = parseFloat(torneo.costo_inscripcion);
        const esGratis = costoInscripcion === 0;
        
        // ✅ OPCIONES DE EQUIPOS
        const equiposOptions = equipos.map(equipo => `
            <div class="equipo-option" data-equipo-id="${equipo.id}">
                <div class="equipo-info">
                    <h4>${equipo.nombre}</h4>
                    <p>Deporte: ${equipo.deporte_nombre}</p>
                    <p>Miembros: ${equipo.total_miembros}</p>
                    <p>Líder: ${equipo.lider_nombre} ${equipo.lider_apellidos}</p>
                </div>
                <input type="radio" name="equipo_seleccionado" value="${equipo.id}" required>
            </div>
        `).join('');
        
        // ✅ MÉTODOS DE PAGO CORREGIDOS
        const metodosPagoHtml = esGratis ? `
            <div class="inscripcion-gratis">
                <i class="fas fa-gift"></i>
                <h3>¡Inscripción GRATUITA!</h3>
                <p>Este torneo no tiene costo de inscripción</p>
            </div>
        ` : `
            <div class="costo-inscripcion">
                <h3>Costo de Inscripción: S/. ${costoInscripcion.toFixed(2)}</h3>
            </div>
            
            <div class="metodos-pago">
                <h4>Selecciona tu método de pago:</h4>
                <div class="pago-opciones">
                    <label class="pago-option">
                        <input type="radio" name="metodo_pago" value="culqi" required>
                        <div class="pago-card">
                            <i class="fas fa-credit-card"></i>
                            <span>Tarjeta de Crédito/Débito</span>
                            <small>Visa, Mastercard (Culqi)</small>
                        </div>
                    </label>
                    
                    <label class="pago-option">
                        <input type="radio" name="metodo_pago" value="paypal" required>
                        <div class="pago-card">
                            <i class="fab fa-paypal"></i>
                            <span>PayPal</span>
                            <small>Pago seguro internacional</small>
                        </div>
                    </label>
                </div>
            </div>
        `;
        
        const contenidoModal = `
            <div class="inscripcion-modal">
                <div class="inscripcion-header">
                    <h2>Inscribir Equipo al Torneo</h2>
                    <h3>${torneo.nombre}</h3>
                </div>
                
                <form id="formInscripcionEquipo">
                    <div class="seccion-equipos">
                        <h4>Selecciona tu equipo:</h4>
                        <div class="equipos-lista">
                            ${equiposOptions}
                        </div>
                    </div>
                    
                    ${metodosPagoHtml}
                    
                    <div class="inscripcion-acciones">
                        ${esGratis ? `
                            <button type="submit" class="btn btn-success btn-inscribir-gratis">
                                <i class="fas fa-user-plus"></i> Inscribir Equipo GRATIS
                            </button>
                        ` : `
                            <button type="submit" class="btn btn-primary btn-procesar-pago">
                                <i class="fas fa-credit-card"></i> Procesar Pago e Inscribir
                            </button>
                        `}
                        
                        <button type="button" class="btn btn-secondary" onclick="torneosManager.cerrarModalInscripcion()">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        this.mostrarModalInscripcion(contenidoModal, false);
        
        // ✅ CONFIGURAR EVENTOS
        this.configurarEventosInscripcion(torneo, esGratis);
    }

    // CONFIGURAR EVENTOS DEL FORMULARIO
    configurarEventosInscripcion(torneo, esGratis) {
        const form = document.getElementById('formInscripcionEquipo');
        
        // ✅ EVENTO SUBMIT DEL FORMULARIO
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const equipoId = document.querySelector('input[name="equipo_seleccionado"]:checked')?.value;
            if (!equipoId) {
                this.mostrarError('Selecciona un equipo');
                return;
            }
            
            if (esGratis) {
                // ✅ INSCRIPCIÓN GRATUITA
                this.procesarInscripcionGratuita(torneo.id, equipoId);
            } else {
                // ✅ INSCRIPCIÓN CON PAGO
                const metodoPago = document.querySelector('input[name="metodo_pago"]:checked')?.value;
                if (!metodoPago) {
                    this.mostrarError('Selecciona un método de pago');
                    return;
                }
                
                this.procesarInscripcionConPago(torneo, equipoId, metodoPago);
            }
        });
        
        // ✅ EVENTO SELECCIÓN DE EQUIPO
        document.querySelectorAll('.equipo-option').forEach(option => {
            option.addEventListener('click', () => {
                const radio = option.querySelector('input[type="radio"]');
                radio.checked = true;
                
                // ✅ VISUAL FEEDBACK
                document.querySelectorAll('.equipo-option').forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
            });
        });
    }

    // PROCESAR INSCRIPCIÓN GRATUITA
    async procesarInscripcionGratuita(torneoId, equipoId) {
        try {
            this.mostrarLoadingInscripcion('Inscribiendo equipo...');
            
            const response = await fetch(`${this.baseUrl}?action=inscribir_equipo_culqi`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    torneo_id: torneoId,
                    equipo_id: equipoId,
                    culqi_token_id: 'GRATIS',
                    monto: 0
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.mostrarExitoInscripcion('¡Equipo inscrito exitosamente!');
                this.actualizarListaTorneos(); // Refrescar lista
            } else {
                this.mostrarError('Error: ' + data.message);
            }
            
        } catch (error) {
            console.error('Error:', error);
            this.mostrarError('Error procesando inscripción gratuita');
        }
    }

    // PROCESAR INSCRIPCIÓN CON PAGO (CORREGIR DATOS)
    async procesarInscripcionConPago(torneo, equipoId, metodoPago) {
        const montoPesos = parseFloat(torneo.costo_inscripcion);
        
        // ✅ CORREGIR: Usar nombres correctos para los campos
        const datosInscripcion = {
            usuario_id: 1, // ✅ OBTENER DEL SESSION
            instalacion_id: 1, // ✅ USAR ID DE INSTALACIÓN REAL
            torneo_id: torneo.id,
            equipo_id: equipoId,
            torneo_nombre: torneo.nombre,
            // ✅ CORREGIR: Usar 'monto' en lugar de 'costo_inscripcion' para coherencia
            monto: montoPesos,
            costo_inscripcion: montoPesos, // Mantener ambos por compatibilidad
            description: `Inscripción al torneo: ${torneo.nombre}`
        };
        
        console.log('🏆 Datos enviados para pago:', datosInscripcion);
        
        if (metodoPago === 'culqi') {
            this.procesarPagoCulqi(datosInscripcion);
        } else if (metodoPago === 'paypal') {
            this.procesarPagoPayPal(datosInscripcion);
        }
    }

    // PROCESAR PAGO CON CULQI
    procesarPagoCulqi(datosInscripcion) {
        console.log('🏆 Procesando pago Culqi para torneo:', datosInscripcion);
        
        if (typeof window.culqiIntegration === 'undefined') {
            this.mostrarError('Sistema de pagos Culqi no disponible');
            return;
        }
        
        this.cerrarModalInscripcion();
        
        // ✅ USAR LÓGICA IDÉNTICA A RESERVAS
        window.culqiIntegration.procesarPagoTorneo(datosInscripcion, async (token) => {
            try {
                console.log('✅ Token Culqi recibido para torneo:', token);
                
                const response = await fetch(`${this.baseUrl}?action=inscribir_equipo_culqi`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...datosInscripcion,
                        culqi_token_id: token.id
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    this.mostrarExitoInscripcion('¡Equipo inscrito y pago procesado exitosamente con Culqi!');
                    this.actualizarListaTorneos();
                } else {
                    this.mostrarError('Error: ' + data.message);
                }
                
            } catch (error) {
                console.error('Error:', error);
                this.mostrarError('Error procesando pago con Culqi');
            }
        });
    }

    // PROCESAR PAGO CON PAYPAL
    procesarPagoPayPal(datosInscripcion) {
        console.log('🏆 Procesando pago PayPal para torneo:', datosInscripcion);
        
        if (typeof window.paypalIntegration === 'undefined') {
            this.mostrarError('Sistema de pagos PayPal no disponible');
            return;
        }
        
        this.cerrarModalInscripcion();
        
        // ✅ USAR LÓGICA IDÉNTICA A RESERVAS
        window.paypalIntegration.iniciarPagoTorneo(datosInscripcion, async (paymentId, payerId) => {
            try {
                console.log('✅ Pago PayPal exitoso para torneo:', { paymentId, payerId });
                
                const response = await fetch(`${this.baseUrl}?action=inscribir_equipo_paypal`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...datosInscripcion,
                        paypal_payment_id: paymentId,
                        paypal_payer_id: payerId
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    this.mostrarExitoInscripcion('¡Equipo inscrito y pago procesado exitosamente con PayPal!');
                    this.actualizarListaTorneos();
                } else {
                    this.mostrarError('Error: ' + data.message);
                }
                
            } catch (error) {
                console.error('Error:', error);
                this.mostrarError('Error procesando pago con PayPal');
            }
        });
    }

    // FUNCIONES AUXILIARES DE MODAL
    mostrarModalInscripcion(contenido, esLoading = false) {
        let modal = document.getElementById('modalInscripcionTorneo');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modalInscripcionTorneo';
            modal.className = 'modal-inscripcion-torneo';
            modal.innerHTML = `
                <div class="modal-inscripcion-content">
                    <div class="modal-inscripcion-body">
                        <div id="modalInscripcionContenido"></div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        
        const contenidoDiv = document.getElementById('modalInscripcionContenido');
        if (esLoading) {
            contenidoDiv.innerHTML = `
                <div class="loading-inscripcion">
                    <div class="spinner"></div>
                    <p>${contenido}</p>
                </div>
            `;
        } else {
            contenidoDiv.innerHTML = contenido;
        }
        
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    cerrarModalInscripcion() {
        const modal = document.getElementById('modalInscripcionTorneo');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    mostrarLoadingInscripcion(mensaje) {
        const contenidoDiv = document.getElementById('modalInscripcionContenido');
        if (contenidoDiv) {
            contenidoDiv.innerHTML = `
                <div class="loading-inscripcion">
                    <div class="spinner"></div>
                    <p>${mensaje}</p>
                </div>
            `;
        }
    }

    mostrarExitoInscripcion(mensaje) {
        this.cerrarModalInscripcion();
        this.mostrarMensaje(mensaje, 'success');
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Solo inicializar si no está deshabilitado el chat
    if (!window.chatDisabled) {
        window.torneosManager = new TorneosManager();
    } else {
        // Si chat está deshabilitado, solo inicializar torneos
        window.torneosManager = new TorneosManager();
    }
});
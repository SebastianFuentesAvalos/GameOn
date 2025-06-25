// filepath: c:\xampp\htdocs\GameOn_Network\Public\js\culqi_integration.js

// Debug para verificar Culqi
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 Verificando Culqi...');
    console.log('🔍 window.Culqi disponible:', typeof window.Culqi);
    console.log('🔍 Culqi object:', window.Culqi);
    
    if (window.Culqi) {
        console.log('✅ Culqi cargado correctamente');
        console.log('✅ Versión:', window.Culqi.version || 'Desconocida');
    } else {
        console.error('❌ Culqi no está disponible');
    }
});

class CulqiIntegration {
    constructor() {
        this.publicKey = null;
        this.token = null;
        this.order = null;
        this.culqiInitialized = false;
        this.simulationMode = false; // ✅ DESACTIVAR SIMULACIÓN - USAR INTERFAZ REAL
    }

    // ✅ CARGAR CONFIGURACIÓN CON FALLBACKS AUTOMÁTICOS
    async loadCulqiConfig(instalacionId) {
        try {
            console.log('📡 Cargando configuración Culqi para instalación:', instalacionId);
            
            const response = await fetch('../../Controllers/CulqiController.php?action=get_config&instalacion_id=' + instalacionId);
            const data = await response.json();
            
            if (data.success && data.public_key) {
                this.publicKey = data.public_key;
                console.log('✅ Configuración cargada:', this.publicKey);
                this.initializeCulqi();
                return true;
            } else {
                console.warn('⚠️ No se encontró configuración específica, usando configuración por defecto');
                
                // ✅ FALLBACK: Usar tu clave pública directamente
                this.publicKey = 'pk_test_ZQA3KYUMAvDhDXJT'; // Tu clave de prueba
                this.initializeCulqi();
                return true;
            }
        } catch (error) {
            console.warn('⚠️ Error cargando configuración, usando fallback:', error);
            
            // ✅ FALLBACK FINAL: Usar clave hardcodeada
            this.publicKey = 'pk_test_ZQA3KYUMAvDhDXJT';
            this.initializeCulqi();
            return true;
        }
    }

    // ✅ INICIALIZAR CULQI CON LA INTERFAZ REAL
    initializeCulqi() {
        if (!window.Culqi) {
            console.error('❌ Culqi no está cargado');
            return;
        }

        window.Culqi.publicKey = this.publicKey;
        
        window.Culqi.options({
            lang: 'es',
            modal: true,
            installments: false,
            style: {
                logo: 'https://i.ibb.co/dJG8hdzS/images.png',
                maincolor: '#1ec98c',
                auxcolor: '#00bcd4',
                buttontext: '#ffffff',
                maintext: '#333333',
                auxtext: '#666666'
            }
        });
        
        this.culqiInitialized = true;
        console.log('✅ Culqi v4 inicializado con public key:', this.publicKey);
    }

    // ✅ CREAR ORDEN DE PAGO
    async createOrder(reservaData) {
        try {
            console.log('📤 Creando orden de pago:', reservaData);
            
            const response = await fetch('../../Controllers/CulqiController.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'create_order',
                    ...reservaData
                })
            });
            
            const data = await response.json();
            console.log('📨 Respuesta crear orden:', data);
            
            if (data.success) {
                this.order = data.order;
                console.log('✅ Orden creada:', data.order);
                return data.order;
            } else {
                throw new Error(data.message || 'Error al crear orden');
            }
        } catch (error) {
            console.error('❌ Error creando orden:', error);
            throw error;
        }
    }

    // ✅ MÉTODO PRINCIPAL PARA PROCESAR PAGO COMPLETO
    async procesarPagoCompleto(reservaData) {
        try {
            console.log('🚀 Iniciando proceso de pago completo:', reservaData);
            
            // ✅ CARGAR CONFIGURACIÓN REAL
            const configLoaded = await this.loadCulqiConfig(reservaData.instalacion_id);
            if (!configLoaded) {
                throw new Error('No se pudo cargar la configuración de pagos');
            }

            // ✅ CREAR ORDEN
            const order = await this.createOrder(reservaData);

            // ✅ CONFIGURAR CALLBACKS DE CULQI
            window.culqi = () => {
                console.log('✅ Callback Culqi ejecutado');
                
                if (window.Culqi.token && window.Culqi.token.id) {
                    console.log('✅ Token obtenido:', window.Culqi.token.id);
                    
                    this.showLoadingMessage('Procesando pago...');
                    
                    // ✅ PROCESAR PAGO CON EL TOKEN
                    this.processPayment(window.Culqi.token.id, order)
                        .then(paymentResult => {
                            if (paymentResult.success) {
                                this.showLoadingMessage('Creando reserva...');
                                return this.createReservation(reservaData, paymentResult.charge_id);
                            } else {
                                throw new Error(paymentResult.message);
                            }
                        })
                        .then(reservaResult => {
                            if (reservaResult.success) {
                                this.showSuccessMessage(reservaResult.reserva_id);
                            } else {
                                throw new Error(reservaResult.message);
                            }
                        })
                        .catch(error => {
                            console.error('❌ Error en el proceso:', error);
                            this.showErrorMessage('Error en el proceso de pago: ' + error.message);
                        });
                } else {
                    console.error('❌ No se pudo obtener el token de Culqi');
                    this.showErrorMessage('No se pudo obtener el token de pago');
                }
            };

            // ✅ CALLBACK DE ERROR
            window.culqi_error = (error) => {
                console.error('❌ Error Culqi v4:', error);
                this.showErrorMessage('Error en el formulario de pago: ' + JSON.stringify(error));
            };

            // ✅ ABRIR MODAL DE PAGO DE CULQI
            this.openPaymentModal(order);

        } catch (error) {
            console.error('❌ Error iniciando el pago:', error);
            this.showErrorMessage('Error iniciando el pago: ' + error.message);
        }
    }

    // ✅ ABRIR MODAL DE PAGO CON INTERFAZ DE CULQI
    openPaymentModal(orderData) {
        if (!this.culqiInitialized) {
            throw new Error('Culqi no está inicializado');
        }

        const settings = {
            title: 'GameOn Network',
            currency: 'PEN',
            description: orderData.description,
            amount: Math.round(orderData.amount * 100), // Culqi requiere centavos
            style: {
                logo: 'https://i.ibb.co/dJG8hdzS/images.png',
                maincolor: '#1ec98c',
                auxcolor: '#00bcd4',
                buttontext: '#ffffff',
                maintext: '#333333',
                auxtext: '#666666'
            },
            client: {
                email: 'test@gameon.com'
            }
        };

        console.log('✅ Abriendo modal Culqi con configuración:', settings);
        window.Culqi.settings(settings);
        window.Culqi.open();
    }

    // ✅ PROCESAR PAGO CON TOKEN
    async processPayment(token, orderData) {
        try {
            console.log('💳 Procesando pago con token:', token);
            
            const response = await fetch('../../Controllers/CulqiController.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'process_payment',
                    token: token,
                    order_id: orderData.order_id,
                    amount: orderData.amount,
                    currency: 'PEN',
                    description: orderData.description
                })
            });
            
            const data = await response.json();
            console.log('✅ Respuesta del pago:', data);
            return data;
        } catch (error) {
            console.error('❌ Error procesando pago:', error);
            throw error;
        }
    }

    // ✅ CREAR RESERVA DESPUÉS DEL PAGO
    async createReservation(reservaData, chargeId) {
        try {
            console.log('📝 Creando reserva con charge_id:', chargeId);
            
            const response = await fetch('../../Controllers/ReservaController.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'create_reservation',
                    ...reservaData,
                    culqi_charge_id: chargeId,
                    estado: 'confirmada'
                })
            });
            
            const data = await response.json();
            console.log('✅ Respuesta creación reserva:', data);
            return data;
        } catch (error) {
            console.error('❌ Error creando reserva:', error);
            throw error;
        }
    }

    // ✅ PROCESAR PAGO PARA TORNEOS
    async procesarPagoTorneo(datosInscripcion, onSuccessCallback) {
        try {
            console.log('🏆 Iniciando pago Culqi para torneo:', datosInscripcion);
            
            // ✅ CARGAR CONFIGURACIÓN REAL
            const configLoaded = await this.loadCulqiConfig(datosInscripcion.instalacion_id || 1);
            if (!configLoaded) {
                throw new Error('No se pudo cargar la configuración de pagos');
            }

            // ✅ CONFIGURAR CALLBACKS PARA TORNEO
            window.culqi = () => {
                console.log('✅ Callback Culqi ejecutado para torneo');
                
                if (window.Culqi.token && window.Culqi.token.id) {
                    console.log('✅ Token obtenido para torneo:', window.Culqi.token.id);
                    onSuccessCallback(window.Culqi.token);
                } else {
                    console.error('❌ No se pudo obtener el token para torneo');
                    this.showErrorMessage('No se pudo obtener el token de pago');
                }
            };

            window.culqi_error = (error) => {
                console.error('❌ Error Culqi en torneo:', error);
                this.showErrorMessage('Error en el formulario de pago');
            };

            // ✅ CORREGIR CONFIGURACIÓN DEL MODAL PARA TORNEO
            const montoPesos = parseFloat(datosInscripcion.monto || datosInscripcion.costo_inscripcion || 0);
            
            if (montoPesos <= 0) {
                throw new Error('Monto de inscripción no válido');
            }

            const settings = {
                title: 'Inscripción a Torneo - GameOn',
                currency: 'PEN',
                description: `Inscripción a torneo: ${datosInscripcion.torneo_nombre}`,
                // ✅ CORREGIR: Convertir a centavos y asegurar que sea entero
                amount: Math.round(montoPesos * 100),
                style: {
                    logo: 'https://i.ibb.co/dJG8hdzS/images.png',
                    maincolor: '#1ec98c',
                    auxcolor: '#00bcd4',
                    buttontext: '#ffffff'
                },
                client: {
                    email: 'test@gameon.com'
                }
            };

            console.log('✅ Configuración Culqi para torneo:', settings);
            console.log('✅ Monto original:', montoPesos, 'Centavos:', settings.amount);

            // ✅ VERIFICAR QUE CULQI ESTÉ INICIALIZADO
            if (!this.culqiInitialized) {
                throw new Error('Culqi no está inicializado');
            }

            // ✅ ABRIR MODAL
            window.Culqi.settings(settings);
            window.Culqi.open();
            
        } catch (error) {
            console.error('❌ Error iniciando pago del torneo:', error);
            this.showErrorMessage('Error iniciando el pago del torneo: ' + error.message);
        }
    }

    // ✅ MENSAJES DE ESTADO
    showLoadingMessage(message) {
        const loadingHtml = `
            <div class="payment-loading" style="text-align: center; padding: 20px;">
                <div class="spinner" style="width: 50px; height: 50px; border: 5px solid #f3f3f3; border-top: 5px solid #1ec98c; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                <h3 style="color: #1ec98c; margin-bottom: 15px;">${message}</h3>
                <p style="color: #6c757d;">Por favor espera...</p>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        this.showModal('Procesando', loadingHtml);
    }

    showSuccessMessage(reservaId) {
        const message = `
            <div class="payment-success" style="text-align: center; padding: 20px;">
                <i class="fas fa-check-circle" style="color: #28a745; font-size: 3rem; margin-bottom: 15px;"></i>
                <h3 style="color: #28a745; margin-bottom: 15px;">¡Pago exitoso!</h3>
                <p style="margin-bottom: 10px;">Tu reserva ha sido confirmada.</p>
                <p style="margin-bottom: 20px;"><strong>ID de Reserva:</strong> ${reservaId}</p>
                <button onclick="window.location.href='dashboard.php'" class="btn btn-primary" style="padding: 12px 24px; background: #1ec98c; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Ir al Dashboard
                </button>
            </div>
        `;
        this.showModal('Reserva Confirmada', message);
    }

    showErrorMessage(message) {
        const errorHtml = `
            <div class="payment-error" style="text-align: center; padding: 20px;">
                <i class="fas fa-exclamation-circle" style="color: #dc3545; font-size: 3rem; margin-bottom: 15px;"></i>
                <h3 style="color: #dc3545; margin-bottom: 15px;">Error en el pago</h3>
                <p style="margin-bottom: 20px;">${message}</p>
                <button onclick="document.getElementById('modalConfirmarReserva').style.display='none'" class="btn btn-secondary" style="padding: 12px 24px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Cerrar
                </button>
            </div>
        `;
        this.showModal('Error', errorHtml);
    }

    showModal(title, content) {
        const modal = document.getElementById('modalConfirmarReserva');
        if (modal) {
            const titleElement = modal.querySelector('h3');
            const contentElement = modal.querySelector('#modalReservaTexto');
            
            if (titleElement) titleElement.textContent = title;
            if (contentElement) contentElement.innerHTML = content;
            
            modal.style.display = 'flex';
        } else {
            // Crear modal si no existe
            const modalHtml = `
                <div id="culqiModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 10000;">
                    <div style="background: white; padding: 30px; border-radius: 10px; max-width: 500px; width: 90%; max-height: 90%; overflow-y: auto;">
                        <h3>${title}</h3>
                        ${content}
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        }
    }
}

// ✅ INSTANCIA GLOBAL
window.culqiIntegration = new CulqiIntegration();

console.log('✅ CulqiIntegration cargado - Modo interfaz REAL de Culqi');
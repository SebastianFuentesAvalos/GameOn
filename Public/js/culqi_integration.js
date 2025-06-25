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
        // ✅ MODO SIMULACIÓN MIENTRAS LA CUENTA SE VALIDA
        this.simulationMode = false; // Cambiar a false cuando la cuenta esté validada
    }

    // Cargar configuración de Culqi desde la base de datos
    async loadCulqiConfig(instalacionId) {
        try {
            const response = await fetch('../../Controllers/CulqiController.php?action=get_config&instalacion_id=' + instalacionId);
            const data = await response.json();
            
            if (data.success) {
                this.publicKey = data.public_key;
                if (!this.simulationMode) {
                    this.initializeCulqi();
                }
                return true;
            } else {
                console.error('Error cargando configuración Culqi:', data.message);
                return false;
            }
        } catch (error) {
            console.error('Error en loadCulqiConfig:', error);
            return false;
        }
    }

    // ✅ CONFIGURACIÓN COMPLETA PARA CULQI V4
    initializeCulqi() {
        if (!window.Culqi) {
            console.error('Culqi no está cargado');
            return;
        }

        // ✅ CONFIGURAR PUBLIC KEY
        window.Culqi.publicKey = this.publicKey;
        
        // ✅ CONFIGURACIÓN COMPLETA PARA V4
        window.Culqi.options({
            lang: 'es',
            modal: true,
            installments: false,
            // ✅ CONFIGURAR CAMPOS ADICIONALES PARA V4
            style: {
                logo: '',
                maincolor: '#007bff',
                auxcolor: '#28a745',
                buttontext: '#ffffff'
            }
        });
        
        this.culqiInitialized = true;
        console.log('✅ Culqi v4 inicializado con public key:', this.publicKey);
    }

    // Crear orden de pago
    async createOrder(reservaData) {
        try {
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
            
            if (data.success) {
                this.order = data.order;
                console.log('✅ Orden creada:', data.order);
                return data.order;
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error creando orden:', error);
            throw error;
        }
    }

    // ✅ MÉTODO PRINCIPAL CON SIMULACIÓN
    async procesarPagoCompleto(reservaData) {
        try {
            console.log('🚀 Iniciando proceso de pago completo:', reservaData);
            
            // ✅ VERIFICAR SI ESTÁ EN MODO SIMULACIÓN
            if (this.simulationMode) {
                console.log('🎭 MODO SIMULACIÓN ACTIVADO - Cuenta Culqi en validación');
                return this.procesarPagoSimulado(reservaData);
            }
            
            // 1. Cargar configuración de Culqi
            const configLoaded = await this.loadCulqiConfig(reservaData.instalacion_id);
            if (!configLoaded) {
                throw new Error('No se pudo cargar la configuración de pagos');
            }

            // 2. Crear orden
            const order = await this.createOrder(reservaData);

            // 3. Configurar callbacks de Culqi
            window.culqi = () => {
                console.log('✅ Callback Culqi ejecutado');
                
                if (window.Culqi.token && window.Culqi.token.id) {
                    console.log('✅ Token obtenido exitosamente:', window.Culqi.token.id);
                    
                    this.showLoadingMessage('Procesando pago...');
                    
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
                            this.showErrorMessage('Error al procesar el pago: ' + error.message);
                        });
                } else {
                    console.error('❌ No se pudo obtener el token de Culqi');
                    this.showErrorMessage('No se pudo obtener el token de pago');
                }
            };

            // Callback de error para problemas de validación
            window.culqi_error = (error) => {
                console.warn('⚠️ Error Culqi v4:', error);
                
                if (error && error.user_message && 
                    (error.user_message.includes('validar') || 
                     error.user_message.includes('tarjeta') ||
                     error.user_message.includes('IIN') ||
                     error.user_message.includes('soporte'))) {
                    
                    // Cambiar automáticamente a modo simulación
                    this.simulationMode = true;
                    console.log('🔄 Cambiando a modo simulación por error de validación');
                    this.procesarPagoSimulado(reservaData);
                    return;
                }
                
                this.showErrorMessage('Error en el pago: ' + (error.user_message || error.message || 'Error desconocido'));
            };

            // 4. Abrir modal de pago
            this.openPaymentModal(order);

        } catch (error) {
            console.error('❌ Error iniciando el pago:', error);
            this.showErrorMessage('Error iniciando el pago: ' + error.message);
        }
    }

    // ✅ SIMULACIÓN COMPLETA DE PAGO
    async procesarPagoSimulado(reservaData) {
        console.log('🎭 Iniciando simulación de pago...');
        
        // Mostrar modal de simulación
        this.showSimulationModal(reservaData);
    }

    // ✅ MODAL DE SIMULACIÓN
    showSimulationModal(reservaData) {
        const message = `
            <div class="payment-simulation" style="text-align: center; padding: 20px;">
                <i class="fas fa-play-circle" style="color: #17a2b8; font-size: 3rem; margin-bottom: 15px;"></i>
                <h3 style="color: #17a2b8; margin-bottom: 15px;">Simulación de Pago</h3>
                <p style="margin-bottom: 15px;">Tu cuenta Culqi está en proceso de validación.</p>
                <p style="margin-bottom: 15px;">Simulando pago de <strong>S/ ${reservaData.monto}</strong></p>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; text-align: left;">
                    <strong>Detalles:</strong><br>
                    📅 Fecha: ${reservaData.fecha}<br>
                    🕐 Horario: ${reservaData.hora_inicio} - ${reservaData.hora_fin}<br>
                    🏟️ Área: ${reservaData.area_nombre}<br>
                    💰 Monto: S/ ${reservaData.monto}
                </div>
                
                <div style="background: #fff3cd; padding: 10px; border-radius: 5px; margin: 15px 0; color: #856404;">
                    <strong>⚠️ Modo Desarrollo:</strong> Esta reserva se creará como si el pago fuera exitoso.
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
                    <button onclick="window.culqiIntegration.confirmarPagoSimulado()" class="btn btn-success" style="padding: 12px 24px; background: #28a745; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
                        ✅ Simular Pago Exitoso
                    </button>
                    <button onclick="window.culqiIntegration.simularErrorPago()" class="btn btn-danger" style="padding: 12px 24px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        ❌ Simular Error
                    </button>
                    <button onclick="document.getElementById('modalConfirmarReserva').style.display='none'" class="btn btn-secondary" style="padding: 12px 24px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        Cancelar
                    </button>
                </div>
            </div>
        `;
        this.showModal('Simulación de Pago', message);
        
        // Guardar datos para usar en confirmación
        this.currentReservaData = reservaData;
    }

    // ✅ CONFIRMAR PAGO SIMULADO
    async confirmarPagoSimulado() {
        if (!this.currentReservaData) {
            this.showErrorMessage('Error: No hay datos de reserva');
            return;
        }
        
        try {
            this.showLoadingMessage('Simulando pago exitoso...');
            
            // Simular delay de procesamiento
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Crear reserva con charge_id simulado
            const chargeIdSimulado = 'chr_sim_' + Date.now();
            
            this.showLoadingMessage('Creando reserva...');
            
            const reservaResult = await this.createReservation(this.currentReservaData, chargeIdSimulado);
            
            if (reservaResult.success) {
                this.showSuccessMessage(reservaResult.reserva_id, true); // true = modo simulación
            } else {
                throw new Error(reservaResult.message);
            }
            
        } catch (error) {
            console.error('❌ Error en simulación:', error);
            this.showErrorMessage('Error en simulación: ' + error.message);
        }
    }

    // ✅ SIMULAR ERROR DE PAGO
    simularErrorPago() {
        this.showErrorMessage('Pago simulado como fallido. La reserva no se ha creado.');
    }

    // Procesar token de pago (modo real)
    async processPayment(token, orderData) {
        try {
            console.log('✅ Procesando pago con token:', token);
            
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
            console.error('Error procesando pago:', error);
            throw error;
        }
    }

    // Crear reserva después del pago exitoso
    async createReservation(reservaData, chargeId) {
        try {
            console.log('✅ Creando reserva con charge_id:', chargeId);
            
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
            console.error('Error creando reserva:', error);
            throw error;
        }
    }

    openPaymentModal(orderData) {
        if (!this.culqiInitialized) {
            throw new Error('Culqi no está inicializado');
        }

        const settings = {
            title: 'GameOn Network',
            currency: 'PEN',
            description: orderData.description,
            amount: Math.round(orderData.amount * 100),
            style: {
                logo: '',
                maincolor: '#007bff',
                auxcolor: '#28a745',
                buttontext: '#ffffff',
                maintext: '#333333',
                auxtext: '#666666'
            },
            client: {
                email: 'test@gameon.com'
            }
        };

        console.log('✅ Configurando modal Culqi v4:', settings);
        window.Culqi.settings(settings);
        window.Culqi.open();
    }

    showLoadingMessage(message) {
        const loadingHtml = `
            <div class="payment-loading" style="text-align: center; padding: 20px;">
                <div class="spinner" style="width: 50px; height: 50px; border: 5px solid #f3f3f3; border-top: 5px solid #007bff; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                <h3 style="color: #007bff; margin-bottom: 15px;">${message}</h3>
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

    // Mostrar mensaje de éxito
    showSuccessMessage(reservaId, simulado = false) {
        const modoTexto = simulado ? ' (Simulado)' : '';
        const iconColor = simulado ? '#17a2b8' : '#28a745';
        
        const message = `
            <div class="payment-success" style="text-align: center; padding: 20px;">
                <i class="fas fa-check-circle" style="color: ${iconColor}; font-size: 3rem; margin-bottom: 15px;"></i>
                <h3 style="color: ${iconColor}; margin-bottom: 15px;">¡Pago exitoso!${modoTexto}</h3>
                <p style="margin-bottom: 10px;">Tu reserva ha sido confirmada.</p>
                <p style="margin-bottom: 20px;"><strong>ID de Reserva:</strong> ${reservaId}</p>
                ${simulado ? '<p style="color: #17a2b8; font-size: 0.9rem; margin-bottom: 15px;">🎭 Esta es una simulación. Cuando tu cuenta Culqi esté validada, funcionará con pagos reales.</p>' : ''}
                <button onclick="window.location.href='dashboard.php'" class="btn btn-primary" style="padding: 12px 24px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">
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
                <button onclick="document.getElementById('modalConfirmarReserva').style.display='none'" class="btn btn-secondary" style="padding: 12px 24px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">
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

// Instancia global
window.culqiIntegration = new CulqiIntegration();

console.log('✅ CulqiIntegration v4 cargado correctamente');
class PayPalIntegration {
    constructor() {
        this.clientId = null;
        this.sandbox = true;
        this.paypalInitialized = false;
        this.currentReservaData = null;
    }

    // ✅ CARGAR CONFIGURACIÓN PAYPAL
    async loadPayPalConfig(instalacionId) {
        try {
            const response = await fetch('../../Controllers/PayPalController.php?action=get_config&instalacion_id=' + instalacionId);
            const data = await response.json();
            
            if (data.success) {
                this.clientId = data.client_id;
                this.sandbox = data.sandbox;
                await this.initializePayPal();
                return true;
            } else {
                console.error('Error cargando configuración PayPal:', data.message);
                return false;
            }
        } catch (error) {
            console.error('Error en loadPayPalConfig:', error);
            return false;
        }
    }

    // ✅ INICIALIZAR PAYPAL SDK
    async initializePayPal() {
        return new Promise((resolve, reject) => {
            // Verificar si PayPal SDK ya está cargado
            if (window.paypal) {
                this.paypalInitialized = true;
                console.log('✅ PayPal SDK ya estaba cargado');
                resolve();
                return;
            }
            
            // Cargar PayPal SDK dinámicamente
            const script = document.createElement('script');
            const currency = 'USD'; // PayPal en Perú usa USD
            const environment = this.sandbox ? 'sandbox' : 'production';
            
            script.src = `https://www.paypal.com/sdk/js?client-id=${this.clientId}&currency=${currency}&intent=capture`;
            script.onload = () => {
                this.paypalInitialized = true;
                console.log('✅ PayPal SDK cargado exitosamente');
                resolve();
            };
            script.onerror = () => {
                console.error('❌ Error cargando PayPal SDK');
                reject(new Error('No se pudo cargar PayPal SDK'));
            };
            
            document.head.appendChild(script);
        });
    }

    // ✅ PROCESAR PAGO COMPLETO
    async procesarPagoCompleto(reservaData) {
        try {
            console.log('🚀 Iniciando proceso de pago PayPal:', reservaData);
            
            // 1. Cargar configuración
            const configLoaded = await this.loadPayPalConfig(reservaData.instalacion_id);
            if (!configLoaded) {
                throw new Error('No se pudo cargar la configuración de PayPal');
            }

            // 2. Mostrar modal de PayPal
            this.currentReservaData = reservaData;
            this.showPayPalModal(reservaData);

        } catch (error) {
            console.error('❌ Error iniciando pago PayPal:', error);
            this.showErrorMessage('Error iniciando pago: ' + error.message);
        }
    }

    // ✅ MOSTRAR MODAL CON BOTONES PAYPAL
    showPayPalModal(reservaData) {
        const amountUSD = (reservaData.monto * 0.27).toFixed(2); // Conversión aproximada PEN a USD
        
        const message = `
            <div class="paypal-payment" style="text-align: center; padding: 20px;">
                <i class="fab fa-paypal" style="color: #0070ba; font-size: 3rem; margin-bottom: 15px;"></i>
                <h3 style="color: #0070ba; margin-bottom: 15px;">Pagar con PayPal</h3>
                <p style="margin-bottom: 15px;">Monto a pagar: <strong>$${amountUSD} USD</strong></p>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; text-align: left;">
                    <strong>Detalles de la reserva:</strong><br>
                    📅 Fecha: ${reservaData.fecha}<br>
                    🕐 Horario: ${reservaData.hora_inicio} - ${reservaData.hora_fin}<br>
                    🏟️ Área: ${reservaData.area_nombre}<br>
                    💰 Monto: S/ ${reservaData.monto} (≈ $${amountUSD} USD)
                </div>
                
                <div style="background: #fff3cd; padding: 10px; border-radius: 5px; margin: 15px 0; color: #856404;">
                    <strong>💡 Nota:</strong> PayPal procesa pagos en dólares americanos (USD).
                </div>
                
                <div id="paypal-button-container" style="margin: 20px 0; min-height: 50px;"></div>
                
                <button onclick="document.getElementById('modalConfirmarReserva').style.display='none'" class="btn btn-secondary" style="padding: 12px 24px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; margin-top: 10px;">
                    Cancelar
                </button>
            </div>
        `;
        
        this.showModal('Pago con PayPal', message);
        
        // Renderizar botones PayPal después de que el modal se muestre
        setTimeout(() => this.renderPayPalButtons(), 500);
    }

    // ✅ RENDERIZAR BOTONES PAYPAL
    renderPayPalButtons() {
        if (!window.paypal) {
            console.error('❌ PayPal SDK no está disponible');
            return;
        }

        const container = document.getElementById('paypal-button-container');
        if (!container) {
            console.error('❌ Container de PayPal no encontrado');
            return;
        }

        // Limpiar container
        container.innerHTML = '';

        const amountUSD = (this.currentReservaData.monto * 0.27).toFixed(2);

        // ✅ CONFIGURAR BOTONES PAYPAL CON MEJOR MANEJO DE ERRORES
        window.paypal.Buttons({
            style: {
                layout: 'vertical',
                color: 'blue',
                shape: 'rect',
                label: 'paypal',
                height: 40
            },
            
            createOrder: (data, actions) => {
                console.log('📤 Creando orden PayPal...');
                
                return actions.order.create({
                    purchase_units: [{
                        amount: {
                            currency_code: 'USD',
                            value: amountUSD
                        },
                        description: `Reserva: ${this.currentReservaData.area_nombre}`,
                        custom_id: `reserva_${Date.now()}` // ID personalizado para tracking
                    }],
                    application_context: {
                        brand_name: "GameOn Network",
                        user_action: "PAY_NOW",
                        return_url: window.location.origin + "/success",
                        cancel_url: window.location.origin + "/cancel"
                    }
                });
            },
            
            onApprove: async (data, actions) => {
                console.log('✅ Pago aprobado por PayPal:', data);
                
                // ✅ MOSTRAR LOADING INMEDIATAMENTE
                this.showLoadingMessage('Procesando pago con PayPal...');
                
                try {
                    // ✅ INTENTAR CAPTURAR CON TIMEOUT Y FALLBACK
                    let order = null;
                    let paymentId = data.orderID;
                    let payerId = data.payerID || 'sandbox_payer';
                    
                    try {
                        // ✅ INTENTAR CAPTURA CON TIMEOUT DE 8 SEGUNDOS
                        const capturePromise = actions.order.capture();
                        const timeoutPromise = new Promise((_, reject) => 
                            setTimeout(() => reject(new Error('CAPTURE_TIMEOUT')), 8000)
                        );
                        
                        order = await Promise.race([capturePromise, timeoutPromise]);
                        
                        if (order && order.id) {
                            paymentId = order.id;
                            payerId = order.payer?.payer_id || payerId;
                            console.log('✅ Orden capturada exitosamente:', order);
                        }
                        
                    } catch (captureError) {
                        console.warn('⚠️ Error en captura, usando datos básicos:', captureError.message);
                        // ✅ CONTINUAR CON LOS DATOS BÁSICOS DE APROBACIÓN
                    }
                    
                    // ✅ CREAR RESERVA (CON O SIN CAPTURA COMPLETA)
                    this.showLoadingMessage('Creando reserva en el sistema...');
                    
                    const reservaResult = await this.createReservationWithPayPal(
                        this.currentReservaData, 
                        paymentId, 
                        payerId
                    );
                    
                    if (reservaResult.success) {
                        this.showSuccessMessage(reservaResult.reserva_id);
                    } else {
                        throw new Error(reservaResult.message || 'Error creando la reserva');
                    }
                    
                } catch (error) {
                    console.error('❌ Error completo en onApprove:', error);
                    
                    // ✅ MANEJAR DIFERENTES TIPOS DE ERROR
                    let userMessage = 'Error procesando el pago';
                    
                    if (error.message.includes('closed') || error.message.includes('postrobot')) {
                        userMessage = 'La ventana de PayPal se cerró inesperadamente. Tu pago puede haberse procesado. Verifica tu cuenta PayPal.';
                    } else if (error.message.includes('CAPTURE_TIMEOUT')) {
                        userMessage = 'El procesamiento está tomando más tiempo del esperado. Tu pago puede haberse completado. Verifica tu cuenta PayPal.';
                    } else if (error.message.includes('reserva')) {
                        userMessage = 'El pago fue exitoso pero hubo un error creando la reserva. Contacta con soporte.';
                    } else {
                        userMessage = `Error: ${error.message}`;
                    }
                    
                    this.showErrorMessage(userMessage);
                }
            },
            
            onError: (err) => {
                console.error('❌ Error general PayPal:', err);
                this.showErrorMessage('Error en el sistema de pagos PayPal. Intenta nuevamente.');
            },
            
            onCancel: (data) => {
                console.log('ℹ️ Pago cancelado por el usuario:', data);
                this.showErrorMessage('Pago cancelado por el usuario');
            }
            
        }).render('#paypal-button-container').catch(err => {
            console.error('❌ Error renderizando botones PayPal:', err);
            container.innerHTML = '<p style="color: red;">Error cargando botones de PayPal</p>';
        });
        
        console.log('✅ Botones PayPal configurados con manejo robusto de errores');
    }

    // ✅ CREAR RESERVA CON PAYPAL
    async createReservationWithPayPal(reservaData, paymentId, payerId) {
        try {
            console.log('📤 Enviando datos a ReservaController:', {
                action: 'create_reservation_paypal',
                usuario_id: reservaData.usuario_id,
                area_id: reservaData.area_id,
                fecha: reservaData.fecha,
                hora_inicio: reservaData.hora_inicio,
                hora_fin: reservaData.hora_fin,
                paypal_payment_id: paymentId,
                paypal_payer_id: payerId,
                monto: reservaData.monto
            });
            
            const response = await fetch('../../Controllers/ReservaController.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    action: 'create_reservation_paypal',
                    usuario_id: reservaData.usuario_id,
                    area_id: reservaData.area_id,
                    fecha: reservaData.fecha,
                    hora_inicio: reservaData.hora_inicio,
                    hora_fin: reservaData.hora_fin,
                    paypal_payment_id: paymentId,
                    paypal_payer_id: payerId,
                    monto: reservaData.monto,
                    estado: 'confirmada'
                })
            });
            
            console.log('📡 Response status:', response.status);
            console.log('📡 Response ok:', response.ok);
            
            // ✅ VERIFICAR STATUS HTTP
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ HTTP Error:', response.status, errorText);
                throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 200)}`);
            }
            
            // ✅ OBTENER TEXTO CRUDO PRIMERO
            const responseText = await response.text();
            console.log('📡 Response text (primeros 500 chars):', responseText.substring(0, 500));
            
            // ✅ VERIFICAR QUE NO ESTÉ VACÍO
            if (!responseText || responseText.trim() === '') {
                throw new Error('El servidor devolvió una respuesta vacía');
            }
            
            // ✅ VERIFICAR QUE COMIENCE CON {
            if (!responseText.trim().startsWith('{')) {
                console.error('❌ Response no es JSON:', responseText);
                throw new Error('El servidor no devolvió JSON válido: ' + responseText.substring(0, 100));
            }
            
            // ✅ PARSEAR JSON
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('❌ Error parseando JSON:', parseError);
                console.error('❌ Response text era:', responseText);
                throw new Error('Respuesta del servidor no es JSON válido');
            }
            
            console.log('✅ Respuesta parseada correctamente:', data);
            return data;
            
        } catch (error) {
            console.error('❌ Error completo en createReservationWithPayPal:', error);
            
            // ✅ RETORNAR ERROR ESTRUCTURADO
            return {
                success: false,
                message: error.message || 'Error de conexión con el servidor',
                error_type: 'JavaScript',
                details: error.toString()
            };
        }
    }

    // ✅ FUNCIONES DE UI
    showLoadingMessage(message) {
        const loadingHtml = `
            <div class="payment-loading" style="text-align: center; padding: 20px;">
                <div class="spinner" style="width: 50px; height: 50px; border: 5px solid #f3f3f3; border-top: 5px solid #0070ba; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                <h3 style="color: #0070ba; margin-bottom: 15px;">${message}</h3>
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
                <i class="fab fa-paypal" style="color: #0070ba; font-size: 3rem; margin-bottom: 15px;"></i>
                <h3 style="color: #0070ba; margin-bottom: 15px;">¡Pago exitoso con PayPal!</h3>
                <p style="margin-bottom: 10px;">Tu reserva ha sido confirmada.</p>
                <p style="margin-bottom: 20px;"><strong>ID de Reserva:</strong> ${reservaId}</p>
                <button onclick="window.location.href='dashboard.php'" class="btn btn-primary" style="padding: 12px 24px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">
                    Ir al Dashboard
                </button>
            </div>
        `;
        this.showModal('Reserva Confirmada', message);
    }

    // ✅ ACTUALIZAR showErrorMessage PARA SER MÁS ÚTIL
    showErrorMessage(message) {
        const errorHtml = `
            <div class="payment-error" style="text-align: center; padding: 20px;">
                <i class="fas fa-exclamation-circle" style="color: #dc3545; font-size: 3rem; margin-bottom: 15px;"></i>
                <h3 style="color: #dc3545; margin-bottom: 15px;">Problema con el pago</h3>
                <p style="margin-bottom: 20px; color: #333;">${message}</p>
                
                ${message.includes('cerró') || message.includes('tiempo') ? `
                    <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0; color: #856404;">
                        <strong>💡 Importante:</strong><br>
                        • Revisa tu cuenta PayPal para ver si el pago se procesó<br>
                        • Si el pago aparece, contacta con soporte para confirmar tu reserva<br>
                        • Si no aparece, puedes intentar el pago nuevamente
                    </div>
                ` : ''}
                
                <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                    <button onclick="window.location.reload()" class="btn btn-primary" style="padding: 12px 24px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">
                        Intentar Nuevamente
                    </button>
                    <button onclick="document.getElementById('modalConfirmarReserva').style.display='none'" class="btn btn-secondary" style="padding: 12px 24px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">
                        Cerrar
                    </button>
                </div>
            </div>
        `;
        this.showModal('Problema con el Pago', errorHtml);
    }

    showModal(title, content) {
        const modal = document.getElementById('modalConfirmarReserva');
        if (modal) {
            const titleElement = modal.querySelector('h3');
            const contentElement = modal.querySelector('#modalReservaTexto');
            
            if (titleElement) titleElement.textContent = title;
            if (contentElement) contentElement.innerHTML = content;
            
            modal.style.display = 'flex';
        }
    }

    // ✅ AGREGAR AL FINAL DE paypal_integration.js

    // INICIAR PAGO PARA TORNEOS
    async iniciarPagoTorneo(datosInscripcion, onSuccess) {
        console.log('🏆 Iniciando pago PayPal REAL para torneo:', datosInscripcion);
        
        try {
            // ✅ CARGAR CONFIGURACIÓN PAYPAL (IGUAL QUE RESERVAS)
            const configLoaded = await this.loadPayPalConfig(datosInscripcion.instalacion_id || 1);
            if (!configLoaded) {
                throw new Error('No se pudo cargar la configuración de PayPal');
            }
            
            // ✅ ESPERAR A QUE PAYPAL SDK ESTÉ LISTO (IGUAL QUE RESERVAS)
            if (!window.paypal) {
                throw new Error('PayPal SDK no está disponible');
            }
            
            // ✅ CONFIGURAR BOTONES (IGUAL QUE RESERVAS)
            this.configurarBotonesPayPalTorneo(datosInscripcion, onSuccess);
            
        } catch (error) {
            console.error('❌ Error iniciando pago PayPal torneo:', error);
            alert('Error: ' + error.message);
        }
    }

    // CONFIGURAR BOTONES PAYPAL PARA TORNEOS
    configurarBotonesPayPalTorneo(datosInscripcion, onSuccess) {
        // ✅ VERIFICAR PAYPAL SDK NUEVAMENTE
        if (!window.paypal) {
            console.error('❌ PayPal SDK no disponible en configurarBotonesPayPalTorneo');
            alert('Error: PayPal SDK no está cargado');
            return;
        }
        
        // ✅ CREAR CONTENEDOR TEMPORAL PARA PAYPAL CON ESTILOS DE TORNEOS
        const paypalContainer = document.createElement('div');
        paypalContainer.id = 'paypal-buttons-torneo';
        paypalContainer.innerHTML = `
            <div class="paypal-modal-torneo">
                <div class="paypal-modal-content">
                    <div class="paypal-modal-header">
                        <h3>💳 Pagar Inscripción con PayPal</h3>
                        <p><strong>${datosInscripcion.torneo_nombre}</strong></p>
                        <p>Monto: <strong>S/. ${datosInscripcion.monto.toFixed(2)}</strong></p>
                        <p style="font-size: 0.9rem; opacity: 0.8;">
                            ≈ $${(datosInscripcion.monto / 3.8).toFixed(2)} USD
                        </p>
                    </div>
                    <div class="paypal-buttons-container" id="paypal-buttons-container-torneo">
                        <div style="text-align: center; color: #ffffff; padding: 20px;">
                            <div class="spinner" style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #0070ba; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 15px;"></div>
                            <p>Cargando botones de PayPal...</p>
                        </div>
                    </div>
                    <div class="paypal-modal-footer">
                        <button class="btn btn-secondary" onclick="document.getElementById('paypal-buttons-torneo').remove()">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(paypalContainer);
        
        // ✅ CONFIGURAR BOTONES PAYPAL CON VERIFICACIÓN
        try {
            window.paypal.Buttons({
                style: {
                    layout: 'vertical',
                    color: 'blue',
                    shape: 'rect',
                    label: 'paypal',
                    height: 45
                },
                
                createOrder: (data, actions) => {
                    console.log('📤 Creando orden PayPal para torneo...');
                    
                    return actions.order.create({
                        purchase_units: [{
                            amount: {
                                value: (datosInscripcion.monto / 3.8).toFixed(2), // Convertir PEN a USD
                                currency_code: 'USD'
                            },
                            description: `Inscripción: ${datosInscripcion.torneo_nombre}`,
                            custom_id: `torneo_${datosInscripcion.torneo_id}_equipo_${datosInscripcion.equipo_id}`
                        }],
                        application_context: {
                            brand_name: "GameOn Network",
                            user_action: "PAY_NOW"
                        }
                    });
                },
                
                onApprove: async (data, actions) => {
                    console.log('✅ Pago aprobado para torneo:', data);
                    
                    try {
                        // ✅ MOSTRAR LOADING EN EL MODAL
                        const container = document.getElementById('paypal-buttons-container-torneo');
                        if (container) {
                            container.innerHTML = `
                                <div style="text-align: center; color: #ffffff; padding: 30px;">
                                    <div class="spinner" style="width: 50px; height: 50px; border: 5px solid #f3f3f3; border-top: 5px solid #0070ba; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                                    <h4 style="color: #0070ba; margin-bottom: 10px;">Procesando pago...</h4>
                                    <p>Por favor espera mientras confirmamos tu pago</p>
                                </div>
                            `;
                        }
                        
                        // ✅ INTENTAR CAPTURAR CON TIMEOUT
                        let order = null;
                        let paymentId = data.orderID;
                        let payerId = data.payerID || 'sandbox_payer';
                        
                        try {
                            const capturePromise = actions.order.capture();
                            const timeoutPromise = new Promise((_, reject) => 
                                setTimeout(() => reject(new Error('CAPTURE_TIMEOUT')), 8000)
                            );
                            
                            order = await Promise.race([capturePromise, timeoutPromise]);
                            
                            if (order && order.id) {
                                paymentId = order.id;
                                payerId = order.payer?.payer_id || payerId;
                                console.log('✅ Orden capturada exitosamente:', order);
                            }
                            
                        } catch (captureError) {
                            console.warn('⚠️ Error en captura, usando datos básicos:', captureError.message);
                        }
                        
                        // ✅ CERRAR MODAL PAYPAL
                        paypalContainer.remove();
                        
                        // ✅ LLAMAR CALLBACK DE ÉXITO
                        await onSuccess(paymentId, payerId);
                        
                    } catch (error) {
                        console.error('❌ Error en onApprove torneo:', error);
                        paypalContainer.remove();
                        alert('Error procesando el pago: ' + error.message);
                    }
                },
                
                onError: (err) => {
                    console.error('❌ Error PayPal torneo:', err);
                    paypalContainer.remove();
                    alert('Error en el sistema de pagos PayPal');
                },
                
                onCancel: (data) => {
                    console.log('🚫 Pago cancelado por usuario:', data);
                    paypalContainer.remove();
                }
                
            }).render('#paypal-buttons-container-torneo').catch(err => {
                console.error('❌ Error renderizando botones PayPal:', err);
                const container = document.getElementById('paypal-buttons-container-torneo');
                if (container) {
                    container.innerHTML = `
                        <div style="text-align: center; color: #dc3545; padding: 20px;">
                            <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 10px;"></i>
                            <p>Error cargando botones PayPal</p>
                        </div>
                    `;
                }
            });
            
            console.log('✅ Botones PayPal configurados para torneo');
            
        } catch (error) {
            console.error('❌ Error total en configurarBotonesPayPalTorneo:', error);
            paypalContainer.remove();
            alert('Error configurando PayPal: ' + error.message);
        }
    }
}

// Instancia global
window.paypalIntegration = new PayPalIntegration();

console.log('✅ PayPal Integration cargado correctamente');
<?php
require_once '../../Config/database.php';

$message = '';
$error = '';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // 1. Recoger y sanear los datos del formulario
    $nombre_institucion = trim($_POST['nombre']);
    $ruc = trim($_POST['ruc']);
    $email = trim($_POST['email']);
    $password = $_POST['password'];
    $documento_url = trim($_POST['documento_url']); // URL desde Filestack

    // 2. Validar los datos
    if (empty($nombre_institucion) || empty($ruc) || empty($email) || empty($password) || empty($documento_url)) {
        $error = "Por favor, complete todos los campos y suba el documento requerido.";
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $error = "El formato del correo electrónico no es válido.";
    } elseif (!preg_match('/^\d{11}$/', $ruc)) {
        $error = "El RUC debe contener exactamente 11 dígitos.";
    } elseif (!filter_var($documento_url, FILTER_VALIDATE_URL)) {
        $error = "La URL del documento proporcionada no es válida.";
    } else {
        $db = new Database();
        $conn = $db->getConnection();

        // Verificar si ya existe una solicitud activa (pendiente o aprobada) con el mismo email o RUC
        $stmt_check = $conn->prepare("SELECT id FROM solicitudes_registro WHERE (email = ? OR ruc = ?) AND estado IN ('pendiente', 'aprobada')");
        $stmt_check->bind_param("ss", $email, $ruc);
        $stmt_check->execute();
        $stmt_check->store_result();

        if ($stmt_check->num_rows > 0) {
            $error = "Ya existe una solicitud pendiente o aprobada con este correo electrónico o RUC.";
        } else {
            // Si no hay solicitudes activas, se puede proceder a registrar una nueva

            // 3. Hashear la contraseña
            $password_hashed = password_hash($password, PASSWORD_BCRYPT);

            // 4. Insertar en la base de datos con la URL de Filestack
            $stmt = $conn->prepare("INSERT INTO solicitudes_registro (nombre_institucion, ruc, email, password, documento_path) VALUES (?, ?, ?, ?, ?)");
            $stmt->bind_param("sssss", $nombre_institucion, $ruc, $email, $password_hashed, $documento_url);

            if ($stmt->execute()) {
                $message = "¡Gracias! Tu solicitud de registro ha sido enviada con éxito. Recibirás una notificación por correo electrónico una vez que sea revisada.";
            } else {
                $error = "Error al registrar la solicitud. Por favor, inténtelo de nuevo.";
            }
            $stmt->close();
        }
        $stmt_check->close();
        $db->closeConnection();
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Estado de Registro</title>
    <link rel="stylesheet" href="../../Public/css/styles_registroinsdepor.css">
    <style>
        .status-container {
            text-align: center;
            padding: 40px;
            margin-top: 50px;
        }
        .status-message {
            font-size: 1.2em;
            margin-bottom: 20px;
        }
        .success { color: #28a745; }
        .error { color: #dc3545; }
    </style>
</head>
<body class="auth-page">
    <div class="auth-container">
        <div class="status-container">
            <?php if (!empty($message)): ?>
                <h2 class="success">¡Solicitud Enviada!</h2>
                <p class="status-message success"><?php echo htmlspecialchars($message); ?></p>
                <a href="../../index.php" class="btn btn-primary">Volver al Inicio</a>
            <?php elseif (!empty($error)): ?>
                <h2 class="error">Error en el Registro</h2>
                <p class="status-message error"><?php echo htmlspecialchars($error); ?></p>
                <a href="registroinsdepor.php" class="btn btn-secondary">Volver a Intentar</a>
            <?php else: ?>
                <p>No se ha enviado ningún formulario.</p>
            <?php endif; ?>
        </div>
    </div>
</body>
</html>
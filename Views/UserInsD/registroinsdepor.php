<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Registro - Institución Deportiva</title>
  <link rel="stylesheet" href="../../Public/css/styles_registroinsdepor.css">
  <script src="https://static.filestackapi.com/filestack-js/3.x.x/filestack.min.js"></script>
</head>
<body class="auth-page">
  <div class="auth-container dual-column">
    
    <div class="auth-info">
      <h2>Información Importante</h2>
      <p>
        Bienvenido al proceso de registro para Propietarios de Instalaciones Deportivas en <strong>GameOn Network</strong>.
      </p>
      <p>
        Esta sección está diseñada exclusivamente para instituciones deportivas que desean formar parte de nuestra plataforma. 
        Para completar el registro, deberás adjuntar un documento legal en formato PDF que respalde tu actividad.
      </p>
      <p>
        Una vez enviado el formulario, tu solicitud será evaluada por un miembro del equipo en un plazo de hasta <strong>3 días hábiles</strong>. 
        Recibirás un correo electrónico desde nuestra cuenta oficial de Gmail indicando si tu solicitud fue aprobada o si requiere modificaciones.
      </p>
      <p>
        En caso de ser aprobada, recibirás los datos de acceso y podrás comenzar a gestionar tus instalaciones, horarios, tarifas y más.
      </p>
      <p><em>¡Gracias por formar parte de la comunidad GameOn Network!</em></p>
    </div>

    <!-- COLUMNA DERECHA: Formulario -->
    <div class="auth-form">
      <div class="auth-header">
        <h2>Registro de Institución Deportiva</h2>
      </div>
      <div class="auth-body">
        <form action="/Views/UserInsD/procesar_registroinsdepor.php" method="POST">
          <div class="form-group">
            <label for="nombre">Nombre de la Institución</label>
            <input type="text" name="nombre" id="nombre" class="form-control" required>
          </div>

          <div class="form-group">
            <label for="ruc">RUC</label>
            <input type="text" name="ruc" id="ruc" class="form-control" required pattern="\d{11}" title="Ingrese 11 dígitos">
          </div>

          <div class="form-group">
            <label for="email">Correo electrónico</label>
            <input type="email" name="email" id="email" class="form-control" required>
          </div>

          <div class="form-group">
            <label for="password">Contraseña</label>
            <input type="password" name="password" id="password" class="form-control" required>
          </div>

          <div class="form-group">
            <label>Subir Documento Legal (PDF)</label>
            <button type="button" id="upload-btn" class="btn btn-secondary">Seleccionar Archivo</button>
            <input type="hidden" name="documento_url" id="documento_url" required>
            <p id="file-info" style="margin-top: 10px; color: #555;"></p>
          </div>

          <button type="submit" class="btn btn-primary btn-large">Registrarse</button>
        </form>
      </div>
      <div class="auth-footer">
        ¿Ya tienes una cuenta? <a href="login.php">Inicia sesión</a>
      </div>
    </div>

  </div>

  <script>
    document.addEventListener('DOMContentLoaded', function () {
      const apikey = 'ADJMOe6jTf2i90cFTlUgpz';
      const client = filestack.init(apikey);

      const options = {
        fromSources: ["local_file_system", "url", "googledrive", "dropbox"],
        accept: ["application/pdf"],
        maxFiles: 1,
        lang: 'es',
        onUploadDone: (res) => {
          const file = res.filesUploaded[0];
          document.getElementById('documento_url').value = file.url;
          const fileInfo = document.getElementById('file-info');
          fileInfo.textContent = `Archivo subido: ${file.filename}`;
          fileInfo.style.color = '#28a745'; // Color verde para éxito
          document.getElementById('upload-btn').textContent = 'Cambiar Archivo';
        },
      };

      document.getElementById('upload-btn').addEventListener('click', () => {
        client.picker(options).open();
      });
    });
  </script>
</body>
</html>
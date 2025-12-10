<?php
// C:\xampp\htdocs\consultorio\login.php

// **********************************************
// 1. CÓDIGO CORS ESTANDARIZADO
// **********************************************

// Permitir acceso desde cualquier origen (requerido para desarrollo local)
header('Access-Control-Allow-Origin: *');

// Permitir los métodos HTTP que se usarán (POST, GET, OPTIONS)
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');

// Permitir los encabezados que Angular/Ionic envía, incluyendo Content-Type y X-Requested-With
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Especificar que la respuesta será JSON
header('Content-Type: application/json');

// Manejar la solicitud OPTIONS (preflight request que el navegador envía primero)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// **********************************************
// 2. LÓGICA DE LOGIN
// **********************************************

// Incluye la conexión a MySQL (variable $conn)
include 'conexion.php';

// Obtener datos de la solicitud POST (JSON)
$data = json_decode(file_get_contents('php://input'), true);

$response = array('status' => 'error', 'message' => 'Datos inválidos o incompletos.');

if (isset($data['usuario']) && isset($data['clave'])) {
    $usuario = $data['usuario'];
    $clave = $data['clave'];

    // Consulta SQL para buscar usuario y obtener su rol
    $sql = "SELECT u.id_usuario, u.clave, r.nombre_rol FROM usuarios u INNER JOIN roles r ON u.id_rol = r.id_rol WHERE u.usuario = ?";

    // 4. Preparar y ejecutar la declaración (Statement)
    if ($stmt = $conn->prepare($sql)) {
        $stmt->bind_param('s', $usuario);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows == 1) {
            $row = $result->fetch_assoc();

            // 5. Verificación de la clave (Sin hasheo)
            if ($clave === $row['clave']) {
                // Login Exitoso
                $response = array(
                    'status' => 'success',
                    'message' => 'Autenticación exitosa.',
                    'id_usuario' => $row['id_usuario'],
                    'rol' => $row['nombre_rol']
                );
            } else {
                $response = array('status' => 'error', 'message' => 'Credenciales incorrectas.');
            }
        } else {
            $response = array('status' => 'error', 'message' => 'Credenciales incorrectas.');
        }

        $stmt->close();
    } else {
        // Este error ocurre si la sentencia SQL está mal formada
        $response = array('status' => 'error', 'message' => 'Error interno del servidor.');
    }
}

// 6. Devolver la respuesta en formato JSON
echo json_encode($response);
$conn->close();
?>

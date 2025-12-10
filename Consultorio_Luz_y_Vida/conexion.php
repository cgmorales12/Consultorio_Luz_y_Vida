<?php
// C:\xampp\htdocs\consultorio\conexion.php
// ARCHIVO DE CONFIGURACIÓN Y CONEXIÓN A MYSQL

// 1. Credenciales de la Base de Datos (AJUSTA ESTOS VALORES)
define('DB_SERVER', 'localhost');
define('DB_USER', 'root');     // Usuario de MySQL (típicamente 'root' en XAMPP)
define('DB_PASS', '');         // Clave de MySQL (típicamente vacía en XAMPP)
define('DB_NAME', 'luz_y_vida_db'); // !!! IMPORTANTE: Reemplaza con el nombre de tu base de datos !!!

// 2. Crear Conexión
$conn = new mysqli(DB_SERVER, DB_USER, DB_PASS, DB_NAME);

// 3. Verificar la conexión
if ($conn->connect_error) {
    // Configuramos los encabezados para devolver un error JSON al cliente (Ionic)
    header('Access-Control-Allow-Origin: *');
    header('Content-Type: application/json');
    
    $response = array('status' => 'error', 'message' => 'Error de conexión a la base de datos: ' . $conn->connect_error);
    echo json_encode($response);
    exit(); // Detenemos la ejecución
}

// 4. Opcional: Establecer el juego de caracteres
$conn->set_charset("utf8");

// NOTA: La variable $conn está disponible para los archivos que incluyen 'conexion.php'.
?>

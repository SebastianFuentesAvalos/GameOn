-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Versión del servidor:         10.4.32-MariaDB - mariadb.org binary distribution
-- SO del servidor:              Win64
-- HeidiSQL Versión:             12.10.0.7000
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Volcando estructura de base de datos para railway
CREATE DATABASE IF NOT EXISTS `railway` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;
USE `railway`;

-- Volcando estructura para tabla railway.amistades
CREATE TABLE IF NOT EXISTS `amistades` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_solicitante_id` int(11) NOT NULL,
  `usuario_receptor_id` int(11) NOT NULL,
  `estado` enum('pendiente','aceptada','rechazada') NOT NULL DEFAULT 'pendiente',
  `fecha_solicitud` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_respuesta` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `amistad_unica` (`usuario_solicitante_id`,`usuario_receptor_id`),
  KEY `usuario_receptor_id` (`usuario_receptor_id`),
  CONSTRAINT `amistades_ibfk_1` FOREIGN KEY (`usuario_solicitante_id`) REFERENCES `usuarios_deportistas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `amistades_ibfk_2` FOREIGN KEY (`usuario_receptor_id`) REFERENCES `usuarios_deportistas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla railway.amistades: ~2 rows (aproximadamente)
INSERT INTO `amistades` (`id`, `usuario_solicitante_id`, `usuario_receptor_id`, `estado`, `fecha_solicitud`, `fecha_respuesta`) VALUES
	(1, 2, 3, 'aceptada', '2025-06-02 19:24:11', '2025-06-02 19:24:13'),
	(3, 4, 2, 'aceptada', '2025-06-02 20:01:28', '2025-06-02 20:03:18');

-- Volcando estructura para tabla railway.areas_deportivas
CREATE TABLE IF NOT EXISTS `areas_deportivas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `institucion_deportiva_id` int(11) NOT NULL,
  `deporte_id` int(11) NOT NULL,
  `nombre_area` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `capacidad_jugadores` int(11) DEFAULT NULL,
  `tarifa_por_hora` decimal(10,2) NOT NULL,
  `estado` enum('activa','mantenimiento','inactiva') DEFAULT 'activa',
  `imagen_area` varchar(255) DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `institucion_deportiva_id` (`institucion_deportiva_id`),
  KEY `deporte_id` (`deporte_id`),
  CONSTRAINT `areas_deportivas_ibfk_1` FOREIGN KEY (`institucion_deportiva_id`) REFERENCES `instituciones_deportivas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `areas_deportivas_ibfk_2` FOREIGN KEY (`deporte_id`) REFERENCES `deportes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla railway.areas_deportivas: ~17 rows (aproximadamente)
INSERT INTO `areas_deportivas` (`id`, `institucion_deportiva_id`, `deporte_id`, `nombre_area`, `descripcion`, `capacidad_jugadores`, `tarifa_por_hora`, `estado`, `imagen_area`, `creado_en`) VALUES
	(16, 1, 1, 'Cancha de Fútbol Principal', 'Cancha de césped sintético con iluminación LED completa', 22, 1.00, 'activa', 'https://i.ibb.co/JWPC8xCW/cancha1.jpg', '2025-06-16 21:44:21'),
	(17, 1, 1, 'Cancha de Fútbol Secundaria', 'Cancha de césped natural para entrenamientos', 22, 1.00, 'activa', 'https://i.ibb.co/Y7rqxcQ1/ga1.jpg', '2025-06-16 21:44:21'),
	(18, 1, 2, 'Cancha de Vóley A', 'Cancha de vóley techada con piso de parquet', 12, 50.00, 'activa', 'https://i.ibb.co/kVqBF060/volay1.jpg', '2025-06-16 21:44:21'),
	(19, 1, 2, 'Cancha de Vóley B', 'Cancha de vóley al aire libre', 12, 40.00, 'activa', 'https://ibb.co/ZpwKdBJ1', '2025-06-16 21:44:21'),
	(20, 1, 3, 'Cancha de Básquet Techada', 'Cancha de básquet con tableros oficiales', 10, 55.00, 'activa', 'https://i.ibb.co/KxBLnrVj/basketball.webp', '2025-06-16 21:44:21'),
	(21, 2, 1, 'Campo de Fútbol Los Andes', 'Campo de fútbol con césped natural y graderías', 22, 70.00, 'activa', 'https://i.ibb.co/Q397SFmm/images.jpg', '2025-06-16 21:44:51'),
	(22, 2, 3, 'Cancha de Básquet Principal', 'Cancha de básquet techada con marcador electrónico', 10, 60.00, 'activa', 'https://i.ibb.co/YFJsG1cZ/tablero.webp', '2025-06-16 21:44:51'),
	(23, 2, 3, 'Cancha de Básquet Entrenamiento', 'Cancha auxiliar para entrenamientos', 10, 45.00, 'activa', 'https://i.ibb.co/KxBLnrVj/basketball.webp', '2025-06-16 21:44:51'),
	(24, 2, 2, 'Cancha de Vóley Los Andes', 'Cancha de vóley con piso de cemento pulido', 12, 35.00, 'activa', 'https://i.ibb.co/G4QHpwKV/voleibol-libre.jpg', '2025-06-16 21:44:51'),
	(25, 3, 1, 'Campo Principal del Estadio', 'Campo reglamentario con césped natural y capacidad para 5000 espectadores', 22, 120.00, 'activa', 'https://i.ibb.co/1f4vkrHz/fe.jpg', '2025-06-16 21:44:51'),
	(26, 3, 2, 'Cancha de Vóley Municipal', 'Cancha oficial para torneos municipales', 12, 45.00, 'activa', 'https://i.ibb.co/fz9YKBbK/fefefe.jpg', '2025-06-16 21:44:51'),
	(27, 3, 3, 'Cancha de Básquet Municipal', 'Cancha de básquet para eventos municipales', 10, 50.00, 'activa', 'https://i.ibb.co/sdD20DRS/rera.jpg', '2025-06-16 21:44:51'),
	(28, 3, 1, 'Campo de Entrenamiento', 'Campo auxiliar para entrenamientos y partidos menores', 22, 90.00, 'mantenimiento', 'https://i.ibb.co/C5mV0P8c/gaga.jpg', '2025-06-16 21:44:51'),
	(31, 5, 1, 'Cancha de Futbol', 'cancha de futbol\r\n', 10, 60.00, 'activa', 'https://i.ibb.co/FkS5TYQF/images-3.jpg', '2025-06-25 20:48:19'),
	(32, 4, 3, 'Cancha Basquet - Voley "Los Granados"', 'Área deportiva de Basquet y Voley con gradas para espectadores y 2 servicios higiénicos de Damas y Varones.', 22, 35.00, 'activa', 'https://i.ibb.co/0RtqtDzq/basquet.jpg', '2025-06-26 13:39:36'),
	(33, 5, 1, 'Cancha de Futbol Grande', 'Cancha de futbol con gradas para que los aficionados, parejas y jugadores recambio puedan estar.', 22, 40.00, 'activa', 'https://i.ibb.co/mVMFCw7M/pallardeli.jpg', '2025-06-26 13:43:06'),
	(34, 6, 2, 'Cancha de Vóley', 'amplia cancha de voley', 12, 0.00, 'activa', 'https://i.ibb.co/cS4sd48t/images-4.jpg', '2025-06-26 16:28:22');

-- Volcando estructura para tabla railway.areas_horarios
CREATE TABLE IF NOT EXISTS `areas_horarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `area_deportiva_id` int(11) NOT NULL,
  `dia` enum('Lunes','Martes','Miercoles','Jueves','Viernes','Sabado','Domingo') NOT NULL,
  `hora_apertura` time NOT NULL,
  `hora_cierre` time NOT NULL,
  `disponible` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `area_deportiva_id` (`area_deportiva_id`),
  CONSTRAINT `areas_horarios_ibfk_1` FOREIGN KEY (`area_deportiva_id`) REFERENCES `areas_deportivas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=155 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla railway.areas_horarios: ~119 rows (aproximadamente)
INSERT INTO `areas_horarios` (`id`, `area_deportiva_id`, `dia`, `hora_apertura`, `hora_cierre`, `disponible`) VALUES
	(1, 16, 'Lunes', '06:00:00', '22:00:00', 1),
	(2, 16, 'Martes', '06:00:00', '22:00:00', 1),
	(3, 16, 'Miercoles', '06:00:00', '22:00:00', 1),
	(4, 16, 'Jueves', '06:00:00', '22:00:00', 1),
	(5, 16, 'Viernes', '06:00:00', '23:00:00', 1),
	(6, 16, 'Sabado', '07:00:00', '23:00:00', 1),
	(7, 16, 'Domingo', '08:00:00', '20:00:00', 1),
	(8, 17, 'Lunes', '07:00:00', '21:00:00', 1),
	(9, 17, 'Martes', '07:00:00', '21:00:00', 1),
	(10, 17, 'Miercoles', '07:00:00', '21:00:00', 1),
	(11, 17, 'Jueves', '07:00:00', '21:00:00', 1),
	(12, 17, 'Viernes', '07:00:00', '22:00:00', 1),
	(13, 17, 'Sabado', '08:00:00', '22:00:00', 1),
	(14, 17, 'Domingo', '09:00:00', '19:00:00', 1),
	(15, 18, 'Lunes', '07:00:00', '21:00:00', 1),
	(16, 18, 'Martes', '07:00:00', '21:00:00', 1),
	(17, 18, 'Miercoles', '07:00:00', '21:00:00', 1),
	(18, 18, 'Jueves', '07:00:00', '21:00:00', 1),
	(19, 18, 'Viernes', '07:00:00', '22:00:00', 1),
	(20, 18, 'Sabado', '08:00:00', '22:00:00', 1),
	(21, 18, 'Domingo', '09:00:00', '19:00:00', 1),
	(22, 19, 'Lunes', '08:00:00', '20:00:00', 1),
	(23, 19, 'Martes', '08:00:00', '20:00:00', 1),
	(24, 19, 'Miercoles', '08:00:00', '20:00:00', 1),
	(25, 19, 'Jueves', '08:00:00', '20:00:00', 1),
	(26, 19, 'Viernes', '08:00:00', '21:00:00', 1),
	(27, 19, 'Sabado', '09:00:00', '21:00:00', 1),
	(28, 19, 'Domingo', '10:00:00', '18:00:00', 1),
	(29, 20, 'Lunes', '07:00:00', '21:00:00', 1),
	(30, 20, 'Martes', '07:00:00', '21:00:00', 1),
	(31, 20, 'Miercoles', '07:00:00', '21:00:00', 1),
	(32, 20, 'Jueves', '07:00:00', '21:00:00', 1),
	(33, 20, 'Viernes', '07:00:00', '22:00:00', 1),
	(34, 20, 'Sabado', '08:00:00', '22:00:00', 1),
	(35, 20, 'Domingo', '09:00:00', '19:00:00', 1),
	(36, 21, 'Lunes', '06:00:00', '21:00:00', 1),
	(37, 21, 'Martes', '06:00:00', '21:00:00', 1),
	(38, 21, 'Miercoles', '06:00:00', '21:00:00', 1),
	(39, 21, 'Jueves', '06:00:00', '21:00:00', 1),
	(40, 21, 'Viernes', '06:00:00', '22:00:00', 1),
	(41, 21, 'Sabado', '07:00:00', '22:00:00', 1),
	(42, 21, 'Domingo', '08:00:00', '20:00:00', 1),
	(43, 22, 'Lunes', '07:00:00', '21:00:00', 1),
	(44, 22, 'Martes', '07:00:00', '21:00:00', 1),
	(45, 22, 'Miercoles', '07:00:00', '21:00:00', 1),
	(46, 22, 'Jueves', '07:00:00', '21:00:00', 1),
	(47, 22, 'Viernes', '07:00:00', '22:00:00', 1),
	(48, 22, 'Sabado', '08:00:00', '22:00:00', 1),
	(49, 22, 'Domingo', '09:00:00', '19:00:00', 1),
	(50, 23, 'Lunes', '08:00:00', '20:00:00', 1),
	(51, 23, 'Martes', '08:00:00', '20:00:00', 1),
	(52, 23, 'Miercoles', '08:00:00', '20:00:00', 1),
	(53, 23, 'Jueves', '08:00:00', '20:00:00', 1),
	(54, 23, 'Viernes', '08:00:00', '21:00:00', 1),
	(55, 23, 'Sabado', '09:00:00', '21:00:00', 1),
	(56, 23, 'Domingo', '10:00:00', '18:00:00', 1),
	(57, 24, 'Lunes', '07:00:00', '20:00:00', 1),
	(58, 24, 'Martes', '07:00:00', '20:00:00', 1),
	(59, 24, 'Miercoles', '07:00:00', '20:00:00', 1),
	(60, 24, 'Jueves', '07:00:00', '20:00:00', 1),
	(61, 24, 'Viernes', '07:00:00', '21:00:00', 1),
	(62, 24, 'Sabado', '08:00:00', '21:00:00', 1),
	(63, 24, 'Domingo', '09:00:00', '19:00:00', 1),
	(64, 25, 'Lunes', '08:00:00', '18:00:00', 1),
	(65, 25, 'Martes', '08:00:00', '18:00:00', 1),
	(66, 25, 'Miercoles', '08:00:00', '18:00:00', 1),
	(67, 25, 'Jueves', '08:00:00', '18:00:00', 1),
	(68, 25, 'Viernes', '08:00:00', '20:00:00', 1),
	(69, 25, 'Sabado', '09:00:00', '21:00:00', 1),
	(70, 25, 'Domingo', '10:00:00', '18:00:00', 1),
	(71, 26, 'Lunes', '07:00:00', '20:00:00', 1),
	(72, 26, 'Martes', '07:00:00', '20:00:00', 1),
	(73, 26, 'Miercoles', '07:00:00', '20:00:00', 1),
	(74, 26, 'Jueves', '07:00:00', '20:00:00', 1),
	(75, 26, 'Viernes', '07:00:00', '21:00:00', 1),
	(76, 26, 'Sabado', '08:00:00', '21:00:00', 1),
	(77, 26, 'Domingo', '09:00:00', '19:00:00', 1),
	(85, 28, 'Lunes', '00:00:00', '00:00:00', 0),
	(86, 28, 'Martes', '00:00:00', '00:00:00', 0),
	(87, 28, 'Miercoles', '00:00:00', '00:00:00', 0),
	(88, 28, 'Jueves', '00:00:00', '00:00:00', 0),
	(89, 28, 'Viernes', '00:00:00', '00:00:00', 0),
	(90, 28, 'Sabado', '00:00:00', '00:00:00', 0),
	(91, 28, 'Domingo', '00:00:00', '00:00:00', 0),
	(92, 27, 'Lunes', '08:00:00', '20:00:00', 1),
	(93, 27, 'Martes', '07:00:00', '20:00:00', 1),
	(94, 27, 'Miercoles', '07:00:00', '20:00:00', 1),
	(95, 27, 'Jueves', '07:00:00', '20:00:00', 1),
	(96, 27, 'Viernes', '07:00:00', '21:00:00', 1),
	(97, 27, 'Sabado', '08:00:00', '21:00:00', 1),
	(98, 27, 'Domingo', '09:00:00', '19:00:00', 1),
	(120, 32, 'Lunes', '07:00:00', '21:00:00', 1),
	(121, 32, 'Martes', '07:00:00', '21:00:00', 1),
	(122, 32, 'Miercoles', '07:00:00', '21:00:00', 1),
	(123, 32, 'Jueves', '07:00:00', '21:00:00', 1),
	(124, 32, 'Viernes', '07:00:00', '21:00:00', 1),
	(125, 32, 'Sabado', '07:00:00', '21:00:00', 1),
	(126, 32, 'Domingo', '07:00:00', '21:00:00', 1),
	(134, 31, 'Lunes', '07:00:00', '21:00:00', 1),
	(135, 31, 'Martes', '07:00:00', '21:00:00', 1),
	(136, 31, 'Miercoles', '07:00:00', '21:00:00', 1),
	(137, 31, 'Jueves', '07:00:00', '21:00:00', 1),
	(138, 31, 'Viernes', '07:00:00', '21:00:00', 1),
	(139, 31, 'Sabado', '07:00:00', '21:00:00', 1),
	(140, 31, 'Domingo', '07:00:00', '21:00:00', 1),
	(141, 34, 'Lunes', '07:00:00', '21:00:00', 1),
	(142, 34, 'Martes', '07:00:00', '21:00:00', 1),
	(143, 34, 'Miercoles', '07:00:00', '21:00:00', 1),
	(144, 34, 'Jueves', '07:00:00', '21:00:00', 1),
	(145, 34, 'Viernes', '07:00:00', '21:00:00', 1),
	(146, 34, 'Sabado', '07:00:00', '21:00:00', 1),
	(147, 34, 'Domingo', '07:00:00', '21:00:00', 1),
	(148, 33, 'Lunes', '07:00:00', '21:00:00', 1),
	(149, 33, 'Martes', '07:00:00', '21:00:00', 1),
	(150, 33, 'Miercoles', '07:00:00', '21:00:00', 1),
	(151, 33, 'Jueves', '07:00:00', '21:00:00', 1),
	(152, 33, 'Viernes', '07:00:00', '21:00:00', 1),
	(153, 33, 'Sabado', '07:00:00', '21:00:00', 1),
	(154, 33, 'Domingo', '07:00:00', '21:00:00', 1);

-- Volcando estructura para tabla railway.deportes
CREATE TABLE IF NOT EXISTS `deportes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla railway.deportes: ~3 rows (aproximadamente)
INSERT INTO `deportes` (`id`, `nombre`) VALUES
	(1, 'futbol'),
	(2, 'voley'),
	(3, 'basquet');

-- Volcando estructura para tabla railway.equipos
CREATE TABLE IF NOT EXISTS `equipos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `deporte_id` int(11) NOT NULL,
  `creador_id` int(11) NOT NULL,
  `limite_miembros` int(11) NOT NULL DEFAULT 10,
  `privado` tinyint(1) NOT NULL DEFAULT 0,
  `estado` tinyint(1) NOT NULL DEFAULT 1,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `deporte_id` (`deporte_id`),
  KEY `creador_id` (`creador_id`),
  CONSTRAINT `equipos_ibfk_1` FOREIGN KEY (`deporte_id`) REFERENCES `deportes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `equipos_ibfk_2` FOREIGN KEY (`creador_id`) REFERENCES `usuarios_deportistas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla railway.equipos: ~5 rows (aproximadamente)
INSERT INTO `equipos` (`id`, `nombre`, `descripcion`, `deporte_id`, `creador_id`, `limite_miembros`, `privado`, `estado`, `creado_en`) VALUES
	(1, 'FC Vodka Juniors', 'La nueva generación de apasionados por el deporte y la chela', 1, 2, 10, 1, 1, '2025-06-02 19:38:20'),
	(2, 'Las Mariposas', 'Somos mariposas en la cancha de voley xd', 2, 2, 10, 1, 1, '2025-06-02 21:34:35'),
	(3, 'Los Negros James', 'Somos los mas negros de todo Tacna, tiemblen ante nuestro Bascket de negros', 3, 2, 10, 1, 1, '2025-06-03 21:53:45'),
	(4, 'Los cojos de EPIS', 'Somos mariposas', 1, 2, 10, 0, 1, '2025-06-06 00:03:00'),
	(5, 'mongosdeverdad', 'dffdfdf', 1, 2, 10, 0, 1, '2025-06-06 00:21:20');

-- Volcando estructura para tabla railway.equipo_miembros
CREATE TABLE IF NOT EXISTS `equipo_miembros` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `equipo_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `rol` enum('creador','administrador','miembro') NOT NULL DEFAULT 'miembro',
  `fecha_union` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `equipo_usuario_unico` (`equipo_id`,`usuario_id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `equipo_miembros_ibfk_1` FOREIGN KEY (`equipo_id`) REFERENCES `equipos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `equipo_miembros_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios_deportistas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla railway.equipo_miembros: ~12 rows (aproximadamente)
INSERT INTO `equipo_miembros` (`id`, `equipo_id`, `usuario_id`, `rol`, `fecha_union`) VALUES
	(1, 1, 2, 'creador', '2025-06-02 19:38:20'),
	(2, 2, 2, 'creador', '2025-06-02 21:34:35'),
	(3, 1, 3, 'miembro', '2025-06-03 21:31:29'),
	(4, 2, 4, 'miembro', '2025-06-03 21:31:35'),
	(5, 1, 4, 'miembro', '2025-06-03 21:33:52'),
	(6, 3, 2, 'creador', '2025-06-03 21:53:45'),
	(7, 3, 3, 'miembro', '2025-06-04 21:32:01'),
	(8, 4, 2, 'creador', '2025-06-06 00:03:00'),
	(9, 4, 4, 'miembro', '2025-06-06 00:03:24'),
	(10, 5, 2, 'creador', '2025-06-06 00:21:20'),
	(11, 5, 3, 'miembro', '2025-06-06 00:21:42'),
	(12, 5, 4, 'miembro', '2025-06-06 00:21:53');

-- Volcando estructura para tabla railway.horarios_atencion
CREATE TABLE IF NOT EXISTS `horarios_atencion` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `institucion_deportiva_id` int(11) NOT NULL,
  `dia` enum('Lunes','Martes','Miercoles','Jueves','Viernes','Sabado','Domingo') NOT NULL,
  `hora_apertura` time NOT NULL,
  `hora_cierre` time NOT NULL,
  PRIMARY KEY (`id`),
  KEY `institucion_deportiva_id` (`institucion_deportiva_id`),
  CONSTRAINT `horarios_atencion_ibfk_1` FOREIGN KEY (`institucion_deportiva_id`) REFERENCES `instituciones_deportivas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla railway.horarios_atencion: ~21 rows (aproximadamente)
INSERT INTO `horarios_atencion` (`id`, `institucion_deportiva_id`, `dia`, `hora_apertura`, `hora_cierre`) VALUES
	(1, 1, 'Lunes', '07:00:00', '22:00:00'),
	(2, 1, 'Martes', '07:00:00', '22:00:00'),
	(3, 1, 'Miercoles', '07:00:00', '22:00:00'),
	(4, 1, 'Jueves', '07:00:00', '22:00:00'),
	(5, 1, 'Viernes', '07:00:00', '23:00:00'),
	(6, 1, 'Sabado', '08:00:00', '23:00:00'),
	(7, 1, 'Domingo', '08:00:00', '20:00:00'),
	(8, 2, 'Lunes', '06:00:00', '21:00:00'),
	(9, 2, 'Martes', '06:00:00', '21:00:00'),
	(10, 2, 'Miercoles', '06:00:00', '21:00:00'),
	(11, 2, 'Jueves', '06:00:00', '21:00:00'),
	(12, 2, 'Viernes', '06:00:00', '21:00:00'),
	(13, 2, 'Sabado', '08:00:00', '22:00:00'),
	(14, 2, 'Domingo', '08:00:00', '19:00:00'),
	(15, 3, 'Lunes', '08:00:00', '22:00:00'),
	(16, 3, 'Martes', '08:00:00', '22:00:00'),
	(17, 3, 'Miercoles', '08:00:00', '22:00:00'),
	(18, 3, 'Jueves', '08:00:00', '22:00:00'),
	(19, 3, 'Viernes', '08:00:00', '23:30:00'),
	(20, 3, 'Sabado', '09:00:00', '23:30:00'),
	(21, 3, 'Domingo', '09:00:00', '21:00:00');

-- Volcando estructura para tabla railway.instalaciones_ocupaciones
CREATE TABLE IF NOT EXISTS `instalaciones_ocupaciones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `institucion_deportiva_id` int(11) NOT NULL,
  `fecha` date NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fin` time NOT NULL,
  `tipo_ocupacion` enum('reserva_individual','partido_equipos','torneo','mantenimiento','evento_especial') NOT NULL,
  `estado` enum('reservado','confirmado','en_curso','finalizado','cancelado') DEFAULT 'reservado',
  `usuario_reserva_id` int(11) DEFAULT NULL,
  `equipo_local_id` int(11) DEFAULT NULL,
  `equipo_visitante_id` int(11) DEFAULT NULL,
  `torneo_partido_id` int(11) DEFAULT NULL,
  `torneo_id` int(11) DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  `costo` decimal(10,2) DEFAULT 0.00,
  `creado_por_usuario_id` int(11) NOT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `ultima_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_institucion_fecha` (`institucion_deportiva_id`,`fecha`),
  KEY `idx_fecha_hora` (`fecha`,`hora_inicio`,`hora_fin`),
  KEY `idx_tipo_estado` (`tipo_ocupacion`,`estado`),
  KEY `ocupaciones_ibfk_2` (`usuario_reserva_id`),
  KEY `ocupaciones_ibfk_3` (`equipo_local_id`),
  KEY `ocupaciones_ibfk_4` (`equipo_visitante_id`),
  KEY `ocupaciones_ibfk_5` (`torneo_partido_id`),
  KEY `ocupaciones_ibfk_6` (`torneo_id`),
  KEY `ocupaciones_ibfk_7` (`creado_por_usuario_id`),
  CONSTRAINT `ocupaciones_ibfk_1` FOREIGN KEY (`institucion_deportiva_id`) REFERENCES `instituciones_deportivas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ocupaciones_ibfk_2` FOREIGN KEY (`usuario_reserva_id`) REFERENCES `usuarios_deportistas` (`id`) ON DELETE SET NULL,
  CONSTRAINT `ocupaciones_ibfk_3` FOREIGN KEY (`equipo_local_id`) REFERENCES `equipos` (`id`) ON DELETE SET NULL,
  CONSTRAINT `ocupaciones_ibfk_4` FOREIGN KEY (`equipo_visitante_id`) REFERENCES `equipos` (`id`) ON DELETE SET NULL,
  CONSTRAINT `ocupaciones_ibfk_5` FOREIGN KEY (`torneo_partido_id`) REFERENCES `torneos_partidos` (`id`) ON DELETE SET NULL,
  CONSTRAINT `ocupaciones_ibfk_6` FOREIGN KEY (`torneo_id`) REFERENCES `torneos` (`id`) ON DELETE SET NULL,
  CONSTRAINT `ocupaciones_ibfk_7` FOREIGN KEY (`creado_por_usuario_id`) REFERENCES `usuarios_deportistas` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla railway.instalaciones_ocupaciones: ~0 rows (aproximadamente)

-- Volcando estructura para tabla railway.instituciones_deportes
CREATE TABLE IF NOT EXISTS `instituciones_deportes` (
  `institucion_deportiva_id` int(11) NOT NULL,
  `deporte_id` int(11) NOT NULL,
  PRIMARY KEY (`institucion_deportiva_id`,`deporte_id`),
  KEY `deporte_id` (`deporte_id`),
  CONSTRAINT `instituciones_deportes_ibfk_1` FOREIGN KEY (`institucion_deportiva_id`) REFERENCES `instituciones_deportivas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `instituciones_deportes_ibfk_2` FOREIGN KEY (`deporte_id`) REFERENCES `deportes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla railway.instituciones_deportes: ~9 rows (aproximadamente)
INSERT INTO `instituciones_deportes` (`institucion_deportiva_id`, `deporte_id`) VALUES
	(1, 1),
	(2, 1),
	(2, 2),
	(2, 3),
	(3, 1),
	(3, 3),
	(4, 1),
	(4, 2),
	(4, 3);

-- Volcando estructura para tabla railway.instituciones_deportivas
CREATE TABLE IF NOT EXISTS `instituciones_deportivas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_instalacion_id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `ruc` varchar(11) NOT NULL,
  `direccion` varchar(200) NOT NULL,
  `latitud` decimal(10,8) NOT NULL,
  `longitud` decimal(11,8) NOT NULL,
  `imagen` varchar(255) DEFAULT NULL,
  `tarifa` decimal(10,2) NOT NULL,
  `calificacion` decimal(3,2) DEFAULT 0.00,
  `telefono` varchar(20) NOT NULL,
  `email` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `estado` tinyint(1) NOT NULL DEFAULT 1,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `razon_social_sunat` varchar(255) DEFAULT NULL,
  `direccion_sunat` varchar(255) DEFAULT NULL,
  `distrito_sunat` varchar(100) DEFAULT NULL,
  `provincia_sunat` varchar(100) DEFAULT NULL,
  `departamento_sunat` varchar(100) DEFAULT NULL,
  `estado_sunat` varchar(50) DEFAULT NULL,
  `condicion_sunat` varchar(50) DEFAULT NULL,
  `documento_legal` varchar(255) DEFAULT NULL,
  `fecha_registro` datetime DEFAULT current_timestamp(),
  `estado_aprobacion` varchar(50) DEFAULT 'PENDIENTE',
  PRIMARY KEY (`id`),
  UNIQUE KEY `ruc_institucion_unique` (`ruc`) USING BTREE,
  KEY `usuario_instalacion_id` (`usuario_instalacion_id`),
  CONSTRAINT `instituciones_deportivas_ibfk_1` FOREIGN KEY (`usuario_instalacion_id`) REFERENCES `usuarios_instalaciones` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla railway.instituciones_deportivas: ~10 rows (aproximadamente)
INSERT INTO `instituciones_deportivas` (`id`, `usuario_instalacion_id`, `nombre`, `ruc`, `direccion`, `latitud`, `longitud`, `imagen`, `tarifa`, `calificacion`, `telefono`, `email`, `descripcion`, `estado`, `creado_en`, `razon_social_sunat`, `direccion_sunat`, `distrito_sunat`, `provincia_sunat`, `departamento_sunat`, `estado_sunat`, `condicion_sunat`, `documento_legal`, `fecha_registro`, `estado_aprobacion`) VALUES
	(1, 1, 'Top Gol Tacna', '00000000001', 'Av. Bolognesi 1234, Tacna', -17.99927959, -70.23738205, 'https://i.ibb.co/dJG8hdzS/images.png', 51.00, 4.50, '946143071', 'contacto@topgoltacna.com', 'Canchas de fútbol con césped sintético de primera calidad PREMIUM', 1, '2025-05-21 19:15:21', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-06-25 15:11:48', 'PENDIENTE'),
	(2, 1, 'Complejo Deportivo Municipal', '00000000002', 'Calle Patricio Meléndez 500, Tacna', -18.01220000, -70.25360000, 'https://i.ibb.co/Qvc2gsKS/complejodeportivo.jpg', 35.00, 4.20, '052987654', 'deportes@munitacna.gob.pe', 'Complejo deportivo municipal con múltiples canchas', 1, '2025-05-21 19:15:21', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-06-25 15:11:48', 'PENDIENTE'),
	(3, 1, 'Club Deportivo Tacna', '00000000003', 'Av. Cusco 750, Tacna', -18.00550000, -70.23980000, 'https://i.ibb.co/gb2kHZCq/111111.jpg', 65.00, 4.80, '052456789', 'info@clubdeportivotacna.com', 'Club exclusivo con instalaciones de primer nivel', 1, '2025-05-21 19:15:21', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-06-25 15:11:48', 'PENDIENTE'),
	(4, 2, 'IPD Tacna - Complejo Deportivo "LOS GRANADOS"', '00000000004', 'Calle Enrique Quijano', -18.00605910, -70.25475097, 'https://i.ibb.co/KjNmNbTr/images.jpg', 25.00, 5.00, '052-427070', 'ipd.tacna@ipd.gob.pe', 'Complejo deportivo del Instituto Peruano del Deporte', 1, '2025-06-04 20:03:09', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-06-25 15:11:48', 'PENDIENTE'),
	(5, 2, 'IPD Tacna - Estadio Pallardelle', '00000000005', 'Av. Augusto Bernardino Leguia', -18.00148792, -70.23597550, 'https://i.ibb.co/bMXJzNpS/images-1.jpg', 0.00, 0.00, '052-123456', 'ipd.tacna@ipd.gob.pe', 'Instalaciones Modernas', 1, '2025-06-23 21:25:10', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-06-25 15:11:48', 'PENDIENTE'),
	(6, 2, 'IPD Tacna - Coliseo Peru', '00000000006', 'Gral Deustua, Tacna ', -18.00558362, -70.25426817, 'https://i.ibb.co/BKHDLRq8/images-2.jpg', 40.00, 0.00, '052-456789', 'ipd.tacna@ipd.gob.pe', 'Coliseo Peru ', 1, '2025-06-23 21:57:34', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-06-25 15:11:48', 'PENDIENTE'),
	(7, 2, 'IPD Tacna - Estadio Jorge Basadre Grohman', '00000000007', 'Av. Coronel Justo Arias Araguez, Tacna 23001', -18.00537687, -70.25397098, 'https://i.ibb.co/hRxcH99R/Estadio-de-Tacna.jpg', 0.00, 0.00, '052-456789', 'ipd.tacna@ipd.gob.pe', 'Area Multidiciplinarias', 1, '2025-06-23 22:00:14', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-06-25 15:11:48', 'PENDIENTE'),
	(8, 5, 'canchapero', '99999999999', '0', 0.00000000, 0.00000000, NULL, 0.00, 0.00, 'N/A', 'myrayita2004@gmail.com', NULL, 1, '2025-06-24 22:21:20', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-06-25 15:11:48', 'PENDIENTE'),
	(9, 6, 'Victor Cruz Mamani', '12345678901', '0', 0.00000000, 0.00000000, NULL, 0.00, 0.00, 'N/A', 'pepito@gmail.com', NULL, 1, '2025-06-24 23:51:31', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-06-25 15:11:48', 'PENDIENTE'),
	(10, 9, 'canchitaaauwu', '11111111112', '0', 0.00000000, 0.00000000, NULL, 0.00, 0.00, 'N/A', 'ac2022074258@virtual.upt.pe', NULL, 1, '2025-06-25 19:13:10', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-06-25 19:13:10', 'PENDIENTE');

-- Volcando estructura para tabla railway.password_recovery_tokens
CREATE TABLE IF NOT EXISTS `password_recovery_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_type` enum('deportista','instalacion') NOT NULL,
  `user_id` int(11) NOT NULL,
  `email` varchar(100) NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `used_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `idx_user_type_id` (`user_type`,`user_id`),
  KEY `idx_token_expires` (`token`,`expires_at`),
  KEY `idx_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla railway.password_recovery_tokens: ~7 rows (aproximadamente)
INSERT INTO `password_recovery_tokens` (`id`, `user_type`, `user_id`, `email`, `token`, `expires_at`, `used`, `created_at`, `used_at`) VALUES
	(1, 'deportista', 7, 'ac202207425@virtual.upt.pe', 'f65f62e854024b73c15a61761e8c09926c94067a449050162b8f90cdf76f52aa', '2025-06-23 01:26:54', 1, '2025-06-23 00:26:54', '2025-06-23 00:27:32'),
	(2, 'deportista', 7, 'ac202207425@virtual.upt.pe', '3eefa26bceb6cfb3a71706dc811542d89ff2d667ef4421753ec8a7f5a8234c1b', '2025-06-23 01:32:57', 1, '2025-06-23 00:32:57', '2025-06-23 00:33:25'),
	(3, 'deportista', 7, 'ac202207425@virtual.upt.pe', '1852abf95a064508edfcdc17c9993ad4a7b7e61ba86e86590a6407332839f461', '2025-06-23 01:35:37', 1, '2025-06-23 00:35:37', '2025-06-23 00:35:58'),
	(4, 'deportista', 2, 'fuentessebastiansa4s@gmail.com', '5548ab1d30ecec09a7fa34de4b0c374130715e007110f5a42857ca1a9ac590e0', '2025-06-23 22:31:23', 0, '2025-06-23 21:31:23', NULL),
	(5, 'deportista', 7, 'ac202207425@virtual.upt.pe', '5a54a849416da999c5c02e1e255bcd6181b323f790712c8456b0732abead3939', '2025-06-23 22:33:21', 0, '2025-06-23 21:33:21', NULL),
	(6, 'deportista', 2, 'fuentessebastiansa4s@gmail.com', '757ca91c6a88e111f7b3780fd8a32c076f089033af231bb89177ef6092a94923', '2025-06-23 22:40:38', 0, '2025-06-23 21:40:38', NULL),
	(7, 'deportista', 2, 'fuentessebastiansa4s@gmail.com', '86c4e46bb2a33180580b3c7d87e35e8dfd8fd0460fda727122781dcc552f7dec', '2025-06-23 22:40:45', 0, '2025-06-23 21:40:45', NULL);

-- Volcando estructura para tabla railway.reservas
CREATE TABLE IF NOT EXISTS `reservas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) NOT NULL,
  `area_deportiva_id` int(11) NOT NULL,
  `fecha` date NOT NULL,
  `hora_inicio` time NOT NULL,
  `hora_fin` time NOT NULL,
  `estado` enum('pendiente','confirmada','cancelada') NOT NULL DEFAULT 'pendiente',
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `culqi_charge_id` varchar(100) DEFAULT NULL,
  `culqi_order_id` varchar(100) DEFAULT NULL,
  `monto_pagado` decimal(10,2) DEFAULT NULL,
  `metodo_pago` enum('culqi','paypal','efectivo','transferencia') DEFAULT 'culqi',
  `paypal_payment_id` varchar(100) DEFAULT NULL,
  `paypal_payer_id` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id_usuario` (`id_usuario`),
  KEY `area_deportiva_id` (`area_deportiva_id`),
  CONSTRAINT `reservas_ibfk_area` FOREIGN KEY (`area_deportiva_id`) REFERENCES `areas_deportivas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reservas_ibfk_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios_deportistas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla railway.reservas: ~8 rows (aproximadamente)
INSERT INTO `reservas` (`id`, `id_usuario`, `area_deportiva_id`, `fecha`, `hora_inicio`, `hora_fin`, `estado`, `creado_en`, `culqi_charge_id`, `culqi_order_id`, `monto_pagado`, `metodo_pago`, `paypal_payment_id`, `paypal_payer_id`) VALUES
	(1, 2, 16, '2025-06-17', '07:00:00', '08:00:00', 'confirmada', '2025-06-17 07:47:20', NULL, NULL, NULL, 'culqi', NULL, NULL),
	(2, 3, 16, '2025-06-17', '10:00:00', '12:00:00', 'confirmada', '2025-06-17 07:47:20', NULL, NULL, NULL, 'culqi', NULL, NULL),
	(3, 4, 16, '2025-06-17', '16:00:00', '17:30:00', 'confirmada', '2025-06-17 07:47:20', NULL, NULL, NULL, 'culqi', NULL, NULL),
	(4, 2, 18, '2025-06-17', '08:00:00', '09:00:00', 'confirmada', '2025-06-17 07:47:20', NULL, NULL, NULL, 'culqi', NULL, NULL),
	(5, 2, 16, '2025-06-18', '09:00:00', '10:30:00', 'confirmada', '2025-06-17 07:47:20', NULL, NULL, NULL, 'culqi', NULL, NULL),
	(6, 3, 18, '2025-06-18', '15:00:00', '16:30:00', 'pendiente', '2025-06-17 07:47:20', NULL, NULL, NULL, 'culqi', NULL, NULL),
	(7, 2, 17, '2025-06-25', '20:00:00', '20:30:00', 'confirmada', '2025-06-25 21:48:19', NULL, NULL, 0.50, 'paypal', '98R73874S3193492A', 'DP7ZZ67LYCKYE'),
	(8, 2, 17, '2025-06-25', '20:30:00', '21:00:00', 'confirmada', '2025-06-25 22:44:25', NULL, NULL, 0.50, 'paypal', '3LH16633A3563271T', 'DP7ZZ67LYCKYE');

-- Volcando estructura para tabla railway.solicitudes_registro
CREATE TABLE IF NOT EXISTS `solicitudes_registro` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre_institucion` varchar(255) NOT NULL,
  `ruc` varchar(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `documento_path` varchar(255) NOT NULL,
  `estado` enum('pendiente','aprobada','rechazada') NOT NULL DEFAULT 'pendiente',
  `motivo_rechazo` text DEFAULT NULL,
  `fecha_solicitud` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_revision` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  `revisado_por` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla railway.solicitudes_registro: ~7 rows (aproximadamente)
INSERT INTO `solicitudes_registro` (`id`, `nombre_institucion`, `ruc`, `email`, `password`, `documento_path`, `estado`, `motivo_rechazo`, `fecha_solicitud`, `fecha_revision`, `revisado_por`) VALUES
	(1, 'canchaCali', '88888888888', 'ac2022074258@virtual.upt.pe', '$2y$10$Mtq8ALC8kFYe.6VgDUG8uumqJBqfDW3vm16sZQfS70zaGyVPuDQfu', 'https://cdn.filestackcontent.com/C1fy4n68TUOv2xPGyZ8n', 'rechazada', 'Por ser muy CRACK Gaaa', '2025-06-24 20:53:52', '2025-06-25 16:29:40', 1),
	(2, 'canchapero', '99999999999', 'myrayita2004@gmail.com', '$2y$10$ndWhStrtgsn7lx/3RpZdYueOQJ15ceFgLZyAgw3nRRnaTHFR4S4gK', 'https://cdn.filestackcontent.com/bDeKviLRSwe1Zl66GbP8', 'aprobada', NULL, '2025-06-24 21:14:51', '2025-06-24 22:21:20', 1),
	(3, 'Victor Cruz Mamani', '12345678901', 'pepito@gmail.com', '$2y$10$vzxkUGK7DwOGFCI4d6Rki.VEARpJo3Ii3Z/zqeJVgHFzxZI526wEO', 'https://cdn.filestackcontent.com/UXmDlyrcT6mx4Y9tQu6H', 'aprobada', NULL, '2025-06-24 23:50:27', '2025-06-24 23:51:31', 1),
	(10, 'a', '10987654321', 'a@xd.com', '$2y$10$pLT3NHNKKsB3zTnlYZH3qObNk8JP5B2Y02pAOYWJl1c8EvIpedyKm', 'https://cdn.filestackcontent.com/rwjNbpmXSEue753cKjhR', 'pendiente', NULL, '2025-06-25 17:01:56', NULL, NULL),
	(13, 'canchitaaauwu', '11111111112', 'ac2022074258@virtual.upt.pe', '$2y$10$i8C1.NrMbHwtYcaXCWNO/eDfegTNYqQxyRAZLoj.J/NwtDjjhunbC', 'https://cdn.filestackcontent.com/DWIvcFYYS36NIMA89IMB', 'aprobada', NULL, '2025-06-25 17:21:26', '2025-06-25 19:13:10', 1),
	(14, 'Canchas Gaby', '10719874008', 'gg2022074263@virtual.upt.pe', '$2y$10$yAvSi16YLjWf2ms7tg77U.ElGvnBYf06jAZbCZqjTqpNl79IYPJAO', 'https://cdn.filestackcontent.com/Qj99ifrQySACjIlbyXR3', 'rechazada', 'gaaaaaaaaaa', '2025-06-25 22:21:55', '2025-06-25 22:23:38', 1),
	(15, 'gabycanchas', '10719874008', 'gg2022074263@virtual.upt.pe', '$2y$10$KLmeGAYWzTmYAzioKLT8JOpm4OPswatZpm9XZkF0GVILygdUtycde', 'https://cdn.filestackcontent.com/ZPvuJ0nlQhK2jniK22XQ', 'rechazada', 'ddddddddd', '2025-06-25 22:39:01', '2025-06-25 22:39:29', 1);

-- Volcando estructura para tabla railway.torneos
CREATE TABLE IF NOT EXISTS `torneos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `deporte_id` int(11) NOT NULL,
  `organizador_tipo` enum('institucion','ipd') NOT NULL,
  `organizador_id` int(11) NOT NULL,
  `institucion_sede_id` int(11) NOT NULL,
  `max_equipos` int(11) NOT NULL DEFAULT 16,
  `equipos_inscritos` int(11) NOT NULL DEFAULT 0,
  `fecha_inicio` date NOT NULL,
  `fecha_fin` date DEFAULT NULL,
  `fecha_inscripcion_inicio` date NOT NULL,
  `fecha_inscripcion_fin` date NOT NULL,
  `estado` enum('proximo','inscripciones_abiertas','inscripciones_cerradas','activo','finalizado','cancelado') NOT NULL DEFAULT 'proximo',
  `modalidad` enum('eliminacion_simple','eliminacion_doble','todos_contra_todos','grupos_eliminatoria') NOT NULL DEFAULT 'eliminacion_simple',
  `premio_1` varchar(255) DEFAULT NULL,
  `premio_2` varchar(255) DEFAULT NULL,
  `premio_3` varchar(255) DEFAULT NULL,
  `costo_inscripcion` decimal(10,2) DEFAULT 0.00,
  `imagen_torneo` varchar(255) DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_organizador` (`organizador_tipo`,`organizador_id`),
  KEY `idx_estado` (`estado`),
  KEY `idx_deporte` (`deporte_id`),
  KEY `idx_fechas` (`fecha_inicio`,`fecha_fin`),
  KEY `idx_sede` (`institucion_sede_id`),
  CONSTRAINT `torneos_ibfk_1` FOREIGN KEY (`deporte_id`) REFERENCES `deportes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `torneos_ibfk_2` FOREIGN KEY (`institucion_sede_id`) REFERENCES `instituciones_deportivas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla railway.torneos: ~3 rows (aproximadamente)
INSERT INTO `torneos` (`id`, `nombre`, `descripcion`, `deporte_id`, `organizador_tipo`, `organizador_id`, `institucion_sede_id`, `max_equipos`, `equipos_inscritos`, `fecha_inicio`, `fecha_fin`, `fecha_inscripcion_inicio`, `fecha_inscripcion_fin`, `estado`, `modalidad`, `premio_1`, `premio_2`, `premio_3`, `costo_inscripcion`, `imagen_torneo`, `creado_en`, `actualizado_en`) VALUES
	(7, 'CHAMPIONS LEAGUE TACNA - APERTURA I', 'La mejor edición Champions Tacna, ven, juega y gana y demuestra tus habilidades con tu equipo!', 1, 'institucion', 1, 1, 4, 0, '2025-07-20', '2025-07-20', '2025-06-30', '2025-07-10', 'inscripciones_abiertas', 'eliminacion_simple', 'Un arroz con Huevo', 'Un huevo sin arroz', 'Un arroz sin huevo', 120.00, 'https://i.ibb.co/BHQxk6nj/3d686d3b1636.jpg', '2025-06-19 03:00:18', '2025-06-25 21:48:56'),
	(9, 'Copa Verano 2025 - PRIMERA EDICIÓN', 'Copa Verano para comenzar bien el verano', 1, 'institucion', 1, 1, 4, 0, '2026-01-12', '2026-01-12', '2025-12-10', '2026-01-05', 'proximo', 'eliminacion_simple', 'Medalla Oro para el equipo + FIFA25', 'Medalla Plata para el equipo + 100 soles', 'Medalla Bronce para el equipo + un abrazo', 1.00, 'https://i.ibb.co/VWJCV83J/04a5002814d3.png', '2025-06-26 15:51:58', '2025-06-26 15:51:58'),
	(10, 'Copa Voley', 'Este formato de juego permite un total de seis jugadores en la cancha simultáneamente, designando las posiciones de "primera fila" y "última fila" en la cancha, diferenciadas por una línea de 3 m (10 pies). Todos los jugadores rotan en el sentido de las agujas del reloj por las seis posiciones en la cancha. El orden de rotación de los jugadores se denomina "orden de saque".\n\nCuando los jugadores están en la primera línea, pueden saltar y atacar por encima del plano de la red. Cuando están detrás de la línea de 3 metros, o en la última línea, solo pueden atacar desde detrás de la línea de 3 metros y ocupar una posición principalmente defensiva.\n\nEn el voleibol 6 contra 6 se observa la mayor especialización de jugadores, con posiciones dedicadas al pase/defensa, la colocación y el ataque/bloqueo. Para obtener la mayor ventaja posible contra el oponente, los equipos suelen organizar sus rotaciones de jugadores para ubicarlos estratégicamente en la mejor combinación posicional posible y así facilitar las jugadas ofensivas.\n\nPor ejemplo, muchos equipos utilizan un sistema 5-1 con un colocador designado, o un sistema 6-2 donde se designan dos colocadores, pero cada colocador sólo coloca desde la última fila para permitir que tres jugadores de la primera línea ataquen.\n\nEn general, el 6 contra 6 es una de las variantes más emocionantes y potentes de este deporte. El voleibol sentado también se juega en sala.', 2, 'institucion', 2, 6, 10, 0, '2025-06-30', '2025-07-02', '2025-06-26', '2025-06-28', 'proximo', 'eliminacion_simple', 'Medallas y S/.500', 'Medallas y S/.250', 'Medallas y certificados', 0.00, 'https://i.ibb.co/nG1LMX1/c4517ab3c662.jpg', '2025-06-26 16:36:26', '2025-06-26 16:36:26');

-- Volcando estructura para tabla railway.torneos_equipos
CREATE TABLE IF NOT EXISTS `torneos_equipos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `torneo_id` int(11) NOT NULL,
  `equipo_id` int(11) NOT NULL,
  `inscrito_por_usuario_id` int(11) NOT NULL,
  `fecha_inscripcion` timestamp NOT NULL DEFAULT current_timestamp(),
  `estado_inscripcion` enum('pendiente','confirmada','rechazada','retirado') DEFAULT 'pendiente',
  `metodo_pago` varchar(20) DEFAULT NULL,
  `transaction_id` varchar(100) DEFAULT NULL,
  `payer_id` varchar(100) DEFAULT NULL,
  `monto_pagado` decimal(10,2) DEFAULT 0.00,
  `comentarios` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `equipo_torneo_unico` (`torneo_id`,`equipo_id`),
  KEY `idx_torneo` (`torneo_id`),
  KEY `idx_equipo` (`equipo_id`),
  KEY `torneos_equipos_ibfk_3` (`inscrito_por_usuario_id`),
  CONSTRAINT `torneos_equipos_ibfk_1` FOREIGN KEY (`torneo_id`) REFERENCES `torneos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `torneos_equipos_ibfk_2` FOREIGN KEY (`equipo_id`) REFERENCES `equipos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `torneos_equipos_ibfk_3` FOREIGN KEY (`inscrito_por_usuario_id`) REFERENCES `usuarios_deportistas` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla railway.torneos_equipos: ~0 rows (aproximadamente)

-- Volcando estructura para tabla railway.torneos_estadisticas
CREATE TABLE IF NOT EXISTS `torneos_estadisticas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `torneo_id` int(11) NOT NULL,
  `equipo_id` int(11) NOT NULL,
  `partidos_jugados` int(11) DEFAULT 0,
  `partidos_ganados` int(11) DEFAULT 0,
  `partidos_perdidos` int(11) DEFAULT 0,
  `partidos_empatados` int(11) DEFAULT 0,
  `goles_favor` int(11) DEFAULT 0,
  `goles_contra` int(11) DEFAULT 0,
  `puntos` int(11) DEFAULT 0,
  `posicion_final` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `torneo_equipo_stats` (`torneo_id`,`equipo_id`),
  KEY `torneos_estadisticas_ibfk_2` (`equipo_id`),
  CONSTRAINT `torneos_estadisticas_ibfk_1` FOREIGN KEY (`torneo_id`) REFERENCES `torneos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `torneos_estadisticas_ibfk_2` FOREIGN KEY (`equipo_id`) REFERENCES `equipos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla railway.torneos_estadisticas: ~0 rows (aproximadamente)

-- Volcando estructura para tabla railway.torneos_partidos
CREATE TABLE IF NOT EXISTS `torneos_partidos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `torneo_id` int(11) NOT NULL,
  `area_deportiva_id` int(11) DEFAULT NULL,
  `equipo_local_id` int(11) DEFAULT NULL,
  `equipo_visitante_id` int(11) DEFAULT NULL,
  `fase` enum('primera_ronda','segunda_ronda','tercera_ronda','cuartos','semifinal','final','tercer_lugar') NOT NULL,
  `numero_partido` int(11) DEFAULT NULL,
  `ronda` int(11) DEFAULT NULL,
  `descripcion_partido` varchar(255) DEFAULT NULL,
  `numero_grupo` int(11) DEFAULT NULL,
  `fecha_partido` datetime NOT NULL,
  `resultado_local` int(11) DEFAULT NULL,
  `resultado_visitante` int(11) DEFAULT NULL,
  `equipo_ganador_id` int(11) DEFAULT NULL,
  `estado_partido` enum('programado','en_curso','finalizado','suspendido','cancelado') DEFAULT 'programado',
  `observaciones` text DEFAULT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_torneo_fase` (`torneo_id`,`fase`),
  KEY `idx_fecha` (`fecha_partido`),
  KEY `torneos_partidos_ibfk_2` (`equipo_local_id`),
  KEY `torneos_partidos_ibfk_3` (`equipo_visitante_id`),
  KEY `torneos_partidos_ibfk_4` (`equipo_ganador_id`),
  KEY `torneos_partidos_ibfk_area` (`area_deportiva_id`),
  KEY `idx_torneo_area` (`torneo_id`,`area_deportiva_id`),
  KEY `idx_ronda_partido` (`ronda`,`numero_partido`),
  KEY `idx_torneo_ronda` (`torneo_id`,`ronda`),
  CONSTRAINT `torneos_partidos_ibfk_1` FOREIGN KEY (`torneo_id`) REFERENCES `torneos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `torneos_partidos_ibfk_2` FOREIGN KEY (`equipo_local_id`) REFERENCES `equipos` (`id`),
  CONSTRAINT `torneos_partidos_ibfk_3` FOREIGN KEY (`equipo_visitante_id`) REFERENCES `equipos` (`id`),
  CONSTRAINT `torneos_partidos_ibfk_4` FOREIGN KEY (`equipo_ganador_id`) REFERENCES `equipos` (`id`),
  CONSTRAINT `torneos_partidos_ibfk_area` FOREIGN KEY (`area_deportiva_id`) REFERENCES `areas_deportivas` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla railway.torneos_partidos: ~17 rows (aproximadamente)
INSERT INTO `torneos_partidos` (`id`, `torneo_id`, `area_deportiva_id`, `equipo_local_id`, `equipo_visitante_id`, `fase`, `numero_partido`, `ronda`, `descripcion_partido`, `numero_grupo`, `fecha_partido`, `resultado_local`, `resultado_visitante`, `equipo_ganador_id`, `estado_partido`, `observaciones`, `creado_en`) VALUES
	(20, 7, 16, NULL, NULL, 'primera_ronda', NULL, NULL, 'Partido 1', NULL, '2025-07-20 08:00:00', NULL, NULL, NULL, 'programado', NULL, '2025-06-19 03:00:18'),
	(21, 7, 17, NULL, NULL, 'primera_ronda', NULL, NULL, 'Partido 2', NULL, '2025-07-20 09:00:00', NULL, NULL, NULL, 'programado', NULL, '2025-06-19 03:00:18'),
	(22, 7, 16, NULL, NULL, 'segunda_ronda', NULL, NULL, 'Partido 3', NULL, '2025-07-20 10:00:00', NULL, NULL, NULL, 'programado', NULL, '2025-06-19 03:00:18'),
	(26, 9, 16, NULL, NULL, 'primera_ronda', 1, 1, 'Primera Ronda - Partido 1', NULL, '2026-01-12 08:00:00', NULL, NULL, NULL, 'programado', NULL, '2025-06-26 15:51:58'),
	(27, 9, 17, NULL, NULL, 'primera_ronda', 2, 1, 'Primera Ronda - Partido 2', NULL, '2026-01-12 08:00:00', NULL, NULL, NULL, 'programado', NULL, '2025-06-26 15:51:58'),
	(28, 9, 16, NULL, NULL, 'final', 3, 2, 'Final - Partido 3', NULL, '2026-01-12 11:00:00', NULL, NULL, NULL, 'programado', NULL, '2025-06-26 15:51:58'),
	(29, 10, 34, NULL, NULL, 'primera_ronda', 1, 1, 'Primera Ronda - Partido 1', NULL, '2025-06-27 15:00:00', NULL, NULL, NULL, 'programado', NULL, '2025-06-26 16:36:26'),
	(30, 10, 34, NULL, NULL, 'primera_ronda', 2, 1, 'Primera Ronda - Partido 2', NULL, '2025-06-27 16:00:00', NULL, NULL, NULL, 'programado', NULL, '2025-06-26 16:36:26'),
	(31, 10, 34, NULL, NULL, 'primera_ronda', 3, 1, 'Primera Ronda - Partido 3', NULL, '2025-06-27 17:00:00', NULL, NULL, NULL, 'programado', NULL, '2025-06-26 16:36:26'),
	(32, 10, 34, NULL, NULL, 'primera_ronda', 4, 1, 'Primera Ronda - Partido 4', NULL, '2025-06-27 18:00:00', NULL, NULL, NULL, 'programado', NULL, '2025-06-26 16:36:26'),
	(33, 10, 34, NULL, NULL, 'primera_ronda', 5, 1, 'Primera Ronda - Partido 5', NULL, '2025-06-27 19:00:00', NULL, NULL, NULL, 'programado', NULL, '2025-06-26 16:36:26'),
	(34, 10, 34, NULL, NULL, 'segunda_ronda', 6, 2, 'Ronda 2 - Partido 6', NULL, '2025-06-28 12:00:00', NULL, NULL, NULL, 'programado', NULL, '2025-06-26 16:36:26'),
	(35, 10, 34, NULL, NULL, 'segunda_ronda', 7, 2, 'Ronda 2 - Partido 7', NULL, '2025-06-28 13:00:00', NULL, NULL, NULL, 'programado', NULL, '2025-06-26 16:36:26'),
	(36, 10, 34, NULL, NULL, 'segunda_ronda', 0, 2, 'Ronda 2 - Pase Directo', NULL, '2025-06-28 14:00:00', NULL, NULL, NULL, 'programado', NULL, '2025-06-26 16:36:26'),
	(37, 10, 34, NULL, NULL, 'tercera_ronda', 8, 3, 'Ronda 3 - Partido 8', NULL, '2025-06-29 14:00:00', NULL, NULL, NULL, 'programado', NULL, '2025-06-26 16:36:26'),
	(38, 10, 34, NULL, NULL, 'tercera_ronda', 0, 3, 'Ronda 3 - Pase Directo', NULL, '2025-06-29 15:00:00', NULL, NULL, NULL, 'programado', NULL, '2025-06-26 16:36:26'),
	(39, 10, 34, NULL, NULL, 'final', 9, 4, 'Final - Partido 9', NULL, '2025-06-29 16:00:00', NULL, NULL, NULL, 'programado', NULL, '2025-06-26 16:36:26');

-- Volcando estructura para tabla railway.torneos_partidos_asistencias
CREATE TABLE IF NOT EXISTS `torneos_partidos_asistencias` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `partido_id` int(11) NOT NULL,
  `jugador_id` int(11) NOT NULL,
  `equipo_id` int(11) NOT NULL,
  `gol_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `partido_id` (`partido_id`),
  KEY `jugador_id` (`jugador_id`),
  KEY `equipo_id` (`equipo_id`),
  KEY `gol_id` (`gol_id`),
  CONSTRAINT `torneos_partidos_asistencias_ibfk_1` FOREIGN KEY (`partido_id`) REFERENCES `torneos_partidos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `torneos_partidos_asistencias_ibfk_2` FOREIGN KEY (`jugador_id`) REFERENCES `usuarios_deportistas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `torneos_partidos_asistencias_ibfk_3` FOREIGN KEY (`equipo_id`) REFERENCES `equipos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `torneos_partidos_asistencias_ibfk_4` FOREIGN KEY (`gol_id`) REFERENCES `torneos_partidos_goleadores` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla railway.torneos_partidos_asistencias: ~0 rows (aproximadamente)

-- Volcando estructura para tabla railway.torneos_partidos_estadisticas
CREATE TABLE IF NOT EXISTS `torneos_partidos_estadisticas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `partido_id` int(11) NOT NULL,
  `equipo_id` int(11) NOT NULL,
  `goles` int(11) DEFAULT 0,
  `tarjetas_amarillas` int(11) DEFAULT 0,
  `tarjetas_rojas` int(11) DEFAULT 0,
  `mvp_jugador_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `partido_id` (`partido_id`),
  KEY `equipo_id` (`equipo_id`),
  KEY `mvp_jugador_id` (`mvp_jugador_id`),
  CONSTRAINT `torneos_partidos_estadisticas_ibfk_1` FOREIGN KEY (`partido_id`) REFERENCES `torneos_partidos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `torneos_partidos_estadisticas_ibfk_2` FOREIGN KEY (`equipo_id`) REFERENCES `equipos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `torneos_partidos_estadisticas_ibfk_3` FOREIGN KEY (`mvp_jugador_id`) REFERENCES `usuarios_deportistas` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla railway.torneos_partidos_estadisticas: ~0 rows (aproximadamente)

-- Volcando estructura para tabla railway.torneos_partidos_goleadores
CREATE TABLE IF NOT EXISTS `torneos_partidos_goleadores` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `partido_id` int(11) NOT NULL,
  `jugador_id` int(11) NOT NULL,
  `equipo_id` int(11) NOT NULL,
  `minuto_gol` int(11) DEFAULT NULL,
  `tipo_gol` enum('normal','penal','autogol') DEFAULT 'normal',
  PRIMARY KEY (`id`),
  KEY `partido_id` (`partido_id`),
  KEY `jugador_id` (`jugador_id`),
  KEY `equipo_id` (`equipo_id`),
  CONSTRAINT `torneos_partidos_goleadores_ibfk_1` FOREIGN KEY (`partido_id`) REFERENCES `torneos_partidos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `torneos_partidos_goleadores_ibfk_2` FOREIGN KEY (`jugador_id`) REFERENCES `usuarios_deportistas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `torneos_partidos_goleadores_ibfk_3` FOREIGN KEY (`equipo_id`) REFERENCES `equipos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla railway.torneos_partidos_goleadores: ~0 rows (aproximadamente)

-- Volcando estructura para tabla railway.usuarios_deportes
CREATE TABLE IF NOT EXISTS `usuarios_deportes` (
  `usuario_id` int(11) NOT NULL,
  `deporte_id` int(11) NOT NULL,
  PRIMARY KEY (`usuario_id`,`deporte_id`),
  KEY `deporte_id` (`deporte_id`),
  CONSTRAINT `usuarios_deportes_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios_deportistas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `usuarios_deportes_ibfk_2` FOREIGN KEY (`deporte_id`) REFERENCES `deportes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla railway.usuarios_deportes: ~4 rows (aproximadamente)
INSERT INTO `usuarios_deportes` (`usuario_id`, `deporte_id`) VALUES
	(2, 1),
	(2, 3),
	(8, 1),
	(8, 3);

-- Volcando estructura para tabla railway.usuarios_deportistas
CREATE TABLE IF NOT EXISTS `usuarios_deportistas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL DEFAULT '0',
  `apellidos` varchar(100) NOT NULL DEFAULT '0',
  `email` varchar(100) NOT NULL DEFAULT '0',
  `telefono` varchar(20) NOT NULL DEFAULT '0',
  `fecha_nacimiento` date DEFAULT NULL,
  `genero` enum('Masculino','Feminino','Otro') NOT NULL,
  `nivel_habilidad` enum('Principiante','Intermedio','Avanzado') NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `estado` tinyint(1) NOT NULL DEFAULT 1,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla railway.usuarios_deportistas: ~6 rows (aproximadamente)
INSERT INTO `usuarios_deportistas` (`id`, `nombre`, `apellidos`, `email`, `telefono`, `fecha_nacimiento`, `genero`, `nivel_habilidad`, `username`, `password`, `estado`, `creado_en`) VALUES
	(2, 'Sebastian Nicolás', 'Fuentes Avalos', 'fuentessebastiansa4s@gmail.com', '946143071', '2005-01-18', 'Masculino', 'Intermedio', 'Chevi10', '$2y$10$IJrd1jNkOJNb73BS68/c.OeQG2R7NQmcuNoktqQINYtBYo1C4moOG', 1, '2025-05-19 19:10:38'),
	(3, 'Gabriela', 'Gutierrez Mamane', 'gabrielaga@gmail.com', '946143071', '2002-11-03', 'Feminino', 'Principiante', 'GabyGol', '$2y$10$DetTzM9npZHxn9dufxtAoekAOZBzfmlQ568JEkpg4wIc3VrLJ6XEO', 1, '2025-05-19 20:24:19'),
	(4, 'Victor', 'Cruz Mamani', 'victor@gmail.com', '946143072', '2001-06-02', 'Masculino', 'Principiante', 'Chamo', '$2y$10$DetTzM9npZHxn9dufxtAoekAOZBzfmlQ568JEkpg4wIc3VrLJ6XEO', 1, '2025-06-02 19:48:23'),
	(5, 'gaby', 'Gutierez', 'gg2022074263@virtual.upt.pe', '952722656', '2003-11-03', '', '', 'Gaby', '$2y$10$j2i/8zrEyibF0S53PQwhVO3PtHaKs7slDUIdHz5/wJD2.xzsakLAW', 1, '2025-06-17 16:39:02'),
	(6, 'Edinson', 'Alvarez Gomez', 'chevichin2018@gmail.com', '946143071', '2005-01-18', 'Masculino', 'Principiante', 'Edinson123', '$2y$10$pCrxIZiTKc1EI2rTjCm4ie4jobzWRAGqjxU8OQANXwVQPk4Hj3jD6', 1, '2025-06-19 21:05:55'),
	(8, 'Pepito', 'Manco', 'gichevichin2020@gmail.com', '946143071', '2025-01-19', 'Masculino', 'Principiante', 'PepitoManco', '$2y$10$ABhdIp8jmbTVocYKDY.czOve4y28udyUKVSYWQTPQ4WsVBZiBPxZi', 1, '2025-06-23 21:43:44');

-- Volcando estructura para tabla railway.usuarios_instalaciones
CREATE TABLE IF NOT EXISTS `usuarios_instalaciones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `estado` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `tipo_usuario` enum('privado','ipd') DEFAULT NULL,
  `culqi_public_key` varchar(255) DEFAULT NULL,
  `culqi_secret_key` varchar(255) DEFAULT NULL,
  `culqi_enabled` tinyint(1) DEFAULT 0,
  `paypal_client_id` varchar(255) DEFAULT NULL,
  `paypal_client_secret` varchar(255) DEFAULT NULL,
  `paypal_enabled` tinyint(1) DEFAULT 0,
  `paypal_sandbox` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Volcando datos para la tabla railway.usuarios_instalaciones: ~5 rows (aproximadamente)
INSERT INTO `usuarios_instalaciones` (`id`, `username`, `password`, `estado`, `created_at`, `tipo_usuario`, `culqi_public_key`, `culqi_secret_key`, `culqi_enabled`, `paypal_client_id`, `paypal_client_secret`, `paypal_enabled`, `paypal_sandbox`) VALUES
	(1, 'andy', '$2y$10$IJrd1jNkOJNb73BS68/c.OeQG2R7NQmcuNoktqQINYtBYo1C4moOG', 1, '2025-05-19 17:20:31', 'privado', 'pk_test_ZQA3KYUMAvDhDXJT', 'sk_test_DthTrZ9s5AVPzLaA', 1, 'AeWyuNiQwns7OywCQ6yopDJt_eJl12Vn09X1wR19o1nK8lGSuLvMBfdssaEuf4j27SrH42UAf7N7XR2X', 'EAibjcVLXcACZnaShTgjSx7nueoDXT5h_-ohi1nX2lmSzehBC5On-Uo2OoJgkgTHAzpujWpnEBJPot-q', 1, 0),
	(2, 'ipd_tacna', '$2y$10$DetTzM9npZHxn9dufxtAoekAOZBzfmlQ568JEkpg4wIc3VrLJ6XEO', 1, '2025-06-04 20:03:09', 'ipd', 'pk_test_ZQA3KYUMAvDhDXJT', 'sk_test_DthTrZ9s5AVPzLaA', 1, 'AeWyuNiQwns7OywCQ6yopDJt_eJl12Vn09X1wR19o1nK8lGSuLvMBfdssaEuf4j27SrH42UAf7N7XR2X', 'EAibjcVLXcACZnaShTgjSx7nueoDXT5h_-ohi1nX2lmSzehBC5On-Uo2OoJgkgTHAzpujWpnEBJPot-q', 1, 0),
	(5, 'myrayita2004@gmail.com', '$2y$10$ndWhStrtgsn7lx/3RpZdYueOQJ15ceFgLZyAgw3nRRnaTHFR4S4gK', 1, '2025-06-24 22:21:20', 'privado', 'pk_test_ZQA3KYUMAvDhDXJT', 'sk_test_DthTrZ9s5AVPzLaA', 1, NULL, NULL, 1, 0),
	(6, 'pepito@gmail.com', '$2y$10$vzxkUGK7DwOGFCI4d6Rki.VEARpJo3Ii3Z/zqeJVgHFzxZI526wEO', 1, '2025-06-24 23:51:31', 'privado', 'pk_test_ZQA3KYUMAvDhDXJT', 'sk_test_DthTrZ9s5AVPzLaA', 1, NULL, NULL, 1, 0),
	(9, 'ac2022074258@virtual.upt.pe', '$2y$10$i8C1.NrMbHwtYcaXCWNO/eDfegTNYqQxyRAZLoj.J/NwtDjjhunbC', 1, '2025-06-25 19:13:10', 'privado', NULL, NULL, 0, NULL, NULL, 0, 1);

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

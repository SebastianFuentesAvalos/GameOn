<?php
require_once __DIR__ . '/AreasDeportivasModel.php';

class AreasPublicModel {
    private $areasModel;

    public function __construct() {
        $this->areasModel = new AreasDeportivasModel();
    }

    // Permitir obtener área por ID (solo datos públicos)
    public function getAreaById($id) {
        return $this->areasModel->getAreaById($id);
    }
}
?>
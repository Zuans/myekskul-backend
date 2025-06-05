const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

// Route untuk menambahkan data absensi
router.get("/ekstrakurikuler", adminController.getAllEkstrakurikuler);
module.exports = router;

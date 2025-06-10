const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

// Route untuk menambahkan data absensi
router.get("/ekstrakurikuler", adminController.getAllEkstrakurikuler);

router.get("/dashboard", adminController.getAllDataDashboard);
module.exports = router;

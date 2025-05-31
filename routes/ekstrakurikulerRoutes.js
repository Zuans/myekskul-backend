const express = require("express");
const router = express.Router();
const ekstrakurikulerController = require("../controllers/ekstrakurikulerController");

// Route untuk menambahkan ekstrakurikuler
router.post("/", ekstrakurikulerController.createEkstrakurikuler);

router.get("/id/:id", ekstrakurikulerController.findEkstrakurikulerById);

router.get(
  "/guru/:id_guru",
  ekstrakurikulerController.findEkstrakurikulerByGuruId
);

router.get(
  "/daftar/siswa/:id",
  ekstrakurikulerController.findEkstrakurikulerByGuruId
);

router.get(
  "/guru/search/:id_guru/:nama",
  ekstrakurikulerController.findEkstrakurikulerByNameAndGuruId
);

// Route untuk mengubah data ekstrakurikuler
router.put("/:id", ekstrakurikulerController.updateEkstrakurikuler);

// Route untuk menghapus ekstrakurikuler
router.delete("/:id", ekstrakurikulerController.deleteEkstrakurikuler);

// Route untuk mencari ekstrakurikuler berdasarkan nama
router.get(
  "/search/:nama",
  ekstrakurikulerController.findEkstrakurikulerByName
);

// Route untuk mendapatkan semua data ekstrakurikuler
router.get("/", ekstrakurikulerController.getAllEkstrakurikuler);

module.exports = router;

const express = require("express");
const router = express.Router();
const absensiController = require("../controllers/absensiController");

// Route untuk menambahkan data absensi
router.post(
  "/:idSiswa/:idEkstrakurikuler",
  absensiController.createAbsensiBySiswaAndEkstrakurikuler
);

// Route untuk mengubah data absensi
router.put("/:id", absensiController.updateAbsensi);

router.put(
  "/selectAbsen/:tanggal/:idEkstrakurikuler",
  absensiController.selectAbsen
);

router.put(
  "/selectHadir/:tanggal/:idEkstrakurikuler",
  absensiController.selectHadir
);

// Route untuk menghapus data absensi
router.delete("/:id", absensiController.deleteAbsensi);

router.get("/absenCepat/:idGuru", absensiController.findAbsenTerdekat);

// Route untuk mencari absensi berdasarkan tanggal
router.get("/search/:tanggal", absensiController.findAbsensiByTanggal);

router.get("/absensiTerakhir/:idGuru", absensiController.findAbsensiTerakhir);

router.get(
  "/searchWithEkstrakurikuler/:idEkstrakurikuler/:tanggal",
  absensiController.findAbsensiByTanggalAndEkstrakurikuler
);
// Route untuk mencari absensi berdasarkan rentang tanggal
router.get("/range", absensiController.findAbsensiByRange);

router.get(
  "/daftar/bulanIni/:idEkstrakurikuler",
  absensiController.findAbsensiByMonth
);

router.get(
  "/daftar/export/bulanIni/:idEkstrakurikuler",
  absensiController.exportAbsensiByMonth
);

router.get(
  "/daftar/semesterIni/:idEkstrakurikuler",
  absensiController.findAbsensiBySemester
);

router.get(
  "/daftar/export/semesterIni/:idEkstrakurikuler",
  absensiController.exportSemesterAttendance
);

router.get(
  "/daftar/:tanggal/:idEkstrakurikuler",
  absensiController.getAbsensiStatusByEkstrakurikuler
);

router.get(
  "/daftarTanggal/:idEkstrakurikuler",
  absensiController.getGroupedAbsensiByEkstrakurikuler
);
// Route untuk mendapatkan semua data absensi
router.get("/", absensiController.getAllAbsensi);

router.get(
  "/persentaseBulan/:idGuru",
  absensiController.getPersentaseKehadiranByMonth
);

router.get(
  "/persentaseSemester/:idGuru",
  absensiController.getPersentaseKehadiranBySemester
);

module.exports = router;

const express = require("express");
const router = express.Router();
const siswaController = require("../controllers/siswaController");
const multer = require("multer");
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

// Filter hanya menerima file Excel
const fileFilter = (req, file, cb) => {
  const allowedExtensions = [".xlsx", ".xls"];
  const fileExt = file.originalname.split(".").pop(); // Ambil ekstensi file

  if (allowedExtensions.includes(`.${fileExt}`)) {
    cb(null, true);
  } else {
    cb(
      new Error("Hanya file spreadsheet (.xlsx, .xls) yang diperbolehkan!"),
      false
    );
  }
};
const upload = multer({ storage, fileFilter });

// Route untuk menambahkan siswa
router.post("/", siswaController.createSiswa);

router.post(
  "/ekstrakurikuler/:id/:idEkstrakurikuler",
  siswaController.addEkstrakurikulerToSiswa
);

// Route untuk mengubah data siswa
router.put("/:id", siswaController.updateSiswa);

// Route untuk menghapus siswa
router.delete("/:id", siswaController.deleteSiswa);

router.delete(
  "/ekstrakurikuler/:idSiswa/:idEkstrakurikuler",
  siswaController.removeEkstrakurikulerFromSiswa
);

// Route untuk mencari siswa berdasarkan nama
router.get("/search/:nama", siswaController.findSiswaByName);

router.get("/id/:id", siswaController.findSiswaById);

router.get("/search/kelas/:kelas", siswaController.findSiswaByKelas);

router.get(
  "/daftar/ekstrakurikuler/:id",
  siswaController.findSiswaByEkstrakurikulerId
);

// Route untuk mendapatkan semua data siswa
router.get("/", siswaController.getAllSiswa);

router.post("/export", siswaController.export);

router.post("/upload", upload.single("file"), siswaController.upload);

router.get("/qr/:id", siswaController.getSiswaWithBarcode);

router.get("/template", siswaController.downloadTemplate);

router.get("/absensi-terakhir/:idSiswa", siswaController.getAbsensiTerakhir);

router.get(
  "/persentase-bulan/:idSiswa",
  siswaController.getPersentasePerEkstrakurikuler
);

router.get("/jadwal-nanti/:idSiswa", siswaController.getJadwalNanti);
router.get(
  "/search/jadwal-nanti/:idSiswa/:search",
  siswaController.searchJadwalNanti
);

router.get(
  "/search/riwayat-absensi/:idSiswa/:search",
  siswaController.searchAbsensiByEkstrakurikuler
);

router.get("/riwayat-absensi/:idSiswa", siswaController.getRiwayatAbsensi);

module.exports = router;

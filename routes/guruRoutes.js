const express = require("express");
const router = express.Router();
const guruController = require("../controllers/guruController");

// Route untuk menambahkan guru
router.post("/", guruController.createGuru);

router.post("/login", guruController.loginGuru);

// Route untuk mengubah data guru
router.put("/:id", guruController.updateGuru);

// Route untuk menghapus guru
router.delete("/:id", guruController.deleteGuru);

// Route untuk mencari guru berdasarkan nama
router.get("/search/:nama", guruController.findGuruByName);

router.get("/jadwalNanti/:idGuru", guruController.findJadwalNanti);

// Route untuk mendapatkan semua data guru
router.get("/", guruController.getAllGuru);
router.get("/getApprove", guruController.getApprovedGuru);

router.get("/getRequestApprove", guruController.getRequestApprove);

router.get("/qr/:id", guruController.getGuruWithBarcode);

router.get("/:id", guruController.getGuruById);

router.post("/login/qr", guruController.getUserById);

// Route untuk **approve akun guru** (ubah `isActive` menjadi `true`)
router.put("/approve/:id", guruController.approveGuru);

// Route untuk **reject akun guru** (hapus akun atau beri status khusus)
router.delete("/reject/:id", guruController.rejectGuru);

module.exports = router;

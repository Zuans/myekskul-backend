const Ekstrakurikuler = require("../models/Ekstrakurikuler");
const Guru = require("../models/Guru");
const generateQRCode = require("../utils/generateQRCode");
const Siswa = require("../models/Siswa");

// Menambahkan guru baru
exports.createGuru = async (req, res) => {
  try {
    const newGuru = new Guru(req.body);
    await newGuru.save();
    res.status(201).json(newGuru);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Mengubah data guru berdasarkan ID
exports.updateGuru = async (req, res) => {
  try {
    const guru = await Guru.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!guru) return res.status(404).json({ message: "Guru tidak ditemukan" });
    res.json(guru);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Menghapus guru berdasarkan ID
exports.deleteGuru = async (req, res) => {
  try {
    const guru = await Guru.findByIdAndDelete(req.params.id);
    if (!guru) return res.status(404).json({ message: "Guru tidak ditemukan" });
    res.json({ message: "Guru berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mencari guru berdasarkan nama
exports.findGuruByName = async (req, res) => {
  try {
    const guru = await Guru.find({
      nama: { $regex: req.params.nama, $options: "i" },
    });
    if (guru.length === 0)
      return res.status(404).json({ message: "Guru tidak ditemukan" });
    res.json(guru);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllGuru = async (req, res) => {
  try {
    // Mengambil semua data guru dari database
    const guru = await Guru.find();

    // Jika data ditemukan, kembalikan dalam bentuk JSON
    res.status(200).json(guru);
  } catch (error) {
    // Menangani kesalahan jika query gagal
    res
      .status(500)
      .json({ message: "Gagal mendapatkan data guru", error: error.message });
  }
};

exports.getApprovedGuru = async (req, res) => {
  try {
    // Mengambil hanya guru yang aktif (isActive: true)
    const guru = await Guru.find({ isActive: true });

    // Jika data ditemukan, kembalikan dalam bentuk JSON
    res.status(200).json(guru);
  } catch (error) {
    // Menangani kesalahan jika query gagal
    res
      .status(500)
      .json({ message: "Gagal mendapatkan data guru", error: error.message });
  }
};

exports.loginGuru = async (req, res) => {
  try {
    const { username, password } = req.body;

    // **Login untuk Admin (Langsung tanpa cek isActive)**
    if (username === "adminsuper" && password === "abadi41") {
      return res.status(200).json({
        _id: "-",
        nama: "admin",
        username: "adminsuper",
        role: "admin", // Tambahkan role
        isActive: true,
      });
    }

    // **Cek apakah username ada di database**
    const guru = await Guru.findOne({ username });
    if (!guru) {
      return res.status(401).json({ error: "Username tidak ditemukan!" });
    }
    // **Cek apakah akun guru sudah aktif (hanya untuk guru, bukan admin)**
    if (!guru.isActive) {
      return res.status(403).json({
        error: "Akun belum aktif, silakan tunggu aktivasi dari admin!",
      });
    }

    // **Verifikasi password langsung (tanpa hashing)**
    if (guru.password !== password) {
      return res.status(401).json({ error: "Password salah!" });
    }

    // **Kirim data guru dengan role sebagai respons**
    res.status(200).json({
      _id: guru._id,
      nama: guru.nama,
      username: guru.username,
      role: "guru", // Tambahkan role
    });
  } catch (error) {
    console.error("Error saat login:", error);
    res.status(500).json({ error: "Terjadi kesalahan saat login!" });
  }
};

exports.getGuruWithBarcode = async (req, res) => {
  try {
    const guru = await Guru.findById(req.params.id);
    if (!guru) {
      return res.status(404).json({ message: "Guru tidak ditemukan" });
    }
    // Generate QR code dari _id siswa
    const qrCodeDataUrl = await generateQRCode(guru._id.toString());
    res.json({
      guru,
      qr: qrCodeDataUrl,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.body; // Ambil ID dari body request
    if (!userId) {
      return res.status(400).json({ message: "ID Pengguna diperlukan" });
    }

    // Coba cari sebagai Guru
    const guru = await Guru.findById(userId);
    if (guru) {
      return res.json({
        _id: guru._id,
        nama: guru.nama,
        role: "guru",
      });
    }

    // Jika tidak ditemukan sebagai Guru, coba cari sebagai Siswa
    const siswa = await Siswa.findById(userId);
    if (siswa) {
      return res.json({
        _id: siswa._id,
        nama: siswa.nama,
        kelas: siswa.kelas,
        role: "siswa",
      });
    }

    // Jika tidak ditemukan di kedua tabel
    return res.status(404).json({ message: "Pengguna tidak ditemukan" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getGuruWithBarcode = async (req, res) => {
  try {
    const guru = await Guru.findById(req.params.id);
    if (!guru) {
      return res.status(404).json({ message: "Guru tidak ditemukan" });
    }
    // Generate QR code dari _id siswa
    const qrCodeDataUrl = await generateQRCode(guru._id.toString());
    res.json({
      guru,
      qr: qrCodeDataUrl,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.findJadwalNanti = async (req, res) => {
  try {
    const { idGuru } = req.params;

    // Query semua ekstrakurikuler berdasarkan ID guru
    const activities = await Ekstrakurikuler.find({ id_guru: idGuru });

    if (activities.length === 0) {
      return res
        .status(404)
        .json({ message: "Tidak ada ekstrakurikuler ditemukan." });
    }

    const now = new Date();
    const currentDay = now.getDay(); // Ambil hari sekarang dalam angka (0 = Minggu, 1 = Senin, dst.)

    // Fungsi untuk mendapatkan tanggal terdekat berdasarkan hari ekstrakurikuler
    const getNextDateByDay = (day, offsetDays = 0) => {
      const daysAhead =
        (day - currentDay + 7) % 7 || (day === currentDay ? 7 : 0); // Jika hari sama, jadikan minggu depan
      const nextDate = new Date(now);
      nextDate.setDate(now.getDate() + daysAhead + offsetDays); // Tambahkan selisih hari jika diperlukan
      return nextDate.toISOString().split("T")[0]; // Format YYYY-MM-DD
    };

    // Menyusun data dengan tanggal terdekat dan pertemuan minggu depan
    const upcomingSchedules = activities
      .map((activity) => ({
        ...activity._doc,
        nextDate: getNextDateByDay(activity.day), // Hari terdekat sesuai ekstrakurikuler
        nextWeekDate: getNextDateByDay(activity.day, 7), // Tambahan satu minggu ke depan
      }))
      .sort((a, b) => new Date(a.nextDate) - new Date(b.nextDate)); // Urutkan berdasarkan tanggal terdekat

    return res.json({
      schedules: upcomingSchedules,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

exports.getGuruById = async (req, res) => {
  try {
    const guruId = req.params.id; // Mengambil ID dari parameter URL
    const guru = await Guru.findById(guruId); // Mencari data guru berdasarkan ID

    if (!guru) {
      return res.status(404).json({ message: "Guru tidak ditemukan" });
    }

    res.status(200).json(guru); // Mengirimkan data guru sebagai respons
  } catch (error) {
    res
      .status(500)
      .json({ message: "Terjadi kesalahan pada server", error: error.message });
  }
};

exports.approveGuru = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedGuru = await Guru.findByIdAndUpdate(
      id,
      { isActive: true },
      { new: true }
    );

    if (!updatedGuru) {
      return res.status(404).json({ message: "Guru tidak ditemukan" });
    }

    res.json({ message: "Akun guru berhasil di-approve", guru: updatedGuru });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getRequestApprove = async (req, res) => {
  try {
    // Mengambil semua guru yang belum diapprove (isActive: false)
    const pendingGuru = await Guru.find({ isActive: false });

    // Jika tidak ada data yang ditemukan, kirim pesan kosong
    if (!pendingGuru.length) {
      return res
        .status(404)
        .json({ message: "Tidak ada akun guru yang perlu diapprove" });
    }

    res.status(200).json(pendingGuru);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Fungsi untuk reject akun guru
exports.rejectGuru = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedGuru = await Guru.findByIdAndDelete(id);

    if (!deletedGuru) {
      return res.status(404).json({ message: "Guru tidak ditemukan" });
    }

    res.json({ message: "Akun guru telah ditolak dan dihapus" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

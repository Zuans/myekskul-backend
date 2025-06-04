const Ekstrakurikuler = require("../models/Ekstrakurikuler");
const Siswa = require("../models/Siswa");
const ExcelJS = require("exceljs");
const path = require("path");

// Menambahkan ekstrakurikuler baru
exports.createEkstrakurikuler = async (req, res) => {
  try {
    const newEkstrakurikuler = new Ekstrakurikuler(req.body);
    await newEkstrakurikuler.save();
    res.status(201).json(newEkstrakurikuler);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Mengubah data ekstrakurikuler berdasarkan ID
exports.updateEkstrakurikuler = async (req, res) => {
  try {
    const ekstrakurikuler = await Ekstrakurikuler.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!ekstrakurikuler)
      return res
        .status(404)
        .json({ message: "Ekstrakurikuler tidak ditemukan" });
    res.json(ekstrakurikuler);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Menghapus ekstrakurikuler berdasarkan ID
exports.deleteEkstrakurikuler = async (req, res) => {
  try {
    const ekstrakurikuler = await Ekstrakurikuler.findByIdAndDelete(
      req.params.id
    );
    if (!ekstrakurikuler)
      return res
        .status(404)
        .json({ message: "Ekstrakurikuler tidak ditemukan" });
    res.json({ message: "Ekstrakurikuler berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mencari ekstrakurikuler berdasarkan nama
exports.findEkstrakurikulerByName = async (req, res) => {
  try {
    const ekstrakurikuler = await Ekstrakurikuler.find({
      nama: { $regex: req.params.nama, $options: "i" },
    })
      .collation({ locale: "en", strength: 1 })
      .sort({ nama: 1 });

    if (ekstrakurikuler.length === 0) {
      return res
        .status(404)
        .json({ message: "Ekstrakurikuler tidak ditemukan" });
    }

    res.json(ekstrakurikuler);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.findEkstrakurikulerByNameAndGuruId = async (req, res) => {
  try {
    const ekstrakurikuler = await Ekstrakurikuler.find({
      nama: { $regex: req.params.nama, $options: "i" },
      id_guru: req.params.id_guru,
    })
      .collation({ locale: "en", strength: 1 })
      .sort({ nama: 1 });

    if (ekstrakurikuler.length === 0) {
      return res.status(404).json({
        message: "Ekstrakurikuler tidak ditemukan untuk ID guru yang diberikan",
      });
    }

    res.json(ekstrakurikuler);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mengambil semua data ekstrakurikuler
exports.getAllEkstrakurikuler = async (req, res) => {
  try {
    const ekstrakurikuler = await Ekstrakurikuler.find()
      .collation({ locale: "en", strength: 1 })
      .sort({ nama: 1 });

    res.status(200).json(ekstrakurikuler);
  } catch (error) {
    res.status(500).json({
      message: "Gagal mendapatkan data ekstrakurikuler",
      error: error.message,
    });
  }
};

exports.findEkstrakurikulerById = async (req, res) => {
  try {
    const ekstrakurikuler = await Ekstrakurikuler.findById(req.params.id);

    if (!ekstrakurikuler) {
      return res
        .status(404)
        .json({ message: "Ekstrakurikuler tidak ditemukan" });
    }

    res.json(ekstrakurikuler);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.findEkstrakurikulerByGuruId = async (req, res) => {
  try {
    const ekstrakurikuler = await Ekstrakurikuler.find({
      id_guru: req.params.id_guru,
    })
      .collation({ locale: "en", strength: 1 })
      .sort({ nama: 1 });

    if (!ekstrakurikuler.length) {
      return res.status(404).json({
        message: "Tidak ada ekstrakurikuler yang ditemukan untuk ID ini",
      });
    }

    // Dapatkan data siswa untuk setiap ekstrakurikuler
    const ekstrakurikulerWithSiswa = await Promise.all(
      ekstrakurikuler.map(async (item) => {
        const siswa = await Siswa.find({
          data_ekstrakurikuler: { $in: [item._id] },
        }).sort({ nama: 1 }); // **Menambahkan pengurutan alfabetis di sini**

        return { ...item.toObject(), siswa_terdaftar: siswa };
      })
    );

    res.json(ekstrakurikulerWithSiswa);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getExportDaftarSiswa = async (req, res) => {
  try {
    const { idEkstrakurikuler } = req.params;

    // Cari ekstrakurikuler berdasarkan ID
    const ekstrakurikuler = await Ekstrakurikuler.findById(idEkstrakurikuler);
    if (!ekstrakurikuler) {
      return res
        .status(404)
        .json({ message: "Ekstrakurikuler tidak ditemukan" });
    }

    // Ambil daftar siswa yang terdaftar dalam ekstrakurikuler ini
    const siswaList = await Siswa.find({
      data_ekstrakurikuler: { $in: [idEkstrakurikuler] },
    }).sort({ nama: 1 }); // **Menambahkan pengurutan alfabetis di sini**

    if (!siswaList.length) {
      return res.status(404).json({
        message: "Tidak ada siswa terdaftar dalam ekstrakurikuler ini.",
      });
    }

    // **Buat Workbook & Worksheet**
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Daftar Siswa");

    // **Tambahkan Header Termerge**
    worksheet.mergeCells("A1:B1"); // Merge kolom untuk judul
    worksheet.getCell(
      "A1"
    ).value = `Daftar Siswa Ekstrakurikuler ${ekstrakurikuler.nama}`;
    worksheet.getCell("A1").font = { bold: true, size: 14 };
    worksheet.getCell("A1").alignment = { horizontal: "center" };

    // **Tambahkan Header Kolom Nama & Kelas**
    worksheet.getRow(2).values = ["Nama Siswa", "Kelas"];
    worksheet.getRow(2).font = { bold: true };
    worksheet.getRow(2).alignment = { horizontal: "center" };

    // **Tambahkan Data Siswa**
    siswaList.forEach((siswa, index) => {
      worksheet.addRow([siswa.nama, siswa.kelas]);
    });

    // **Simpan file ke disk sebelum dikirim ke frontend**
    const filePath = path.join(__dirname, "DaftarSiswa.xlsx");
    await workbook.xlsx.writeFile(filePath);

    // **Kirim file ke frontend**
    res.download(
      filePath,
      `Daftar_Siswa_Ekstrakurikuler_${ekstrakurikuler.nama}.xlsx`
    );
  } catch (error) {
    console.error("Gagal membuat file Excel:", error);
    res
      .status(500)
      .json({ error: "Terjadi kesalahan saat mengekspor data siswa." });
  }
};

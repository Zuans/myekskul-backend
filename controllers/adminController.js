const Ekstrakurikuler = require("../models/Ekstrakurikuler");
const Siswa = require("../models/Siswa");
const Guru = require("../models/Guru");

exports.getAllEkstrakurikuler = async (req, res) => {
  try {
    const ekstrakurikuler = await Ekstrakurikuler.find({})
      .collation({ locale: "en", strength: 1 })
      .sort({ nama: 1 });

    if (!ekstrakurikuler.length) {
      return res.status(404).json({
        message: "Tidak ada ekstrakurikuler yang ditemukan untuk ID ini",
      });
    }

    // Dapatkan data siswa & guru untuk setiap ekstrakurikuler
    const ekstrakurikulerWithDetails = await Promise.all(
      ekstrakurikuler.map(async (item) => {
        const siswa = await Siswa.find({
          data_ekstrakurikuler: { $in: [item._id] },
        }).sort({ nama: 1 });

        // Ambil data guru berdasarkan id_guru
        const guru = await Guru.findById(item.id_guru);
        const namaGuru = guru ? guru.nama : "Guru tidak ditemukan";

        return {
          ...item.toObject(),
          siswa_terdaftar: siswa,
          nama_guru: namaGuru,
        };
      })
    );

    res.json(ekstrakurikulerWithDetails);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
};

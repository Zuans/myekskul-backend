const Ekstrakurikuler = require("../models/Ekstrakurikuler");
const Siswa = require("../models/Siswa");
const Guru = require("../models/Guru");
const Absensi = require("../models/Absensi");

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

const {
  getStartAndEndDate,
  getAbsensiByMonth,
  getSiswaByEkstrakurikuler,
} = require("../utils/getData");
exports.getAllDataDashboard = async (req, res) => {
  try {
    // Hitung total jumlah data di masing-masing koleksi
    const totalGuru = await Guru.countDocuments();
    const totalEkstrakurikuler = await Ekstrakurikuler.countDocuments();
    const totalSiswa = await Siswa.countDocuments();

    // Query semua ekstrakurikuler
    const activities = await Ekstrakurikuler.find();

    if (!activities.length) {
      return res
        .status(404)
        .json({ message: "Tidak ada data ekstrakurikuler." });
    }

    // Query guru dengan isActive = false, termasuk password dan createdAt
    const request_guru = await Guru.find({ isActive: false }).select(
      "nama username password createdAt"
    );

    // Dapatkan rentang tanggal bulan ini
    const { startDate, endDate } = getStartAndEndDate("bulan");

    let ekstrakurikulerJumlahSiswa = [];
    let ekstrakurikulerPersentase = [];

    // Loop semua ekstrakurikuler untuk menghitung jumlah siswa dan persentase kehadiran
    for (const activity of activities) {
      const idEkstrakurikuler = activity._id;
      const namaEkstrakurikuler = activity.nama;

      // Ambil semua absensi dalam bulan ini untuk ekstrakurikuler
      const absensi = await Absensi.find({
        id_ekstrakurikuler: idEkstrakurikuler,
        waktu_scan: { $gte: startDate, $lte: endDate },
      });

      let totalHadir = 0;
      let totalSiswaEkstrakurikuler = 0;

      if (absensi.length) {
        const groupedAbsensi = await getAbsensiByMonth(
          idEkstrakurikuler,
          startDate,
          endDate
        );

        // Hitung total kehadiran siswa dalam semua hari aktif
        totalHadir = Object.values(groupedAbsensi).reduce(
          (sum, absensiHari) => sum + absensiHari.length,
          0
        );
      }

      // Ambil daftar siswa yang mengikuti ekstrakurikuler ini
      const siswaList = await getSiswaByEkstrakurikuler(idEkstrakurikuler);
      totalSiswaEkstrakurikuler = siswaList.length;

      // Hitung persentase kehadiran untuk ekstrakurikuler ini
      const persentaseKehadiran =
        totalSiswaEkstrakurikuler > 0
          ? ((totalHadir / totalSiswaEkstrakurikuler) * 100).toFixed(2)
          : "0.00";

      // Simpan dalam array terpisah
      ekstrakurikulerJumlahSiswa.push({
        nama: namaEkstrakurikuler,
        jumlah_siswa: totalSiswaEkstrakurikuler,
      });

      ekstrakurikulerPersentase.push({
        nama: namaEkstrakurikuler,
        persentase_kehadiran: parseFloat(persentaseKehadiran),
      });
    }

    // **Urutkan jumlah siswa terbanyak**
    ekstrakurikulerJumlahSiswa.sort((a, b) => b.jumlah_siswa - a.jumlah_siswa);

    // **Urutkan persentase kehadiran tertinggi**
    ekstrakurikulerPersentase.sort(
      (a, b) => b.persentase_kehadiran - a.persentase_kehadiran
    );

    res.json({
      total_guru: totalGuru,
      total_ekstrakurikuler: totalEkstrakurikuler,
      total_siswa: totalSiswa,
      request_guru: request_guru, // Daftar guru dengan isActive false + password + createdAt
      ekstrakurikuler_jumlah_siswa: ekstrakurikulerJumlahSiswa,
      ekstrakurikuler_persentase_kehadiran: ekstrakurikulerPersentase,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

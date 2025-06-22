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
    const totalGuru = await Guru.countDocuments().catch(() => 0);
    const totalEkstrakurikuler = await Ekstrakurikuler.countDocuments().catch(
      () => 0
    );
    const totalSiswa = await Siswa.countDocuments().catch(() => 0);

    const activities = await Ekstrakurikuler.find().catch(() => []);
    if (!activities.length) {
      return res.status(200).json({
        total_guru: totalGuru,
        total_ekstrakurikuler: totalEkstrakurikuler,
        total_siswa: totalSiswa,
        request_guru: [],
        ekstrakurikuler_jumlah_siswa: [],
        ekstrakurikuler_persentase_kehadiran: [],
      });
    }

    const request_guru = await Guru.find({ isActive: false })
      .select("nama username password createdAt")
      .catch(() => []);

    const { startDate, endDate } = getStartAndEndDate("bulan");
    let ekstrakurikulerJumlahSiswa = [];
    let ekstrakurikulerPersentase = [];

    for (const activity of activities) {
      const idEkstrakurikuler = activity._id;
      const namaEkstrakurikuler = activity.nama;

      const absensi = await Absensi.find({
        id_ekstrakurikuler: idEkstrakurikuler,
        waktu_scan: { $gte: startDate, $lte: endDate },
      }).catch(() => []);

      let totalHadir = 0;
      let totalSiswaEkstrakurikuler = 0;

      if (absensi.length) {
        const groupedAbsensi = await getAbsensiByMonth(
          idEkstrakurikuler,
          startDate,
          endDate
        ).catch(() => ({}));

        totalHadir = Object.values(groupedAbsensi).reduce(
          (sum, absensiHari) => sum + absensiHari.length,
          0
        );
      }

      const siswaList = await getSiswaByEkstrakurikuler(
        idEkstrakurikuler
      ).catch(() => []);
      totalSiswaEkstrakurikuler = siswaList.length;

      const persentaseKehadiran =
        totalSiswaEkstrakurikuler > 0
          ? ((totalHadir / totalSiswaEkstrakurikuler) * 100).toFixed(2)
          : "0.00";

      ekstrakurikulerJumlahSiswa.push({
        nama: namaEkstrakurikuler,
        jumlah_siswa: totalSiswaEkstrakurikuler,
      });

      ekstrakurikulerPersentase.push({
        nama: namaEkstrakurikuler,
        persentase_kehadiran: parseFloat(persentaseKehadiran),
      });
    }

    ekstrakurikulerJumlahSiswa.sort((a, b) => b.jumlah_siswa - a.jumlah_siswa);
    ekstrakurikulerPersentase.sort(
      (a, b) => b.persentase_kehadiran - a.persentase_kehadiran
    );

    res.json({
      total_guru: totalGuru ?? 0,
      total_ekstrakurikuler: totalEkstrakurikuler ?? 0,
      total_siswa: totalSiswa ?? 0,
      request_guru: request_guru ?? [],
      ekstrakurikuler_jumlah_siswa: ekstrakurikulerJumlahSiswa ?? [],
      ekstrakurikuler_persentase_kehadiran: ekstrakurikulerPersentase ?? [],
    });
  } catch (err) {
    res.status(500).json({
      total_guru: 0,
      total_ekstrakurikuler: 0,
      total_siswa: 0,
      request_guru: [],
      ekstrakurikuler_jumlah_siswa: [],
      ekstrakurikuler_persentase_kehadiran: [],
      error: err.message,
    });
  }
};

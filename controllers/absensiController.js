const Absensi = require("../models/Absensi");
const Siswa = require("../models/Siswa");
const Ekstrakurikuler = require("../models/Ekstrakurikuler");
const mongoose = require("mongoose");
const moment = require("moment");
const ExcelJS = require("exceljs");
const path = require("path");

// Menambahkan data absensi baru
exports.createAbsensiBySiswaAndEkstrakurikuler = async (req, res) => {
  try {
    const { idSiswa, idEkstrakurikuler } = req.params;

    // Cari siswa berdasarkan ID
    const siswa = await Siswa.findById(idSiswa);
    if (!siswa) {
      return res.status(404).json({ message: "Siswa tidak ditemukan" });
    }

    // Cari ekstrakurikuler berdasarkan ID
    const ekstrakurikuler = await Ekstrakurikuler.findById(idEkstrakurikuler);
    if (!ekstrakurikuler) {
      return res
        .status(404)
        .json({ message: "Ekstrakurikuler tidak ditemukan" });
    }

    // Simpan data absensi baru
    const newAbsensi = new Absensi({
      nama_siswa: siswa.nama,
      id_siswa: siswa._id,
      id_ekstrakurikuler: ekstrakurikuler._id,
      waktu_scan: Date.now(),
    });

    await newAbsensi.save();
    res.status(201).json({ message: "Absensi berhasil disimpan", newAbsensi });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mengubah data absensi berdasarkan ID
exports.updateAbsensi = async (req, res) => {
  try {
    const absensi = await Absensi.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!absensi)
      return res.status(404).json({ message: "Absensi tidak ditemukan" });
    res.json(absensi);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Menghapus data absensi berdasarkan ID
exports.deleteAbsensi = async (req, res) => {
  try {
    const absensi = await Absensi.findByIdAndDelete(req.params.id);
    if (!absensi)
      return res.status(404).json({ message: "Absensi tidak ditemukan" });
    res.json({ message: "Absensi berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mencari absensi berdasarkan tanggal
exports.findAbsensiByTanggal = async (req, res) => {
  try {
    console.log(req.params.tanggal);
    const absensi = await Absensi.find({ waktu_scan: req.params.tanggal });
    if (absensi.length === 0)
      return res.status(404).json({ message: "Absensi tidak ditemukan" });
    res.json(absensi);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.findAbsensiByTanggalAndEkstrakurikuler = async (req, res) => {
  try {
    const { tanggal, idEkstrakurikuler } = req.params; // Ambil tanggal & idEkstrakurikuler dari parameter

    // Validasi apakah parameter yang diperlukan diberikan
    if (!tanggal || !idEkstrakurikuler) {
      return res
        .status(400)
        .json({ message: "Harap berikan tanggal dan idEkstrakurikuler" });
    }

    // Konversi tanggal ke format Date untuk query yang benar
    const formattedDate = !isNaN(Date.parse(tanggal))
      ? new Date(tanggal)
      : null;

    if (!formattedDate) {
      return res.status(400).json({ message: "Format tanggal tidak valid" });
    }

    // Ambil absensi sesuai tanggal dan idEkstrakurikuler
    const absensi = await Absensi.find({
      waktu_scan: formattedDate,
      id_ekstrakurikuler: idEkstrakurikuler,
    });

    if (absensi.length === 0) {
      return res.status(404).json({
        message:
          "Absensi tidak ditemukan untuk tanggal dan ekstrakurikuler ini",
      });
    }

    res.json(absensi);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mencari absensi berdasarkan rentang tanggal
exports.findAbsensiByRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "Harap berikan startDate dan endDate" });
    }

    const absensi = await Absensi.find({
      waktu_scan: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    });

    if (absensi.length === 0)
      return res
        .status(404)
        .json({ message: "Tidak ada absensi dalam rentang tanggal ini" });

    res.json(absensi);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mengambil semua data absensi
exports.getAllAbsensi = async (req, res) => {
  try {
    const absensi = await Absensi.find();
    console.log(absensi);
    res.status(200).json(absensi);
  } catch (error) {
    res.status(500).json({
      message: "Gagal mendapatkan data absensi",
      error: error.message,
    });
  }
};

exports.getGroupedAbsensiByEkstrakurikuler = async (req, res) => {
  try {
    const { idEkstrakurikuler } = req.params;

    // Ambil semua absensi berdasarkan idEkstrakurikuler
    const absensi = await Absensi.find({
      id_ekstrakurikuler: idEkstrakurikuler,
    }).sort({ waktu_scan: 1 });

    if (!absensi.length) {
      return res.status(404).json({
        message: "Tidak ada data absensi ditemukan untuk ekstrakurikuler ini",
      });
    }

    // Grouping data secara manual
    const groupedAbsensi = Object.values(
      absensi.reduce((acc, item) => {
        const dateKey = item.waktu_scan.toISOString().split("T")[0]; // Ambil tanggal dalam format YYYY-MM-DD
        if (!acc[dateKey]) {
          acc[dateKey] = { tanggal: dateKey, data: [] };
        }
        acc[dateKey].data.push(item);
        return acc;
      }, {})
    );

    res.json(groupedAbsensi);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAbsensiStatusByEkstrakurikuler = async (req, res) => {
  try {
    const { idEkstrakurikuler, tanggal } = req.params;

    // Ambil semua siswa yang memiliki id_ekstrakurikuler di data_ekstrakurikuler
    const siswaList = await Siswa.find({
      data_ekstrakurikuler: { $in: [idEkstrakurikuler] },
    }).sort({ nama: 1 });

    if (!siswaList.length) {
      return res.status(404).json({
        message: "Tidak ada siswa yang terdaftar dalam ekstrakurikuler ini",
      });
    }

    // Validasi format tanggal
    const parsedDate = new Date(tanggal);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: "Format tanggal tidak valid" });
    }

    // Mapping siswa, lalu cek absensi berdasarkan id_siswa, tanggal, dan id_ekstrakurikuler
    const absensiStatus = await Promise.all(
      siswaList.map(async (siswa) => {
        const absensi = await Absensi.findOne({
          id_siswa: siswa._id,
          id_ekstrakurikuler: idEkstrakurikuler,
          waktu_scan: {
            $gte: new Date(`${tanggal}T00:00:00.000Z`),
            $lt: new Date(`${tanggal}T23:59:59.999Z`),
          },
        });

        return {
          nama_siswa: siswa.nama,
          id_siswa: siswa._id,
          kelas: siswa.kelas, // Tambahkan data kelas siswa
          id_ekstrakurikuler: idEkstrakurikuler,
          status: absensi ? "Hadir" : "Absen",
          waktu_scan: absensi ? absensi.waktu_scan : null,
        };
      })
    );

    res.json(absensiStatus);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.findAbsensiBySemester = async (req, res) => {
  try {
    const { idEkstrakurikuler } = req.params; // Ambil idEkstrakurikuler dari parameter
    const now = new Date();
    const startYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // Bulan sekarang (1-12)

    let startDate, endDate, semesterName;

    // Menentukan semester berdasarkan bulan saat ini
    if (currentMonth <= 7) {
      startDate = new Date(startYear, 0, 1); // Awal Januari
      endDate = new Date(startYear, 6, 31, 23, 59, 59); // Akhir Juli
      semesterName = "Semester 1 (Januari - Juli)";
    } else {
      startDate = new Date(startYear, 7, 1); // Awal Agustus
      endDate = new Date(startYear, 11, 31, 23, 59, 59); // Akhir Desember
      semesterName = "Semester 2 (Agustus - Desember)";
    }

    // Validasi apakah idEkstrakurikuler diberikan
    if (!idEkstrakurikuler) {
      return res.status(400).json({
        message: "Harap berikan idEkstrakurikuler",
      });
    }

    // Ambil absensi dalam rentang semester ini dan sesuai dengan idEkstrakurikuler
    const absensi = await Absensi.find({
      waktu_scan: {
        $gte: startDate,
        $lte: endDate,
      },
      id_ekstrakurikuler: idEkstrakurikuler,
    }).sort({ waktu_scan: 1 });

    if (!absensi.length) {
      return res.status(404).json({
        message: `Tidak ada data absensi ditemukan untuk ${semesterName}`,
      });
    }

    // Grouping data berdasarkan tanggal
    const groupedAbsensi = absensi.reduce((acc, item) => {
      const dateKey = moment(item.waktu_scan).format("YYYY-MM-DD");
      if (!acc[dateKey]) {
        acc[dateKey] = { tanggal: dateKey, data: [], semester: semesterName };
      }
      acc[dateKey].data.push(item);
      return acc;
    }, {});

    res.json({
      semester: semesterName,
      data: Object.values(groupedAbsensi),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.selectHadir = async (req, res) => {
  const { tanggal, idEkstrakurikuler } = req.params;

  try {
    const { selectedData: listIdsiswa } = req.body;

    if (!idEkstrakurikuler || !Array.isArray(listIdsiswa)) {
      return res
        .status(400)
        .json({ message: "id_ekstrakurikuler dan id_siswa[] wajib diisi." });
    }

    const waktu = tanggal ? new Date(tanggal) : Date.now();
    const insertData = await Promise.all(
      listIdsiswa.map(async (siswaId) => {
        const siswa = await Siswa.findById(siswaId).sort({ nama: 1 }); // **Menambahkan pengurutan**
        return {
          id_siswa: new mongoose.Types.ObjectId(siswaId),
          nama_siswa: siswa ? siswa.nama : "Tidak ditemukan",
          id_ekstrakurikuler: new mongoose.Types.ObjectId(idEkstrakurikuler),
          waktu_scan: waktu,
        };
      })
    );

    const result = await Absensi.insertMany(insertData);

    res.status(201).json({
      message: "Absensi berhasil ditambahkan.",
      data: result,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Terjadi kesalahan saat menambahkan absensi." });
  }
};

exports.selectAbsen = async (req, res) => {
  const { tanggal, idEkstrakurikuler } = req.params;

  try {
    const { selectedData: listIdsiswa } = req.body;

    if (!idEkstrakurikuler || !Array.isArray(listIdsiswa)) {
      return res
        .status(400)
        .json({ message: "id_ekstrakurikuler dan id_siswa[] wajib diisi." });
    }

    const startOfDay = new Date(`${tanggal}T00:00:00.000Z`);
    const endOfDay = new Date(`${tanggal}T23:59:59.999Z`);

    const result = await Absensi.deleteMany({
      id_siswa: {
        $in: listIdsiswa.map((id) => new mongoose.Types.ObjectId(id)),
      },
      id_ekstrakurikuler: new mongoose.Types.ObjectId(idEkstrakurikuler),
      waktu_scan: { $gte: startOfDay, $lt: endOfDay },
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        message: "Tidak ada data absensi yang ditemukan untuk dihapus.",
      });
    }

    res.json({
      message: "Absensi berhasil dihapus.",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Terjadi kesalahan saat menghapus absensi." });
  }
};

exports.findAbsensiByMonth = async (req, res) => {
  try {
    const { idEkstrakurikuler } = req.params; // Ambil idEkstrakurikuler dari parameter
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1); // Awal bulan
    const endDate = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59
    ); // Akhir bulan

    // Validasi apakah idEkstrakurikuler diberikan
    if (!idEkstrakurikuler) {
      return res.status(400).json({
        message: "Harap berikan idEkstrakurikuler",
      });
    }

    // Ambil absensi dalam rentang bulan ini dan sesuai dengan idEkstrakurikuler
    const absensi = await Absensi.find({
      waktu_scan: {
        $gte: startDate,
        $lte: endDate,
      },
      id_ekstrakurikuler: idEkstrakurikuler, // Filter berdasarkan ekstrakurikuler
    }).sort({ waktu_scan: 1 });

    if (!absensi.length) {
      return res.status(404).json({
        message: "Tidak ada data absensi ditemukan untuk bulan ini",
      });
    }

    // Grouping data berdasarkan tanggal
    const groupedAbsensi = absensi.reduce((acc, item) => {
      const dateKey = moment(item.waktu_scan).format("YYYY-MM-DD");
      if (!acc[dateKey]) {
        acc[dateKey] = { tanggal: dateKey, data: [] };
      }
      acc[dateKey].data.push(item);
      return acc;
    }, {});

    res.json(Object.values(groupedAbsensi));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const getSiswaByEkstrakurikuler = async (idEkstrakurikuler) => {
  return await Siswa.find(
    { data_ekstrakurikuler: { $in: [idEkstrakurikuler] } },
    "nama kelas"
  ).sort({ kelas: 1 });
};
const getAbsensiByMonth = async (idEkstrakurikuler, startDate, endDate) => {
  const absensi = await Absensi.find({
    waktu_scan: { $gte: startDate, $lte: endDate },
    id_ekstrakurikuler: idEkstrakurikuler,
  }).sort({ waktu_scan: 1 });
  return absensi.reduce((grouped, item) => {
    const weekKey = convertDateToWeek(new Date(item.waktu_scan));
    if (!grouped[weekKey]) grouped[weekKey] = [];
    grouped[weekKey].push(item);
    return grouped;
  }, {});
};
const checkStudentAttendance = (siswaList, groupedAbsensi) => {
  return siswaList.map((siswa) => {
    let totalHadir = 0;
    const attendancePerWeek = {};
    Object.keys(groupedAbsensi).forEach((week) => {
      const hadir = groupedAbsensi[week].some(
        (absen) => absen.nama_siswa === siswa.nama
      );
      attendancePerWeek[week] = hadir ? "Hadir" : "Absen";
      if (hadir) totalHadir++;
    });
    return {
      nama_siswa: siswa.nama,
      kelas: siswa.kelas,
      absensi: attendancePerWeek,
      total_hadir: totalHadir,
    };
  });
};
const convertDateToWeek = (date) => {
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const weekNumber =
    Math.floor((date.getDate() - startOfMonth.getDate()) / 7) + 1;
  return `Minggu ke-${weekNumber}`;
};
exports.exportAbsensiByMonth = async (req, res) => {
  try {
    const { idEkstrakurikuler } = req.params;
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59
    );
    if (!idEkstrakurikuler) {
      return res
        .status(400)
        .json({ message: "Harap berikan idEkstrakurikuler" });
    }
    const siswaList = await getSiswaByEkstrakurikuler(idEkstrakurikuler);
    const groupedAbsensi = await getAbsensiByMonth(
      idEkstrakurikuler,
      startDate,
      endDate
    );
    const attendanceData = checkStudentAttendance(siswaList, groupedAbsensi);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Data Absensi");
    const weeks = Object.keys(groupedAbsensi).sort((a, b) =>
      a.localeCompare(b)
    );
    worksheet.columns = [
      { header: "Nama Siswa", key: "nama_siswa", width: 30 },
      { header: "Kelas", key: "kelas", width: 20 },
      ...weeks.map((week) => ({ header: week, key: week, width: 15 })),
      { header: "Total Pertemuan", key: "total_pertemuan", width: 15 },
      { header: "Jumlah Hadir", key: "total_hadir", width: 15 },
    ];
    attendanceData.forEach((siswa) => {
      const rowData = {
        nama_siswa: siswa.nama_siswa,
        kelas: siswa.kelas,
        total_pertemuan: weeks.length,
        total_hadir: siswa.total_hadir,
      };
      weeks.forEach((week) => {
        rowData[week] = siswa.absensi[week] || "Absen";
      });
      const row = worksheet.addRow(rowData);
      weeks.forEach((week, index) => {
        const cell = row.getCell(index + 3);
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: {
            argb: rowData[week] === "Hadir" ? "FF217346" : "FFFF4D4D", // warna latar
          },
        };

        cell.font = {
          color: { argb: "FFFFFFFF" }, // warna teks putih
          bold: true, // opsional, supaya teks lebih jelas
        };
      });
    });
    const filePath = path.join(__dirname, "absensi_bulan_ini.xlsx");
    await workbook.xlsx.writeFile(filePath);
    res.download(filePath, "absensi_bulan_ini.xlsx");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// semester
const getSemesterRegisteredStudents = async (idEkstrakurikuler) => {
  return await Siswa.find(
    { data_ekstrakurikuler: { $in: [idEkstrakurikuler] } },
    "nama kelas"
  ).sort({ kelas: 1 });
};

const getSemesterAttendanceByWeek = async (
  idEkstrakurikuler,
  startDate,
  endDate
) => {
  const absensi = await Absensi.find({
    waktu_scan: { $gte: startDate, $lte: endDate },
    id_ekstrakurikuler: idEkstrakurikuler,
  }).sort({ waktu_scan: 1 });

  return absensi.reduce((grouped, item) => {
    const weekKey = convertDateToWeekAndMonth(new Date(item.waktu_scan));
    if (!grouped[weekKey]) grouped[weekKey] = [];
    grouped[weekKey].push(item);
    return grouped;
  }, {});
};

const checkSemesterStudentAttendance = (siswaList, groupedAbsensi) => {
  return siswaList.map((siswa) => {
    let totalHadir = 0;
    const attendancePerWeek = {};

    Object.keys(groupedAbsensi).forEach((week) => {
      const hadir = groupedAbsensi[week].some(
        (absen) => absen.nama_siswa === siswa.nama
      );
      attendancePerWeek[week] = hadir ? "Hadir" : "Absen";
      if (hadir) totalHadir++;
    });

    return {
      nama_siswa: siswa.nama,
      kelas: siswa.kelas,
      absensi: attendancePerWeek,
      total_hadir: totalHadir,
    };
  });
};

// ✅ Fungsi baru: Ubah tanggal ke format "Minggu ke-X Bulan"
const convertDateToWeekAndMonth = (date) => {
  const weekNumber = Math.floor((date.getDate() - 1) / 7) + 1;
  const monthName = date.toLocaleString("id-ID", { month: "long" }); // contoh: Januari
  return `Minggu ke-${weekNumber} ${monthName}`;
};

exports.exportSemesterAttendance = async (req, res) => {
  try {
    const { idEkstrakurikuler } = req.params;
    const now = new Date();
    const startYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    let startDate, endDate;
    if (currentMonth <= 7) {
      startDate = new Date(startYear, 0, 1);
      endDate = new Date(startYear, 6, 31, 23, 59, 59);
    } else {
      startDate = new Date(startYear, 7, 1);
      endDate = new Date(startYear, 11, 31, 23, 59, 59);
    }

    if (!idEkstrakurikuler) {
      return res
        .status(400)
        .json({ message: "Harap berikan idEkstrakurikuler" });
    }

    const siswaList = await getSemesterRegisteredStudents(idEkstrakurikuler);
    const groupedAbsensi = await getSemesterAttendanceByWeek(
      idEkstrakurikuler,
      startDate,
      endDate
    );
    const attendanceData = checkSemesterStudentAttendance(
      siswaList,
      groupedAbsensi
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Absensi Semester");

    const bulanIndo = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];

    // Fungsi sortir berdasarkan bulan dan minggu
    const parseWeek = (weekStr) => {
      const match = weekStr.match(/Minggu ke-(\d+)\s+(\w+)/);
      if (!match) return { minggu: 0, bulan: 0 };
      const [, mingguStr, namaBulan] = match;
      return {
        minggu: parseInt(mingguStr),
        bulan: bulanIndo.indexOf(namaBulan),
      };
    };

    const weeks = Object.keys(groupedAbsensi).sort((a, b) => {
      const weekA = parseWeek(a);
      const weekB = parseWeek(b);
      if (weekA.bulan === weekB.bulan) {
        return weekA.minggu - weekB.minggu;
      }
      return weekA.bulan - weekB.bulan;
    });

    worksheet.columns = [
      { header: "Nama Siswa", key: "nama_siswa", width: 30 },
      { header: "Kelas", key: "kelas", width: 20 },
      ...weeks.map((week) => ({ header: week, key: week, width: 20 })),
      { header: "Total Pertemuan", key: "total_pertemuan", width: 18 },
      { header: "Jumlah Hadir", key: "total_hadir", width: 15 },
    ];

    attendanceData.forEach((siswa) => {
      const rowData = {
        nama_siswa: siswa.nama_siswa,
        kelas: siswa.kelas,
        total_pertemuan: weeks.length,
        total_hadir: siswa.total_hadir,
      };

      weeks.forEach((week) => {
        rowData[week] = siswa.absensi[week] || "Absen";
      });

      const row = worksheet.addRow(rowData);

      weeks.forEach((week, index) => {
        const cell = row.getCell(index + 3); // +3 karena kolom nama dan kelas di depan
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: {
            argb: rowData[week] === "Hadir" ? "FF217346" : "FFFF4D4D", // warna latar
          },
        };

        cell.font = {
          color: { argb: "FFFFFFFF" }, // warna teks putih
          bold: true, // opsional, supaya teks lebih jelas
        };
      });
    });

    const filePath = path.join(__dirname, "absensi_semester.xlsx");
    await workbook.xlsx.writeFile(filePath);
    res.download(filePath, "absensi_semester.xlsx");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.findAbsenTerdekat = async (req, res) => {
  try {
    const { idGuru } = req.params;

    // Query semua ekstrakurikuler yang dimiliki guru
    const activities = await Ekstrakurikuler.find({ id_guru: idGuru });

    if (activities.length === 0) {
      return res
        .status(404)
        .json({ message: "Tidak ada data ekstrakurikuler." });
    }

    // Ambil hari dan waktu sekarang
    const now = new Date();
    let currentDayIndex = now.getDay(); // 0 = Minggu, 1 = Senin, ..., 6 = Sabtu
    const days = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
    ];

    let nearestActivity = null;

    // Loop sampai menemukan ekstrakurikuler
    for (let i = 0; i < 7; i++) {
      const currentDay = days[currentDayIndex % 7]; // Ambil hari sesuai indeks (putaran kembali jika lebih dari seminggu)

      // Filter ekstrakurikuler yang sesuai hari
      const validActivities = activities.filter(
        (activity) => activity.hari === currentDay
      );

      if (validActivities.length > 0) {
        // Temukan yang terdekat berdasarkan waktu
        nearestActivity = validActivities.reduce((closest, activity) => {
          const activityTime = new Date(
            `${now.toISOString().split("T")[0]}T${activity.jam}`
          );
          return Math.abs(activityTime - now) <
            Math.abs(
              new Date(`${now.toISOString().split("T")[0]}T${closest.jam}`) -
                now
            )
            ? activity
            : closest;
        }, validActivities[0]);

        break; // Hentikan pencarian jika ditemukan
      }

      // Pindah ke hari berikutnya
      currentDayIndex++;
    }

    if (!nearestActivity) {
      return res
        .status(404)
        .json({ message: "Tidak ada ekstrakurikuler dalam minggu ini." });
    }

    res.json(nearestActivity);
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

exports.findAbsensiTerakhir = async (req, res) => {
  try {
    const { idGuru } = req.params;

    // Cari semua ekstrakurikuler yang terhubung dengan id_guru
    const ekstrakurikulerList = await Ekstrakurikuler.find({
      id_guru: idGuru,
    }).select("_id nama");

    if (ekstrakurikulerList.length === 0) {
      return res.status(404).json({
        message: "Tidak ada ekstrakurikuler ditemukan untuk guru ini.",
      });
    }

    const ekstrakurikulerMap = new Map(
      ekstrakurikulerList.map((e) => [e._id.toString(), e.nama])
    ); // Peta ID ke nama

    const absensiTerakhir = await Absensi.find({
      id_ekstrakurikuler: { $in: [...ekstrakurikulerMap.keys()] },
    })
      .sort({ waktu_scan: -1 })
      .limit(5)
      .select("id_ekstrakurikuler waktu_scan id_siswa") // Ambil ID siswa juga
      .populate("id_siswa", "nama"); // Ambil nama siswa berdasarkan ID

    if (absensiTerakhir.length === 0) {
      return res.status(404).json({ message: "Tidak ada absensi ditemukan." });
    }

    // Format hasil agar menyertakan nama siswa
    const formattedResults = absensiTerakhir.map((absen) => ({
      nama_ekstrakurikuler: ekstrakurikulerMap.get(
        absen.id_ekstrakurikuler.toString()
      ),
      nama_siswa: absen.id_siswa?.nama, // Ambil nama siswa
      waktu_scan: new Date(absen.waktu_scan).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }));

    res.json({ absensi: formattedResults });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Terjadi kesalahan server." });
  }
};

exports.GetPersentase = async (req, res) => {
  try {
    console.log(req.params.tanggal);
    const absensi = await Absensi.find({ waktu_scan: req.params.tanggal });
    if (absensi.length === 0)
      return res.status(404).json({ message: "Absensi tidak ditemukan" });
    res.json(absensi);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getStartAndEndOfMonth = (year, month) => {
  const startDate = new Date(year, month - 1, 1); // Awal bulan
  const endDate = new Date(year, month, 0, 23, 59, 59); // Akhir bulan

  return { startDate, endDate };
};

const getStartAndEndDate = (type) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  let startDate, endDate, periodName;

  if (type === "bulan") {
    startDate = new Date(year, month - 1, 1);
    endDate = new Date(year, month, 0, 23, 59, 59);
    periodName = `Bulan ${month} ${year}`;
  } else if (type === "semester") {
    if (month <= 7) {
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 6, 31, 23, 59, 59);
      periodName = "Semester 1 (Januari - Juli)";
    } else {
      startDate = new Date(year, 7, 1);
      endDate = new Date(year, 11, 31, 23, 59, 59);
      periodName = "Semester 2 (Agustus - Desember)";
    }
  } else {
    throw new Error("Tipe tidak valid! Gunakan 'bulan' atau 'semester'.");
  }

  return { startDate, endDate, periodName };
};

exports.getPersentaseKehadiranByMonth = async (req, res) => {
  try {
    const { idGuru } = req.params;

    // Query semua ekstrakurikuler yang dimiliki guru
    const activities = await Ekstrakurikuler.find({ id_guru: idGuru });

    if (activities.length === 0) {
      return res
        .status(404)
        .json({ message: "Tidak ada data ekstrakurikuler." });
    }

    // Ambil hari dan waktu sekarang
    const now = new Date();
    let currentDayIndex = now.getDay(); // 0 = Minggu, 1 = Senin, ..., 6 = Sabtu
    const days = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
    ];

    let nearestActivity = null;

    // Loop sampai menemukan ekstrakurikuler
    for (let i = 0; i < 7; i++) {
      const currentDay = days[currentDayIndex % 7]; // Ambil hari sesuai indeks (putaran kembali jika lebih dari seminggu)

      // Filter ekstrakurikuler yang sesuai hari
      const validActivities = activities.filter(
        (activity) => activity.hari === currentDay
      );

      if (validActivities.length > 0) {
        // Temukan yang terdekat berdasarkan waktu
        nearestActivity = validActivities.reduce((closest, activity) => {
          const activityTime = new Date(
            `${now.toISOString().split("T")[0]}T${activity.jam}`
          );
          return Math.abs(activityTime - now) <
            Math.abs(
              new Date(`${now.toISOString().split("T")[0]}T${closest.jam}`) -
                now
            )
            ? activity
            : closest;
        }, validActivities[0]);

        break; // Hentikan pencarian jika ditemukan
      }

      // Pindah ke hari berikutnya
      currentDayIndex++;
    }

    const idEkstrakurikuler = nearestActivity._id;

    // 2. Dapatkan rentang tanggal bulan ini
    const { startDate, endDate, periodName } = getStartAndEndDate("bulan");

    // 3. Ambil semua absensi dalam bulan ini untuk ekstrakurikuler yang ditemukan
    const absensi = await Absensi.find({
      id_ekstrakurikuler: idEkstrakurikuler,
      waktu_scan: { $gte: startDate, $lte: endDate },
    });

    if (!absensi.length) {
      return res.status(404).json({
        message: `Tidak ada absensi ditemukan untuk ${nearestActivity.nama} dalam ${periodName}`,
      });
    }

    const groupedAbsensi = await getAbsensiByMonth(
      idEkstrakurikuler,
      startDate,
      endDate
    );

    // Ambil daftar siswa yang mengikuti ekstrakurikuler
    const siswaList = await getSiswaByEkstrakurikuler(idEkstrakurikuler);
    const totalSiswa = siswaList.length;

    if (totalSiswa === 0) {
      return res
        .status(404)
        .json({ message: "Tidak ada siswa dalam ekstrakurikuler ini" });
    }

    // Hitung total hari aktif (jumlah tanggal unik dengan absensi)
    const totalHariAktif = Object.keys(groupedAbsensi).length;

    // Hitung total kehadiran siswa dalam semua hari aktif
    const totalHadir = Object.values(groupedAbsensi).reduce(
      (sum, absensiHari) => sum + absensiHari.length,
      0
    );

    // Hitung persentase kehadiran ekstrakurikuler
    const persentaseKehadiran = (
      (totalHadir / (totalHariAktif * totalSiswa)) *
      100
    ).toFixed(2);

    res.json({
      periode: `Bulan ${now.getMonth() + 1} ${now.getFullYear()}`,
      total_hari_aktif: totalHariAktif,
      total_siswa: totalSiswa,
      total_hadir: totalHadir,
      persentase_kehadiran: persentaseKehadiran,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPersentaseKehadiranBySemester = async (req, res) => {
  try {
    const { idGuru } = req.params;

    // Query semua ekstrakurikuler yang dimiliki guru
    const activities = await Ekstrakurikuler.find({ id_guru: idGuru });

    if (activities.length === 0) {
      return res
        .status(404)
        .json({ message: "Tidak ada data ekstrakurikuler." });
    }

    // Ambil waktu sekarang dan tentukan semester aktif
    const now = new Date();
    let currentDayIndex = now.getDay();
    const days = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
    ];

    let nearestActivity = null;

    // Loop sampai menemukan ekstrakurikuler
    for (let i = 0; i < 7; i++) {
      const currentDay = days[currentDayIndex % 7];

      // Filter ekstrakurikuler yang sesuai hari
      const validActivities = activities.filter(
        (activity) => activity.hari === currentDay
      );

      if (validActivities.length > 0) {
        nearestActivity = validActivities.reduce((closest, activity) => {
          const activityTime = new Date(
            `${now.toISOString().split("T")[0]}T${activity.jam}`
          );
          return Math.abs(activityTime - now) <
            Math.abs(
              new Date(`${now.toISOString().split("T")[0]}T${closest.jam}`) -
                now
            )
            ? activity
            : closest;
        }, validActivities[0]);

        break; // Hentikan pencarian jika ditemukan
      }

      // Pindah ke hari berikutnya
      currentDayIndex++;
    }

    if (!nearestActivity) {
      return res
        .status(404)
        .json({ message: "Tidak ada ekstrakurikuler dalam minggu ini." });
    }

    const idEkstrakurikuler = nearestActivity._id;

    // 2. Dapatkan rentang tanggal untuk semester ini
    const { startDate, endDate, periodName } = getStartAndEndDate("semester");

    // 3. Ambil semua absensi dalam semester ini untuk ekstrakurikuler yang ditemukan
    const absensi = await Absensi.find({
      id_ekstrakurikuler: idEkstrakurikuler,
      waktu_scan: { $gte: startDate, $lte: endDate },
    });

    if (!absensi.length) {
      return res.status(404).json({
        message: `Tidak ada absensi ditemukan untuk ${nearestActivity.nama} dalam ${periodName}`,
      });
    }

    const groupedAbsensi = await getAbsensiByMonth(
      idEkstrakurikuler,
      startDate,
      endDate
    );

    // Ambil daftar siswa yang mengikuti ekstrakurikuler
    const siswaList = await getSiswaByEkstrakurikuler(idEkstrakurikuler);
    const totalSiswa = siswaList.length;

    if (totalSiswa === 0) {
      return res
        .status(404)
        .json({ message: "Tidak ada siswa dalam ekstrakurikuler ini." });
    }

    // Hitung total hari aktif dalam semester
    const totalHariAktif = Object.keys(groupedAbsensi).length;

    // Hitung total kehadiran siswa dalam semua hari aktif
    const totalHadir = Object.values(groupedAbsensi).reduce(
      (sum, absensiHari) => sum + absensiHari.length,
      0
    );

    // Hitung persentase kehadiran ekstrakurikuler
    const persentaseKehadiran = (
      (totalHadir / (totalHariAktif * totalSiswa)) *
      100
    ).toFixed(2);

    res.json({
      periode: periodName,
      total_hari_aktif: totalHariAktif,
      total_siswa: totalSiswa,
      total_hadir: totalHadir,
      persentase_kehadiran: persentaseKehadiran,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPersentaseKehadiranBySemester = async (req, res) => {
  try {
    const { idGuru } = req.params;

    // Query semua ekstrakurikuler yang dimiliki guru
    const activities = await Ekstrakurikuler.find({ id_guru: idGuru });

    if (activities.length === 0) {
      return res
        .status(404)
        .json({ message: "Tidak ada data ekstrakurikuler." });
    }

    // Ambil waktu sekarang dan tentukan semester aktif
    const now = new Date();
    let currentDayIndex = now.getDay();
    const days = [
      "Minggu",
      "Senin",
      "Selasa",
      "Rabu",
      "Kamis",
      "Jumat",
      "Sabtu",
    ];

    let nearestActivity = null;

    // Loop sampai menemukan ekstrakurikuler
    for (let i = 0; i < 7; i++) {
      const currentDay = days[currentDayIndex % 7];

      // Filter ekstrakurikuler yang sesuai hari
      const validActivities = activities.filter(
        (activity) => activity.hari === currentDay
      );

      if (validActivities.length > 0) {
        nearestActivity = validActivities.reduce((closest, activity) => {
          const activityTime = new Date(
            `${now.toISOString().split("T")[0]}T${activity.jam}`
          );
          return Math.abs(activityTime - now) <
            Math.abs(
              new Date(`${now.toISOString().split("T")[0]}T${closest.jam}`) -
                now
            )
            ? activity
            : closest;
        }, validActivities[0]);

        break; // Hentikan pencarian jika ditemukan
      }

      // Pindah ke hari berikutnya
      currentDayIndex++;
    }

    if (!nearestActivity) {
      return res
        .status(404)
        .json({ message: "Tidak ada ekstrakurikuler dalam minggu ini." });
    }

    const idEkstrakurikuler = nearestActivity._id;

    // 1. Dapatkan rentang tanggal untuk semester ini
    const { startDate, endDate, periodName } = getStartAndEndDate("semester");

    // 2. Ambil semua absensi dalam semester ini untuk ekstrakurikuler yang ditemukan
    const absensi = await Absensi.find({
      id_ekstrakurikuler: idEkstrakurikuler,
      waktu_scan: { $gte: startDate, $lte: endDate },
    });

    if (!absensi.length) {
      return res.status(404).json({
        message: `Tidak ada absensi ditemukan untuk ${nearestActivity.nama} dalam ${periodName}`,
      });
    }

    // 3. Group absensi berdasarkan tanggal
    const groupedAbsensi = absensi.reduce((acc, item) => {
      const dateKey = item.waktu_scan.toISOString().split("T")[0]; // Format YYYY-MM-DD
      if (!acc[dateKey]) {
        acc[dateKey] = { tanggal: dateKey, total_hadir: 0, total_absensi: [] };
      }
      acc[dateKey].total_absensi.push(item);
      acc[dateKey].total_hadir += 1;
      return acc;
    }, {});

    // 4. Ambil daftar siswa yang mengikuti ekstrakurikuler
    const siswaList = await getSiswaByEkstrakurikuler(idEkstrakurikuler);
    const totalSiswa = siswaList.length;

    if (totalSiswa === 0) {
      return res
        .status(404)
        .json({ message: "Tidak ada siswa dalam ekstrakurikuler ini." });
    }

    // 5. Hitung total hari aktif (jumlah tanggal unik dengan absensi)
    const totalHariAktif = Object.keys(groupedAbsensi).length;

    // 6. Hitung total kehadiran siswa dalam semua hari aktif
    const totalHadir = Object.values(groupedAbsensi).reduce(
      (sum, data) => sum + data.total_hadir,
      0
    );

    // 7. Hitung persentase kehadiran ekstrakurikuler
    const totalPertemuan = totalHariAktif * totalSiswa; // Pertemuan maksimal
    const persentaseKehadiran = ((totalHadir / totalPertemuan) * 100).toFixed(
      2
    );

    res.json({
      periode: periodName,
      total_hari_aktif: totalHariAktif,
      total_siswa: totalSiswa,
      total_hadir: totalHadir,
      persentase_kehadiran: persentaseKehadiran,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const moment = require("moment");

/**
 * Fungsi untuk mendapatkan rentang tanggal berdasarkan periode (bulan atau semester)
 * @param {string} periode - "bulan" atau "semester"
 * @returns {Object} - { startDate, endDate, periodName }
 */
const getStartAndEndDate = (periode) => {
  const now = moment();
  let startDate, endDate, periodName;

  if (periode === "bulan") {
    startDate = now.startOf("month").toDate();
    endDate = now.endOf("month").toDate();
    periodName = `Bulan ${now.format("MMMM YYYY")}`;
  } else if (periode === "semester") {
    const semesterStart =
      now.month() < 6
        ? now.startOf("year")
        : now.startOf("year").add(6, "months");
    const semesterEnd = semesterStart.clone().add(5, "months").endOf("month");
    startDate = semesterStart.toDate();
    endDate = semesterEnd.toDate();
    periodName = `Semester ${
      startDate.getMonth() < 6 ? "1" : "2"
    } - ${now.year()}`;
  } else {
    throw new Error("Periode tidak valid. Gunakan 'bulan' atau 'semester'.");
  }

  return { startDate, endDate, periodName };
};

/**
 * Fungsi untuk mengelompokkan absensi berdasarkan tanggal
 * @param {string} idEkstrakurikuler
 * @param {Date} startDate
 * @param {Date} endDate
 * @returns {Object} - Objek absensi dikelompokkan berdasarkan tanggal
 */
const getAbsensiByMonth = async (idEkstrakurikuler, startDate, endDate) => {
  const Absensi = require("../models/Absensi"); // Load model di dalam fungsi untuk menghindari masalah impor

  const absensi = await Absensi.find({
    id_ekstrakurikuler: idEkstrakurikuler,
    waktu_scan: { $gte: startDate, $lte: endDate },
  });

  return absensi.reduce((acc, item) => {
    const dateKey = moment(item.waktu_scan).format("YYYY-MM-DD");

    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }

    acc[dateKey].push(item);
    return acc;
  }, {});
};

/**
 * Fungsi untuk mendapatkan daftar siswa yang mengikuti ekstrakurikuler tertentu
 * @param {string} idEkstrakurikuler
 * @returns {Array} - Daftar siswa yang mengikuti ekstrakurikuler
 */
const getSiswaByEkstrakurikuler = async (idEkstrakurikuler) => {
  const Siswa = require("../models/Siswa"); // Load model di dalam fungsi untuk menghindari masalah impor

  return await Siswa.find({
    data_ekstrakurikuler: { $in: [idEkstrakurikuler] },
  }).sort({ nama: 1 });
};

module.exports = {
  getStartAndEndDate,
  getAbsensiByMonth,
  getSiswaByEkstrakurikuler,
};

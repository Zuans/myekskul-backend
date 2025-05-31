const mongoose = require("mongoose");

const AbsensiSchema = new mongoose.Schema(
  {
    nama_siswa: { type: String, required: true },
    id_siswa: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Siswa",
      required: true,
    },
    id_ekstrakurikuler: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ekstrakurikuler",
      required: true,
    },
    waktu_scan: { type: Date, required: true },
  },
  { _id: true }
);

const Absensi = mongoose.model("Absensi", AbsensiSchema, "Absensi");

module.exports = Absensi;

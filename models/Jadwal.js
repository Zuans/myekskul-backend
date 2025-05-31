const mongoose = require("mongoose");

const JadwalEkstrakurikulerSchema = new mongoose.Schema(
  {
    tanggal: { type: Date, required: true },
    id_ekstrakurikuler: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ekstrakurikuler",
      required: true,
    },
    nama_ekstrakurikuler: { type: String, required: true },
  },
  { _id: true }
);

const JadwalEkstrakurikuler = mongoose.model(
  "JadwalEkstrakurikuler",
  JadwalEkstrakurikulerSchema,
  "Jadwal"
);

module.exports = JadwalEkstrakurikuler;

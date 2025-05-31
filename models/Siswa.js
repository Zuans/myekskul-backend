const mongoose = require("mongoose");

// Schema untuk siswa
const SiswaSchema = new mongoose.Schema(
  {
    nama: { type: String, required: true },
    kelas: { type: String, required: true },
    data_ekstrakurikuler: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Ekstrakurikuler" },
    ],
  },
  { _id: true }
);

const Siswa = mongoose.model("Siswa", SiswaSchema, "Siswa");

module.exports = Siswa;

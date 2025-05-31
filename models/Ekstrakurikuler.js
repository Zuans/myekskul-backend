const mongoose = require("mongoose");

const EkstrakurikulerSchema = new mongoose.Schema(
  {
    nama: { type: String, required: true },
    hari: { type: String, required: true },
    jam: { type: String, required: true },
    id_guru: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Guru",
      required: true,
    }, // Referensi ke Guru
  },
  { _id: true }
);

const Ekstrakurikuler = mongoose.model(
  "Ekstrakurikuler",
  EkstrakurikulerSchema,
  "Ekstrakurikuler"
);

module.exports = Ekstrakurikuler;

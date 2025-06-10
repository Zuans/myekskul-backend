const mongoose = require("mongoose");

const guruSchema = new mongoose.Schema(
  {
    nama: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: false, // Set default value ke false
    },
    data_ekstrakulikuler: [
      {
        nama: String,
        hari: String,
        jam: String,
      },
    ],
  },
  { timestamps: true }
); // Menambahkan otomatis createdAt dan updatedAt

const Guru = mongoose.model("Guru", guruSchema, "Guru");

module.exports = Guru;

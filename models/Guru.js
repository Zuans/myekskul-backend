const mongoose = require("mongoose");

const guruSchema = new mongoose.Schema({
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
  data_ekstrakulikuler: [
    {
      nama: String,
      hari: String,
      jam: String,
    },
  ],
});

const Guru = mongoose.model("Guru", guruSchema, "Guru");

module.exports = Guru;

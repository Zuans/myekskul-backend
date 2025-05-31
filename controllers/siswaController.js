const Siswa = require("../models/Siswa");
const Ekstrakurikuler = require("../models/Ekstrakurikuler");
const ExcelJS = require("exceljs");
const generateQRCode = require("../utils/generateQRCode");
const path = require("path");
const fs = require("fs");
const Absensi = require("../models/Absensi"); // Pastikan model Absensi sudah dibuat dan sesuai'
const moment = require("moment");

// Menambahkan siswa baru
exports.createSiswa = async (req, res) => {
  try {
    const { nama, kelas, data_ekstrakurikuler } = req.body;

    // Cek apakah nama sudah ada (case-insensitive)
    const existingSiswa = await Siswa.findOne({
      nama: { $regex: `^${nama}$`, $options: "i" },
    });

    if (existingSiswa) {
      return res.status(400).json({ error: "Nama siswa sudah terdaftar" });
    }

    // Buat siswa baru
    const newSiswa = new Siswa({ nama, kelas, data_ekstrakurikuler });
    await newSiswa.save();

    res.status(201).json(newSiswa);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Mengubah data siswa berdasarkan ID
exports.updateSiswa = async (req, res) => {
  try {
    const siswa = await Siswa.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!siswa)
      return res.status(404).json({ message: "Siswa tidak ditemukan" });
    res.json(siswa);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Menghapus siswa berdasarkan ID
exports.deleteSiswa = async (req, res) => {
  try {
    const siswa = await Siswa.findByIdAndDelete(req.params.id);
    if (!siswa)
      return res.status(404).json({ message: "Siswa tidak ditemukan" });
    res.json({ message: "Siswa berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.removeEkstrakurikulerFromSiswa = async (req, res) => {
  try {
    const { idSiswa, idEkstrakurikuler } = req.params;

    // Cari siswa berdasarkan ID
    const siswa = await Siswa.findById(idSiswa);
    if (!siswa) {
      return res.status(404).json({ message: "Siswa tidak ditemukan" });
    }

    // Cek apakah ekstrakurikuler ada dalam array
    if (!siswa.data_ekstrakurikuler.includes(idEkstrakurikuler)) {
      return res
        .status(400)
        .json({ message: "Ekstrakurikuler tidak ditemukan dalam data siswa" });
    }

    // Hapus ekstrakurikuler dari array
    siswa.data_ekstrakurikuler = siswa.data_ekstrakurikuler.filter(
      (ekstraId) => ekstraId.toString() !== idEkstrakurikuler
    );

    await siswa.save();

    res.json({
      message: "Ekstrakurikuler berhasil dihapus dari data siswa",
      siswa,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mencari siswa berdasarkan nama
exports.findSiswaByName = async (req, res) => {
  try {
    const siswa = await Siswa.find({
      nama: { $regex: req.params.nama, $options: "i" },
    })
      .collation({ locale: "en", strength: 1 })
      .sort({ nama: 1 });
    if (siswa.length === 0)
      return res.status(404).json({ message: "Siswa tidak ditemukan" });
    res.json(siswa);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mengambil semua data siswa
exports.getAllSiswa = async (req, res) => {
  try {
    const siswa = await Siswa.find()
      .collation({ locale: "en", strength: 1 })
      .sort({ nama: 1 });
    res.status(200).json(siswa);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Gagal mendapatkan data siswa", error: error.message });
  }
};

exports.getSiswaWithBarcode = async (req, res) => {
  try {
    const siswa = await Siswa.findById(req.params.id);
    if (!siswa) {
      return res.status(404).json({ message: "Siswa tidak ditemukan" });
    }
    // Generate QR code dari _id siswa
    const qrCodeDataUrl = await generateQRCode(siswa._id.toString());
    res.json({
      siswa,
      barcode: qrCodeDataUrl,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.findSiswaByKelas = async (req, res) => {
  try {
    const siswa = await Siswa.find({ kelas: req.params.kelas })
      .collation({ locale: "en", strength: 1 })
      .sort({
        nama: 1,
      });

    if (siswa.length === 0) {
      return res.status(404).json({ message: "Tidak ada siswa di kelas ini" });
    }

    res.json(siswa);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.findSiswaById = async (req, res) => {
  try {
    const siswa = await Siswa.findById(req.params.id);

    if (!siswa) {
      return res.status(404).json({ message: "Siswa tidak ditemukan" });
    }

    res.json(siswa);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addEkstrakurikulerToSiswa = async (req, res) => {
  try {
    const { id, idEkstrakurikuler } = req.params;

    // Cari siswa berdasarkan ID
    const siswa = await Siswa.findById(id);
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

    if (!siswa.data_ekstrakurikuler) {
      siswa.data_ekstrakurikuler = []; // Inisialisasi sebagai array jika belum ada
    }

    // Cek apakah ekstrakurikuler sudah terdaftar
    if (siswa.data_ekstrakurikuler.includes(idEkstrakurikuler)) {
      return res.status(400).json({
        message: "Siswa sudah terdaftar dalam ekstrakurikuler ini",
      });
    }

    // Tambahkan ID ekstrakurikuler ke array
    siswa.data_ekstrakurikuler.push(idEkstrakurikuler);
    await siswa.save();

    res.json({
      message: "Ekstrakurikuler berhasil ditambahkan ke siswa",
      siswa,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.findSiswaByEkstrakurikulerId = async (req, res) => {
  try {
    const siswa = await Siswa.find({
      data_ekstrakurikuler: { $in: [req.params.id] },
    })
      .collation({ locale: "en", strength: 1 })
      .sort({ nama: 1 });

    if (siswa.length === 0) {
      return res.status(404).json({
        message: "Tidak ada siswa yang terdaftar dalam ekstrakurikuler ini",
      });
    }

    res.json(siswa);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.export = async (req, res) => {
  try {
    const siswa = req.body.siswa;

    console.log("Data siswa diterima:", siswa);

    if (!siswa || !Array.isArray(siswa)) {
      return res.status(400).json({ error: "Data siswa tidak valid!" });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Data Siswa");

    // Format kolom
    worksheet.columns = [
      { header: "No", key: "no", width: 5 },
      { header: "Nama Siswa", key: "nama", width: 30 },
      { header: "Kelas", key: "kelas", width: 10 },
    ];

    // Kelompokkan siswa berdasarkan kelas
    const groupedSiswa = siswa.reduce((acc, s) => {
      acc[s.kelas] = acc[s.kelas] || [];
      acc[s.kelas].push(s);
      return acc;
    }, {});

    // Tambahkan data ke worksheet dengan pemisahan kelas
    Object.entries(groupedSiswa).forEach(([kelas, daftarSiswa]) => {
      worksheet.addRow({ nama: `Kelas ${kelas}`, kelas: "" }).font = {
        bold: true,
      }; // Tambahkan header untuk kelas
      daftarSiswa.forEach((s, index) => {
        worksheet.addRow({ no: index + 1, nama: s.nama, kelas: s.kelas });
      });
      worksheet.addRow({}); // Tambahkan baris kosong sebagai pemisah antar kelas
    });

    // Simpan file ke disk sebelum dikirim ke frontend
    const filePath = path.join(__dirname, "DataSiswa.xlsx");
    await workbook.xlsx.writeFile(filePath);

    // Kirim file ke frontend
    res.download(filePath, "DataSiswa.xlsx");
  } catch (error) {
    console.error("Gagal membuat file Excel:", error);
    res
      .status(500)
      .json({ error: "Terjadi kesalahan saat mengekspor data siswa" });
  }
};

exports.downloadTemplate = async (req, res) => {
  try {
    const templatesDir = path.join(__dirname, "../templates"); // Pastikan direktori benar
    const filePath = path.join(templatesDir, "TemplateSiswa.xlsx");

    // **Periksa apakah folder templates ada, jika tidak maka buat**
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true }); // Buat folder jika belum ada
      console.log("Folder templates dibuat!");
    }

    // **Periksa apakah file template ada, jika tidak buat baru**
    if (!fs.existsSync(filePath)) {
      console.log("Template tidak ditemukan, membuat file baru...");

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Template Siswa");

      worksheet.columns = [
        { header: "Nama Siswa", key: "nama", width: 30 },
        { header: "Kelas", key: "kelas", width: 10 },
      ];

      await workbook.xlsx.writeFile(filePath);
      console.log("Template baru berhasil dibuat!");
    }

    // **Kirim file template ke frontend**
    res.download(filePath, "TemplateSiswa.xlsx");
  } catch (error) {
    console.error("Gagal mengunduh atau membuat template:", error);
    res
      .status(500)
      .json({ error: "Terjadi kesalahan saat mengunduh template" });
  }
};

exports.upload = async (req, res) => {
  try {
    // Periksa apakah ada file yang diunggah
    if (!req.file) {
      return res.status(400).json({ error: "Harap unggah file spreadsheet." });
    }

    // Buka file Excel yang diunggah
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(`${req.file.path}`);
    const worksheet = workbook.getWorksheet("Sheet1");

    await workbook.xlsx.readFile(req.file.path);

    if (!worksheet) {
      return res.status(400).json({ error: "Format file tidak sesuai!" });
    }

    // Ambil data dari kolom Nama Siswa dan Kelas
    const siswaData = [];
    const existingEntries = new Set(); // Menyimpan data unik dari file

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Lewati header

      const nama = row.getCell(1).value?.trim(); // Hapus spasi berlebih
      const kelas = row.getCell(2).value?.trim();

      if (nama && kelas) {
        const uniqueKey = `${nama}-${kelas}`; // Buat kunci unik untuk kombinasi Nama-Kelas
        existingEntries.add(uniqueKey);
      }
    });

    // **Cek data yang sudah ada di database**
    const existingSiswaDB = await Siswa.find({
      $or: [...existingEntries].map((key) => {
        const [nama, kelas] = key.split("-");
        return { nama, kelas };
      }),
    });

    // Konversi data database ke Set untuk pengecekan cepat
    const existingSiswaSet = new Set(
      existingSiswaDB.map((s) => `${s.nama}-${s.kelas}`)
    );

    // **Filter hanya data yang belum ada di database**
    const newSiswaData = [...existingEntries]
      .filter((key) => !existingSiswaSet.has(key))
      .map((key) => {
        const [nama, kelas] = key.split("-");
        return { nama, kelas };
      });

    // **Simpan hanya data yang belum ada**
    if (newSiswaData.length > 0) {
      const createdSiswa = await Siswa.insertMany(newSiswaData);
      res.status(200).json({
        message: "Data siswa berhasil diunggah!",
        data: createdSiswa,
      });
    } else {
      res
        .status(400)
        .json({ error: "Semua data sudah ada, tidak ada yang ditambahkan!" });
    }
  } catch (error) {
    console.error("Gagal membaca spreadsheet:", error);
    res.status(500).json({ error: "Terjadi kesalahan saat memproses file." });
  }
};

exports.getAbsensiTerakhir = async (req, res) => {
  try {
    const { idSiswa } = req.params;

    // Ambil data absensi berdasarkan idSiswa, urutkan berdasarkan waktu_scan terbaru, dan batasi 5 data
    const absensiTerakhir = await Absensi.find({ id_siswa: idSiswa })
      .sort({ waktu_scan: -1 })
      .limit(5);

    if (!absensiTerakhir.length) {
      return res
        .status(404)
        .json({ message: "Tidak ada data absensi ditemukan" });
    }

    // Ambil nama ekstrakurikuler berdasarkan id_ekstrakurikuler
    const formattedAbsensi = await Promise.all(
      absensiTerakhir.map(async (absen) => {
        const ekstrakurikuler = await Ekstrakurikuler.findOne({
          _id: absen.id_ekstrakurikuler,
        });

        return {
          ...absen.toObject(),
          waktu_scan: new Date(absen.waktu_scan).toLocaleString("id-ID", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
          nama_ekstrakurikuler: ekstrakurikuler
            ? ekstrakurikuler.nama
            : "Tidak ditemukan",
        };
      })
    );

    res.status(200).json(formattedAbsensi);
  } catch (error) {
    console.error("Error fetching absensi:", error);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

exports.getPersentasePerEkstrakurikuler = async (req, res) => {
  try {
    const { idSiswa } = req.params;

    // Cari siswa berdasarkan ID
    const siswa = await Siswa.findOne({ _id: idSiswa });

    if (!siswa) {
      return res.status(404).json({ message: "Siswa tidak ditemukan" });
    }

    // Pastikan siswa memiliki ekstrakurikuler yang diikuti
    const ekstrakurikulerIds = siswa.data_ekstrakurikuler || [];

    if (ekstrakurikulerIds.length === 0) {
      return res.status(200).json({
        message: "Siswa tidak mengikuti ekstrakurikuler",
        persentasePerEkstrakurikuler: {},
      });
    }

    // Dapatkan rentang tanggal bulan ini
    const awalBulan = moment().startOf("month").toISOString();
    const akhirBulan = moment().endOf("month").toISOString();

    let dataPerEkstrakurikuler = {};

    for (const idEkstrakurikuler of ekstrakurikulerIds) {
      // Cari nama ekstrakurikuler berdasarkan ID
      const ekstrakurikuler = await Ekstrakurikuler.findOne({
        _id: idEkstrakurikuler,
      });

      // **Jika nama ekstrakurikuler tidak ditemukan, lewati iterasi ini**
      if (!ekstrakurikuler) {
        console.log(
          `Ekstrakurikuler dengan ID ${idEkstrakurikuler} tidak ditemukan, dilewati.`
        );
        continue; // Langsung ke iterasi berikutnya
      }

      // Query jumlah pertemuan ekstrakurikuler berdasarkan ID
      const pertemuanEkstrakurikuler = await Absensi.find({
        id_ekstrakurikuler: idEkstrakurikuler,
        waktu_scan: { $gte: awalBulan, $lte: akhirBulan },
      });

      // **Gunakan Set() untuk memastikan jumlah tanggal unik**
      const tanggalPertemuanEkstrakurikuler = new Set(
        pertemuanEkstrakurikuler.map((absen) =>
          moment(absen.waktu_scan).format("DD-MM-YYYY")
        )
      );
      const jumlahTanggalAbsensiEkstrakurikuler =
        tanggalPertemuanEkstrakurikuler.size;

      // **Cari jumlah kehadiran siswa dalam ekstrakurikuler tertentu**
      const kehadiranSiswaDalamEkstrakurikuler = await Absensi.find({
        id_siswa: idSiswa,
        id_ekstrakurikuler: idEkstrakurikuler,
        waktu_scan: { $gte: awalBulan, $lte: akhirBulan },
      });

      // **Gunakan Set() untuk memastikan kehadiran unik per tanggal**
      const tanggalKehadiranSiswa = new Set(
        kehadiranSiswaDalamEkstrakurikuler.map((absen) =>
          moment(absen.waktu_scan).format("DD-MM-YYYY")
        )
      );
      const jumlahKehadiranSiswa = tanggalKehadiranSiswa.size;

      // **Hitung persentase berdasarkan jumlah kehadiran dibanding jumlah tanggal absensi ekstrakurikuler**
      const persentaseKehadiran =
        jumlahTanggalAbsensiEkstrakurikuler > 0
          ? Math.round(
              (jumlahKehadiranSiswa / jumlahTanggalAbsensiEkstrakurikuler) * 100
            )
          : 0;

      // **Masukkan data jika nama ekstrakurikuler ditemukan**
      dataPerEkstrakurikuler[idEkstrakurikuler] = {
        namaEkstrakurikuler: ekstrakurikuler.nama,
        jumlahTanggalAbsensiEkstrakurikuler,
        jumlahKehadiranSiswa,
        persentaseKehadiran: `${persentaseKehadiran}%`,
        daftarTanggalPertemuan: Array.from(tanggalPertemuanEkstrakurikuler),
      };
    }

    res.status(200).json({
      dataPerEkstrakurikuler,
    });
  } catch (error) {
    console.error(
      "Error calculating attendance percentage per extracurricular:",
      error
    );
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

exports.getJadwalNanti = async (req, res) => {
  try {
    const { idSiswa } = req.params;

    // Cari siswa berdasarkan ID
    const siswa = await Siswa.findOne({ _id: idSiswa });

    if (!siswa) {
      return res.status(404).json({ message: "Siswa tidak ditemukan" });
    }

    // Pastikan siswa memiliki ekstrakurikuler yang diikuti
    const ekstrakurikulerIds = siswa.data_ekstrakurikuler || [];

    if (ekstrakurikulerIds.length === 0) {
      return res.status(200).json({
        message: "Siswa tidak mengikuti ekstrakurikuler",
        jadwalNanti: [],
      });
    }

    // Ambil data ekstrakurikuler dari database
    const ekstrakurikulerList = await Ekstrakurikuler.find({
      _id: { $in: ekstrakurikulerIds },
    });

    // Dapatkan hari ini
    const hariIni = moment();
    let jadwalNanti = [];

    // Loop melalui setiap ekstrakurikuler untuk menentukan jadwal yang akan datang
    ekstrakurikulerList.forEach((ekstra) => {
      const hariEkstrakurikuler = ekstra.hari; // Misal: "Senin", "Rabu", "Jumat"

      if (!hariEkstrakurikuler) return;

      // Temukan tanggal terdekat berdasarkan hari ekstrakurikuler
      let tanggalPertemuan = moment().day(hariEkstrakurikuler).startOf("day");

      // Jika tanggal pertemuan sudah lewat, ambil pertemuan minggu berikutnya
      if (tanggalPertemuan.isBefore(hariIni, "day")) {
        tanggalPertemuan.add(7, "days");
      }

      // Tambahkan ke daftar jadwal nanti
      jadwalNanti.push({
        idEkstrakurikuler: ekstra._id,
        namaEkstrakurikuler: ekstra.nama,
        hari: hariEkstrakurikuler,
        tanggal: tanggalPertemuan.format("DD-MM-YYYY"),
      });
    });

    res.status(200).json({ jadwalNanti });
  } catch (error) {
    console.error("Error fetching upcoming schedule:", error);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

exports.searchJadwalNanti = async (req, res) => {
  try {
    const { idSiswa } = req.params;
    const { search } = req.params; // Ambil parameter pencarian dari request

    // Cari siswa berdasarkan ID
    const siswa = await Siswa.findOne({ _id: idSiswa });

    if (!siswa) {
      return res.status(404).json({ message: "Siswa tidak ditemukan" });
    }

    // Pastikan siswa memiliki ekstrakurikuler yang diikuti
    const ekstrakurikulerIds = siswa.data_ekstrakurikuler || [];

    if (ekstrakurikulerIds.length === 0) {
      return res.status(200).json({
        message: "Siswa tidak mengikuti ekstrakurikuler",
        jadwalNanti: [],
      });
    }

    // Jika ada parameter pencarian, tambahkan filter nama ekstrakurikuler
    let queryFilter = { _id: { $in: ekstrakurikulerIds } };

    if (search) {
      queryFilter.nama = new RegExp(search, "i"); // Pencarian tidak case-sensitive
    }

    // Ambil data ekstrakurikuler dari database berdasarkan filter
    const ekstrakurikulerList = await Ekstrakurikuler.find(queryFilter);

    // Dapatkan hari ini
    const hariIni = moment();
    let jadwalNanti = [];

    // Loop melalui setiap ekstrakurikuler untuk menentukan jadwal yang akan datang
    ekstrakurikulerList.forEach((ekstra) => {
      const hariEkstrakurikuler = ekstra.hari;

      if (!hariEkstrakurikuler) return;

      // Temukan tanggal terdekat berdasarkan hari ekstrakurikuler
      let tanggalPertemuan = moment().day(hariEkstrakurikuler).startOf("day");

      // Jika tanggal pertemuan sudah lewat, ambil pertemuan minggu berikutnya
      if (tanggalPertemuan.isBefore(hariIni, "day")) {
        tanggalPertemuan.add(7, "days");
      }

      // Tambahkan ke daftar jadwal nanti
      jadwalNanti.push({
        idEkstrakurikuler: ekstra._id,
        namaEkstrakurikuler: ekstra.nama,
        hari: hariEkstrakurikuler,
        tanggal: tanggalPertemuan.format("DD-MM-YYYY"),
      });
    });

    // Jika pencarian tidak menemukan hasil, berikan pesan yang sesuai
    if (jadwalNanti.length === 0 && search) {
      return res
        .status(404)
        .json({ message: `Tidak ditemukan jadwal untuk '${search}'` });
    }

    res.status(200).json({ jadwalNanti });
  } catch (error) {
    console.error("Error fetching upcoming schedule:", error);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

exports.searchAbsensiByEkstrakurikuler = async (req, res) => {
  try {
    const { idSiswa } = req.params;
    const { search } = req.params; // Nama ekstrakurikuler yang dicari

    // Cari siswa berdasarkan ID
    const siswa = await Siswa.findOne({ _id: idSiswa });

    if (!siswa) {
      return res.status(404).json({ message: "Siswa tidak ditemukan" });
    }

    // Pastikan siswa memiliki ekstrakurikuler yang diikuti
    const ekstrakurikulerIds = siswa.data_ekstrakurikuler || [];

    if (ekstrakurikulerIds.length === 0) {
      return res.status(200).json({
        message: "Siswa tidak mengikuti ekstrakurikuler",
        absensiList: [],
      });
    }

    // Mencari ekstrakurikuler berdasarkan nama yang diinput user
    const ekstrakurikuler = await Ekstrakurikuler.findOne({
      _id: { $in: ekstrakurikulerIds },
      nama: new RegExp(search, "i"), // Filter pencarian nama tidak case-sensitive
    });

    if (!ekstrakurikuler) {
      return res.status(404).json({
        message: `Tidak ditemukan absensi untuk '${search}'`,
        absensiList: [],
      });
    }

    // Ambil data absensi berdasarkan ekstrakurikuler dan siswa
    const absensiList = await Absensi.find({
      id_siswa: idSiswa,
      id_ekstrakurikuler: ekstrakurikuler._id,
    }).sort({ waktu_scan: -1 }); // Sort berdasarkan waktu terbaru

    // Format data yang akan dikirim ke frontend
    const formattedAbsensi = absensiList.map((absen) => ({
      tanggalAbsensi: moment(absen.waktu_scan).format("DD-MM-YYYY"),
      namaKegiatan: ekstrakurikuler.nama,
      waktuScan: moment(absen.waktu_scan).format("DD/MM - HH:mm"),
    }));

    res.status(200).json({ absensiList: formattedAbsensi });
  } catch (error) {
    console.error("Error searching attendance by extracurricular:", error);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

exports.getRiwayatAbsensi = async (req, res) => {
  try {
    const { idSiswa } = req.params;

    // Cari siswa berdasarkan ID
    const siswa = await Siswa.findOne({ _id: idSiswa });

    if (!siswa) {
      return res.status(404).json({ message: "Siswa tidak ditemukan" });
    }

    // Pastikan siswa memiliki ekstrakurikuler yang diikuti
    const ekstrakurikulerIds = siswa.data_ekstrakurikuler || [];

    if (ekstrakurikulerIds.length === 0) {
      return res.status(200).json({
        message: "Siswa tidak mengikuti ekstrakurikuler",
        riwayatAbsensi: [],
      });
    }

    // Ambil data absensi berdasarkan siswa
    const absensiList = await Absensi.find({ id_siswa: idSiswa }).sort({
      waktu_scan: -1,
    });

    // Format data yang akan dikirim ke frontend
    let formattedAbsensi = [];

    for (const absen of absensiList) {
      const ekstrakurikuler = await Ekstrakurikuler.findOne({
        _id: absen.id_ekstrakurikuler,
      });

      // Pastikan ekstrakurikuler ditemukan sebelum ditambahkan ke data riwayat
      if (!ekstrakurikuler) continue;

      formattedAbsensi.push({
        tanggalAbsensi: moment(absen.waktu_scan).format("DD-MM-YYYY"),
        namaKegiatan: ekstrakurikuler.nama,
        waktuScan: moment(absen.waktu_scan).format("DD/MM - HH:mm"),
      });
    }

    res.status(200).json({ riwayatAbsensi: formattedAbsensi });
  } catch (error) {
    console.error("Error fetching attendance history:", error);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

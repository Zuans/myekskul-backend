const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
const guruRoutes = require("./routes/guruRoutes");
const siswaRoutes = require("./routes/siswaRoutes");
const ekstrakurikulerRoutes = require("./routes/ekstrakurikulerRoutes");
const absensiRoutes = require("./routes/absensiRoutes");
const adminRoutes = require("./routes/adminRoutes");
require("dotenv").config();

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Atlas connected!"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.use("/api/guru", guruRoutes);
app.use("/api/ekstrakurikuler", ekstrakurikulerRoutes);
app.use("/api/absensi", absensiRoutes);
app.use("/api/siswa", siswaRoutes);
app.use("/api/admin", adminRoutes);

const os = require("os");

// Fungsi untuk mendapatkan IP lokal untuk pengujian LAN
const getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    for (const i of iface) {
      if (i.family === "IPv4" && !i.internal) {
        return i.address;
      }
    }
  }
  return "localhost";
};

const ENV = process.env.NODE_ENV || "development";
const PORT = process.env.PORT || 7878;

if (ENV === "production") {
  app.listen(PORT, () => {
    console.log(`🚀 Production Mode`);
    console.log(`Server running at http://localhost:${PORT}`);
  });
} else {
  const ip = getLocalIP();
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🛠 Development Mode`);
    console.log(`Server running at:`);
    console.log(`- http://localhost:${PORT}`);
    console.log(`- http://${ip}:${PORT} (LAN access)`);
  });
}

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const os = require("os");
const app = express();
require("dotenv").config();

const guruRoutes = require("./routes/guruRoutes");
const siswaRoutes = require("./routes/siswaRoutes");
const ekstrakurikulerRoutes = require("./routes/ekstrakurikulerRoutes");
const absensiRoutes = require("./routes/absensiRoutes");
const adminRoutes = require("./routes/adminRoutes");

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

const PORT = process.env.PORT || 7878;

// Fungsi untuk mendapatkan IP lokal
function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  for (let iface of Object.values(interfaces)) {
    for (let i of iface) {
      if (i.family === "IPv4" && !i.internal) {
        return i.address;
      }
    }
  }
  return "localhost";
}

const ENV = process.env.NODE_ENV || "development";

app.listen(PORT, () => {
  if (ENV === "development") {
    const ip = getLocalIPAddress();
    console.log(`🛠 Development Mode`);
    console.log(`➡️ API accessible at http://localhost:${PORT}`);
    console.log(`➡️ API accessible on LAN at http://${ip}:${PORT}`);
  } else {
    console.log(`🚀 Production Mode`);
    console.log(`Server running at port ${PORT}`);
  }
});

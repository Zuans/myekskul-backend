const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
const guruRoutes = require("./routes/guruRoutes");
const siswaRoutes = require("./routes/siswaRoutes");
const ekstrakurikulerRoutes = require("./routes/ekstrakurikulerRoutes");
const absensiRoutes = require("./routes/absensiRoutes");
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

const PORT = 7878;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

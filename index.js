const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
const guruRoutes = require("./routes/guruRoutes");
const siswaRoutes = require("./routes/siswaRoutes");
const ekstrakurikulerRoutes = require("./routes/ekstrakurikulerRoutes");
const absensiRoutes = require("./routes/absensiRoutes");

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

mongoose
  .connect("mongodb://localhost:27017/absensi-ekskul")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

app.use("/api/guru", guruRoutes);
app.use("/api/ekstrakurikuler", ekstrakurikulerRoutes);
app.use("/api/absensi", absensiRoutes);
app.use("/api/siswa", siswaRoutes);

const PORT = 7878;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

const axios = require('axios');

// Fungsi untuk mencari guru berdasarkan nama
async function cariGuru(namaGuru) {
  try {
    // Mengirim GET request ke API dengan parameter query 'nama'
    const response = await axios.get(`http://localhost:3000/api/guru`, {
      params: {
        nama: namaGuru
      }
    });

    // Menampilkan data guru yang ditemukan
    console.log('Guru Ditemukan:', response.data);
  } catch (error) {
    // Menangani error jika terjadi
    console.error('Terjadi kesalahan:', error.response ? error.response.data : error.message);
  }
}

// Cari guru dengan nama "Ibu Siti Nurhaliza"
cariGuru("Ibu Siti Nurhaliza");

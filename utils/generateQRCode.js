const QRCode = require('qrcode');

async function generateQRCode(text) {
    try {
        return await QRCode.toDataURL(text);
    } catch (err) {
        throw err;
    }
}

module.exports = generateQRCode;
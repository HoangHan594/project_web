// cronJobs.js
const cron = require('node-cron');
const Reader = require('../models/reader.model');

// Chạy mỗi 5 phút để xóa token hết hạn
cron.schedule('*/5 * * * *', async() => {
    try {
        await Reader.updateMany({ resetPasswordExpires: { $lt: Date.now() } }, { $unset: { resetPasswordToken: "", resetPasswordExpires: "" } });
        console.log('Expired tokens cleared');
    } catch (error) {
        console.error('Error clearing expired tokens:', error);
    }
});
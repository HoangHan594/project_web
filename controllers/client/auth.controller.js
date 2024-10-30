const bcrypt = require('bcrypt');
const Reader = require('../../models/reader.model');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
// [POST] /auth/login
const loginPost = async(req, res, next) => {
    try {
        const enteredEmail = req.body.email;
        const enteredPassword = req.body.password;

        const user = await Reader.findOne({ email: enteredEmail });

        if (!user) {
            res.json('wrong info');
            return;
        }

        if (!enteredPassword) {
            res.json('wrong info');
            return;
        }

        if (enteredPassword != user.password) {
            res.json('wrong info');
            return;
        }

        res.cookie("tokenUser", user.token);
        res.json('success');

    } catch (error) {
        console.log('error:', error);
        return next(new ApiError(500, error));
    }

};


// [GET] /auth/logout
const logout = async(req, res) => {
    res.clearCookie("tokenUser");
    res.send({
        success: true
    })
};

const requestPasswordReset = async(req, res) => {
    try {
        const { email } = req.body;

        const reader = await Reader.findOne({ email });
        if (!reader) {
            return res.status(404).json({ message: 'Reader not found' });
        }
        // Tạo token đặt lại mật khẩu
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpire = Date.now() + 300000;

        // Lưu token vào cơ sở dữ liệu
        reader.resetPasswordToken = resetToken;
        reader.resetPasswordExpires = resetTokenExpire;
        await reader.save();

        // Gửi email chứa link đặt lại mật khẩu
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: 'nguyenhoanghan2003@gmail.com',
                pass: 'rlzd jstj znda dadi',
            },
        });
        const mailOptions = {
            from: 'nguyenhoanghan2003@gmail.com',
            to: reader.email,
            subject: 'Password Reset',
            text: `You requested a password reset. Click the link below to reset your password:\n\n` +
                `http://localhost:3001/reset-password?token=${resetToken}\n\n` +
                `If you did not request this, please ignore this email.`,
        };

        transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Password reset email sent' });
    } catch (error) {
        console.error('Error requesting password reset:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const resetPassword = async(req, res) => {
    const { token, newPassword } = req.body;

    const reader = await Reader.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }, // Kiểm tra token còn hiệu lực
    });

    if (!reader) {
        return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Đặt lại mật khẩu
    reader.password = newPassword; // Bạn có thể hash mật khẩu trước khi lưu
    reader.resetPasswordToken = undefined;
    reader.resetPasswordExpires = undefined;
    await reader.save();
    res.status(200).json({ message: 'Password reset successful' });
};

module.exports = {
    loginPost,
    logout,
    requestPasswordReset,
    resetPassword,
}
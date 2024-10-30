const Employee = require('../../models/employee.model');
const Reader = require('../../models/reader.model');

// [GET] /admin/employee/infor
module.exports.getInfor = async(req, res) => {


    try {
        const token = req.cookies.token;
        const employee = await Employee.findOne({
            token: token,
        })
        res.status(200).json({ message: 'Send employee successfully', employee });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports.getReaders = async(req, res) => {
    try {
        const readers = await Reader.find({});
        res.status(200).json(readers);
    } catch (error) {
        res.status(500);
        throw new Error(error.message)
    }
}

module.exports.statusBook = async(req, res) => {
    try {
        // Lấy thông tin từ request
        const { readerId, bookId } = req.params;
        const { status } = req.body;

        // Kiểm tra xem reader và book có tồn tại không
        const reader = await Reader.findById(readerId);
        if (!reader) {
            return res.status(404).json({ message: "Reader not found." });
        }

        const bookIndex = reader.borrow.findIndex(book => book.id_book === bookId);
        if (bookIndex === -1) {
            return res.status(404).json({ message: "Book not found." });
        }

        const book = reader.borrow[bookIndex];
        const previousStatus = book.status;
        const paymentMethod = book.paymentMethod;

        book.status = status;
        const totalAmount = 5000 * book.quantity;

        // Xử lý theo phương thức thanh toán
        if (paymentMethod === 'account') {
            // Trường hợp thanh toán qua tài khoản
            if (status === 'accepted' && previousStatus !== 'accepted') {
                // Trừ tiền nếu trạng thái chuyển sang "accepted"
                if (reader.accountBalance < totalAmount) {
                    return res.status(400).json({ message: 'Insufficient account balance' });
                }
                reader.accountBalance -= totalAmount;
            } else if (status === 'refused' && previousStatus === 'accepted') {
                // Hoàn tiền nếu từ "accepted" chuyển sang "refused"
                reader.accountBalance += totalAmount;
            }
        } else if (paymentMethod === 'cash') {

        }
        // Lưu thay đổi vào CSDL
        await reader.save();

        // Trả về thông báo thành công
        res.status(200).json({ message: "Status updated successfully." });
    } catch (error) {
        console.error('Error updating book status:', error);
        res.status(500).json({ error: error.message });
    }
};
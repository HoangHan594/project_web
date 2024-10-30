const Reader = require("../../models/reader.model");
const Book = require('../../models/book.model');
const asyncHandler = require('express-async-handler');
const generateString = require("../../helpers/generateString");
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const create = asyncHandler(async(req, res) => {
    try {
        console.log(req.body);
        req.body.token = generateString.generateRandomString(20);
        const user = await Reader.create(req.body);
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ massage: `Error! ${error}` });
    }
})

const getUser = asyncHandler(async(req, res) => {
    try {
        const tokenUser = req.headers.authorization.split(" ")[1];
        const reader = await Reader.findOne({
            token: tokenUser
        })
        res.status(200).json({ message: "Send reader successfully.", reader });
    } catch (error) {
        res.status(500).json({ massage: `Error! ${error}` });
    }
})

const getAll = async(req, res) => {
    try {
        const reader = await Reader.find({});
        res.status(200).json(reader);
    } catch (error) {
        res.status(500);
        throw new Error(error.message)
    }
}

const borrowBook = async(req, res) => {
    try {
        const tokenUser = req.cookies.tokenUser;
        if (tokenUser) {
            const reader = await Reader.findOne({ token: tokenUser });

            if (!reader) {
                return res.status(404).json({ message: 'Reader not found' });
            }

            if (!Array.isArray(reader.borrow)) {
                reader.borrow = [];
            }

            const newBorrow = {
                id_book: req.body.borrow.id_book,
                status: req.body.borrow.status || "processing",
                borrowDate: req.body.borrow.borrowDate || "01/01/2024",
                returnDate: req.body.borrow.returnDate || "31/12/2024",
                quantity: req.body.borrow.quantity || 1,
                paymentMethod: req.body.borrow.paymentMethod,
            };

            const readers = await Reader.find({});
            let borrowedBookQuantity = 0;

            readers.forEach(function(reader) {
                reader.borrow.forEach(function(borrow) {
                    if (borrow.id_book === req.body.borrow.id_book) {
                        borrowedBookQuantity += borrow.quantity;
                    }
                });
            });

            const book = await Book.findById(req.body.borrow.id_book);
            if (!book) {
                // Kiểm tra xem sách có tồn tại hay không
                return res.status(404).json({ message: 'Book not found' });
            }


            if (book.quantity === 0) {
                // Không còn sách trong kho
                console.log("Không còn sách trong kho để mượn");
                return res.status(400).json({ message: "Không còn sách trong kho để mượn" });
            } else if (book.quantity - borrowedBookQuantity - newBorrow.quantity < 0) {
                // Số lượng sách đã được mượn bằng hoặc vượt quá số lượng sách trong kho
                console.log("Số lượng sách đã mượn đã đạt tới giới hạn");
                return res.status(400).json({ message: "Số lượng sách đã mượn đã đạt tới giới hạn" });
            }

            // Kiểm tra xem đã có quyển sách trong mảng borrow chưa
            const existingBook = reader.borrow.find(book => book.id_book === newBorrow.id_book);

            if (existingBook) {
                // Nếu đã có quyển sách trong mảng borrow, cập nhật số lượng
                existingBook.quantity += newBorrow.quantity;
                existingBook.borrowDate = newBorrow.borrowDate || '01/01/2024';
                existingBook.returnDate = newBorrow.returnDate || '31/12/2024';
                existingBook.status = newBorrow.status || "processing";
                existingBook.paymentMethod = newBorrow.paymentMethod;
            } else {
                // Nếu chưa có quyển sách trong mảng borrow, thêm borrow vào mảng
                reader.borrow.push(newBorrow);
            }

            // Lưu lại thay đổi vào cơ sở dữ liệu
            await reader.save();

            res.status(200).json({ message: 'Cập nhật mượn sách thành công', reader });
        }
    } catch (error) {
        console.error('Cập nhật mượn sách thất bại:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const deleteBookFromBorrow = asyncHandler(async(req, res) => {
    try {
        const tokenUser = req.cookies.tokenUser;
        const id = req.params.id;

        if (tokenUser) {
            const reader = await Reader.findOne({
                token: tokenUser,
            })

            if (reader) {
                // Lọc ra các sách trong borrow mà id_book không bằng id cần xóa
                reader.borrow = reader.borrow.filter(book => book.id_book !== id);

                // Lưu thay đổi vào CSDL
                await reader.save();

                res.status(200).json({ message: "Book deleted successfully." });
            } else {
                res.status(404).json({ message: "Reader not found." });
            }

        } else {
            res.status(401).json({ message: "Unauthorized." });
        }
    } catch (error) {
        res.status(500).json({ massage: `Error! ${error}` });
    }
});

const statusBookReturn = async(req, res) => {
    try {
        // Lấy thông tin từ request
        const { readerId, bookId } = req.params;
        const { status } = req.body;
        // Kiểm tra xem reader và book có tồn tại không
        const reader = await Reader.findById(readerId);
        if (!reader) {
            res.status(404).json({ message: "Reader not found." });
            return;
        }
        const bookIndex = reader.borrow.findIndex(book => book.id_book === bookId);
        if (bookIndex === -1) {
            res.status(404).json({ message: "Book not found." });
            return;
        }
        console.log("bookIndex", bookIndex)
            // Thay đổi trạng thái sách
        reader.borrow[bookIndex].status = status;

        // // Lưu thay đổi vào CSDL
        await reader.save();

        // Trả về thông báo thành công
        res.status(200).json({ message: "Status updated successfully." });
    } catch (error) {
        res.status(500);
        throw new Error(error.message)
    }
};

const getNumberBookBorrowed = asyncHandler(async(req, res) => {
    try {
        const readers = await Reader.find({});

        let borrowedBookQuantity = 0;

        readers.forEach(function(reader) {
            reader.borrow.forEach(function(borrow) {
                if (borrow.id_book === req.params.id_book) {
                    borrowedBookQuantity += borrow.quantity;
                }
            });

        });


        res.status(200).json({ message: 'Send NumberBookBorrowed successfully', borrowedBookQuantity });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const updateBankAccount = asyncHandler(async(req, res) => {
    try {
        const tokenUser = req.cookies.tokenUser;
        if (!tokenUser) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { accountNumber, bankName, accountHolderName } = req.body;

        const reader = await Reader.findOne({ token: tokenUser });
        if (!reader) {
            return res.status(404).json({ message: 'Reader not found' });
        }

        reader.bankAccount = {
            accountNumber,
            bankName,
            accountHolderName
        };

        await reader.save();
        res.status(200).json({ message: 'Bank account updated successfully', reader });
    } catch (error) {
        console.error('Update bank account failed:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

const addFunds = asyncHandler(async(req, res) => {
    try {
        const tokenUser = req.cookies.tokenUser;
        if (!tokenUser) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { amount, bankAccountNumber } = req.body;

        const reader = await Reader.findOne({ token: tokenUser });
        if (!reader) {
            return res.status(404).json({ message: 'Reader not found' });
        }

        if (reader.bankAccount.accountNumber !== bankAccountNumber) {
            return res.status(400).json({ message: 'Bank account number does not match' });
        }

        reader.accountBalance += amount;

        await reader.save();

        res.status(200).json({ message: 'Funds added successfully', reader });
    } catch (error) {
        console.error('Failed to add funds:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

const updateProfile = asyncHandler(async(req, res) => {
    try {
        const tokenUser = req.cookies.tokenUser;
        if (!tokenUser) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { fullName, email, phone, address } = req.body;

        const reader = await Reader.findOne({ token: tokenUser });
        if (!reader) {
            return res.status(404).json({ message: 'Reader not found' });
        }

        if (fullName) reader.fullName = fullName;
        if (email) reader.email = email;
        if (phone) reader.phone = phone;
        if (address) reader.address = address;

        await reader.save();

        res.status(200).json({ message: 'Profile updated successfully', reader });
    } catch (error) {
        console.error('Update profile failed:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

const updateAccountBalance = asyncHandler(async(req, res) => {
    try {
        const tokenUser = req.cookies.tokenUser;
        if (!tokenUser) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { quantity, paymentMethod } = req.body; // Lấy số lượng và phương thức thanh toán từ body
        if (typeof quantity !== 'number' || quantity <= 0) {
            return res.status(400).json({ message: 'Invalid quantity provided' });
        }

        if (!paymentMethod || typeof paymentMethod !== 'string') {
            return res.status(400).json({ message: 'Invalid or missing payment method' });
        }

        const reader = await Reader.findOne({ token: tokenUser });
        if (!reader) {
            return res.status(404).json({ message: 'Reader not found' });
        }

        // Không trừ tiền, chỉ cập nhật trạng thái thanh toán
        res.status(200).json({
            message: 'Payment processed successfully',
            quantity,
            paymentMethod
        });
    } catch (error) {
        console.error('Update Account Balance failed:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


module.exports = {
    create,
    getAll,
    borrowBook,
    getUser,
    statusBookReturn,
    deleteBookFromBorrow,
    getNumberBookBorrowed,
    updateBankAccount,
    addFunds,
    updateProfile,
    updateAccountBalance,
}
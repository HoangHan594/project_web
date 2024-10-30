const mongoose = require('mongoose')
const slug = require('mongoose-slug-updater');
mongoose.plugin(slug);

const readerSchema = new mongoose.Schema({
    fullName: String,
    email: String,
    password: String,
    token: String,
    address: String,
    phone: String,
    borrow: [{
        id_book: String,
        status: {
            type: String,
            default: "processing" //processing accepted refused returned
        },
        borrowDate: String,
        returnDate: String,
        quantity: {
            type: Number,
            default: 1,
            require: true,
        },
        paymentMethod: String,
    }],
    accountBalance: {
        type: Number,
        validate: {
            validator: function(value) {
                return !isNaN(value);
            },
            message: props => `${props.value} is not a valid number!`
        }
    },
    bankAccount: {
        accountNumber: String,
        bankName: String,
        accountHolderName: String
    },
    resetPasswordToken: String,
    resetPasswordExpires: String,
    deleted: {
        type: Boolean,
        default: false
    },
    deletedAt: Date,
}, { timestamps: true })

const Reader = mongoose.model("Reader", readerSchema, "readers");

module.exports = Reader;
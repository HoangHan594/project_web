const mongoose = require('mongoose')
const slug = require('mongoose-slug-updater');
mongoose.plugin(slug);

const bookSchema = new mongoose.Schema({
    bookTitle: String,
    price: Number,
    quantity: Number,
    publishYear: String,
    publisherName: String,
    publisherAddress: String,
    author: String,
    thumbnail: String,
    genre: String,
    weight: String,
    packagingSize: String,
    pageNumber: Number,
    slug: {
        type: String,
        slug: "bookTitle",
        unique: true
    },
    deleted: {
        type: Boolean,
        default: false
    },
    deletedAt: Date,
}, { timestamps: true })

const Book = mongoose.model("Book", bookSchema, "books");

module.exports = Book;
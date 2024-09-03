const express = require("express");
const router = express.Router();

const controller = require("../../controllers/client/reader.controller");

router.get('/', controller.getAll);

router.put('/borrow', controller.borrowBook);

router.get('/user', controller.getUser);

router.put('/statusBookReturn/:readerId/:bookId', controller.statusBookReturn)

router.delete('/return/:id', controller.deleteBookFromBorrow)

router.get('/numberbookborrowed/:id_book', controller.getNumberBookBorrowed)

router.put('/update-bank-account', controller.updateBankAccount)

router.post('/add-funds', controller.addFunds)

router.put('/update-profile', controller.updateProfile)

router.put('/balance', controller.updateAccountBalance);

module.exports = router;
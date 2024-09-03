const bookRoutes = require("./book.route");
const readerRoutes = require("./reader.route");
const authRoutes = require("./auth.route");

const authMiddleware = require("../../middlewares/client/auth.middleware");
const controllerReader = require("../../controllers/client/reader.controller");

module.exports = (app) => {

    app.use("/books", bookRoutes);

    app.post('/reader/register', controllerReader.create)

    app.use("/reader", readerRoutes);

    app.use("/auth", authRoutes);


}
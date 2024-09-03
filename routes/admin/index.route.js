const configSystem = require("../../config/system") 

const bookRouter = require('./book.route');
const authRouter = require('./auth.route');
const employeeRouter = require('./employee.route');
const readerRouter = require('../client/reader.route');
const authMiddleware = require("../../middlewares/admin/auth.middleware");

module.exports = (app) => {
  const ADMIN_PATH = '/' + configSystem.adminPrefix;

  app.use(
    ADMIN_PATH + "/books",
    authMiddleware.authRequire,
    bookRouter
  );

  app.use(
    ADMIN_PATH + "/auth", 
    authRouter
  );

  app.use(
    ADMIN_PATH + "/employee", 
    // authMiddleware.authRequire,
    employeeRouter
  );

  app.use(
    ADMIN_PATH + "/reader", 
    // authMiddleware.authRequire,
    readerRouter
  );
}

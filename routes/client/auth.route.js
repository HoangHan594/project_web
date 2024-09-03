const express = require('express');
const router = express.Router();

const controller = require('../../controllers/client/auth.controller');

router.post('/login', controller.loginPost);

router.get("/logout", controller.logout);

router.post('/request-reset-password', controller.requestPasswordReset);

router.post('/reset-password', controller.resetPassword);

module.exports = router;
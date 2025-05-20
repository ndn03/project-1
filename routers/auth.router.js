const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middleware/auth.middleware");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/auth/refreshToken", authController.refreshToken);
router.post("/auth/changePassword", authMiddleware.authenticateToken, authController.changePassword);
router.post("/auth/logout", authMiddleware.authenticateToken, authController.logout);
router.get("/auth/status", authMiddleware.authenticateToken, authController.getUserStatus);
router.post("/auth/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

module.exports = router;
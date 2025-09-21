const express = require("express");
const router = express.Router();
const userController = require("../controller/user-controller");
const { auth } = require("../middleware/authenticate");
router.post("/register", userController.registerIdEmployee);
router.post("/login", userController.login);
router.post("/logout", auth, userController.logout);
router.post("/logoutall", auth, userController.logoutAll);
router.post("/refreshToken", userController.refreshToken);
router.get("/datauser", auth, userController.dataUser);

module.exports = router;

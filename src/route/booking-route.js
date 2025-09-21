const express = require("express");
const router = express.Router();
const bookingController = require("../controller/booking-controller");
const { auth } = require("../middleware/authenticate");

router.post("/createbooking", auth, bookingController.createBooking);
router.get("/listdatabooking", auth, bookingController.listBooking);
router.get("/listdatabookingall", auth, bookingController.listAll);
module.exports = router;

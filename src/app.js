require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const app = express();

const userRoute = require("./route/user-route.js");
const bookingRoute = require("./route/booking-route.js");
const rateLimitMiddlewear = require("./middleware/rate-limit.js");
const notFoundMiddlewear = require("./middleware/error-pathnotfound.js");
const errorMiddlewear = require("./middleware/error.js");
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(rateLimitMiddlewear);
app.use(morgan("dev"));
app.use("/user", userRoute);
app.use("/booking", bookingRoute);

app.use(notFoundMiddlewear);
app.use(errorMiddlewear);
const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server on ${PORT}`));

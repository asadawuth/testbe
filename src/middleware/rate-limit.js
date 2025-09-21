const { rateLimit } = require("express-rate-limit");
module.exports = rateLimit({
  windowMs: 60 * 1000, // 1 นาที
  limit: 150, // 100ครั้ง
  message: { message: "Too many requests from this IP" },
});

const jwt = require("jsonwebtoken");
function auth(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Access Token missing" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded; // { userId: ... }
    return next();
  } catch (e) {
    return res.status(401).json({ message: "Invalid or expired access token" });
  }
}

module.exports = { auth };

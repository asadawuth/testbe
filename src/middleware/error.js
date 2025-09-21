module.exports = (err, req, res, next) => {
  const status = err.statusCode || err.status || 500;
  console.error("actiontexterror", err.message);
  res.status(status).json({ message: err.message });
};

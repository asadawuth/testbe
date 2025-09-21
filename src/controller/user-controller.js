const { idRegisterShema, loginSchema } = require("../validator/validator-user");
const createError = require("../utils/create-error");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../model/prisma");

function generateAccessToken(userId, expires) {
  const secret = process.env.JWT_ACCESS_SECRET;
  return jwt.sign({ userId }, secret, { expiresIn: expires });
}

function parseExpiryToMs(exp) {
  const m = String(exp).match(/^(\d+)\s*([smhdy])$/i);
  if (!m) return 0;
  const n = parseInt(m[1], 10);
  const unit = m[2].toLowerCase();
  const mult = { s: 1000, m: 60000, h: 3600000, d: 86400000, y: 31536000000 }[
    unit
  ];
  return n * mult;
}

async function saveRefreshToken(userId, token, ms) {
  const expiresAt = new Date(Date.now() + ms);
  return prisma.refreshtoken.create({
    data: { token, user_id: userId, expires_at: expiresAt },
  });
}

function cookieOpts(maxAgeMs) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: maxAgeMs,
  };
}

async function revokeToken(refreshToken) {
  const stored = await prisma.refreshtoken.findFirst({
    where: { token: refreshToken },
  });
  if (!stored) throw createError("Token not found", 404);

  await prisma.refreshtoken.update({
    where: { id: stored.id },
    data: { is_revoked: true, revoked_at: new Date() },
  });
}

async function revokeAllTokensForUser(userId) {
  await prisma.refreshtoken.updateMany({
    where: { user_id: userId, is_revoked: false },
    data: { is_revoked: true, revoked_at: new Date() },
  });
}

exports.registerIdEmployee = async (req, res, next) => {
  try {
    const { value, error } = idRegisterShema.validate(req.body);
    if (error) return next(error);

    const findEmail = await prisma.user.findUnique({
      where: { email: value.email },
    });
    if (findEmail) return next(createError("Email already exists", 409));

    const findTel = await prisma.user.findUnique({
      where: { tel: value.tel },
    });
    if (findTel) return next(createError("Phone number already exists", 409));

    value.password = await bcrypt.hash(value.password, 12);
    const user = await prisma.user.create({ data: value });
    delete user.password;
    res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { value, error } = loginSchema.validate(req.body);
    if (error) return next(error);

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: value.emailOrMobile }, { tel: value.emailOrMobile }],
      },
    });
    if (!user) return next(createError("User not found", 400));

    const match = await bcrypt.compare(value.password, user.password);
    if (!match) return next(createError("Invalid password", 401));

    const accessMs = parseExpiryToMs(process.env.JWT_ACCESS_EXPIRES);
    const refreshMs = parseExpiryToMs(process.env.JWT_REFRESH_EXPIRES);
    const accessToken = generateAccessToken(
      user.id,
      process.env.JWT_ACCESS_EXPIRES
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES }
    );

    await saveRefreshToken(user.id, refreshToken, refreshMs);

    res.cookie("accessToken", accessToken, cookieOpts(accessMs));
    res.cookie("refreshToken", refreshToken, cookieOpts(refreshMs));

    const { password, ...safeUser } = user;
    res.status(200).json({ accessToken, user: safeUser });
  } catch (error) {
    next(error);
  }
};

exports.dataUser = async (req, res, next) => {
  try {
    const user = await prisma.user.findFirst({
      where: { id: req.user.userId },
    });
    if (!user) return next(createError("User not found", 404));

    const { password, ...safeUser } = user;
    res.status(200).json({ user: safeUser });
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const rt = req.cookies["refreshToken"];
    if (rt) await revokeToken(rt);

    const clear = { ...cookieOpts(0) };
    res.clearCookie("accessToken", clear);
    res.clearCookie("refreshToken", clear);

    return res.json({ message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};

exports.logoutAll = async (req, res, next) => {
  try {
    let userId = null;
    const rt = req.cookies?.refreshToken;

    if (rt) {
      const stored = await prisma.refreshtoken.findFirst({
        where: { token: rt },
      });
      if (stored) userId = stored.user_id;
    }

    if (!userId && req.headers.authorization) {
      const h = req.headers.authorization;
      const at = h.startsWith("Bearer ") ? h.slice(7) : null;
      if (at) {
        try {
          const decoded = jwt.verify(at, process.env.JWT_ACCESS_SECRET);
          userId = decoded.userId;
        } catch (_) {}
      }
    }

    if (userId) {
      await revokeAllTokensForUser(userId);
    }

    const clear = { ...cookieOpts(0) };
    res.clearCookie("accessToken", clear);
    res.clearCookie("refreshToken", clear);

    return res.json({ message: "Logged out from all devices" });
  } catch (error) {
    next(error);
  }
};
exports.refreshToken = async (req, res, next) => {
  try {
    const rt = req.cookies?.refreshToken;
    if (!rt)
      return res.status(401).json({ message: "Refresh token not found" });

    const stored = await prisma.refreshtoken.findUnique({
      where: { token: rt },
      include: { user: true },
    });

    if (!stored || stored.is_revoked)
      return res
        .status(401)
        .json({ message: "Invalid or revoked refresh token" });

    if (new Date() > stored.expires_at) {
      await prisma.refreshtoken.update({
        where: { id: stored.id },
        data: { is_revoked: true, revoked_at: new Date() },
      });
      return res.status(401).json({ message: "Refresh token expired" });
    }

    jwt.verify(rt, process.env.JWT_REFRESH_SECRET);

    const newAccess = generateAccessToken(
      stored.user.id,
      process.env.JWT_ACCESS_EXPIRES
    );

    const accessMs = parseExpiryToMs(process.env.JWT_ACCESS_EXPIRES);
    res.cookie("accessToken", newAccess, cookieOpts(accessMs));

    return res.json({ accessToken: newAccess });
  } catch (error) {
    next(error);
  }
};

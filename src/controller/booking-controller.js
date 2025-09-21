const prisma = require("../model/prisma");
const { bookingSchema } = require("../validator/validator-booking");
const createError = require("../utils/create-error");

exports.createBooking = async (req, res, next) => {
  try {
    const { value, error } = bookingSchema.validate(req.body);
    if (error) return next(error);

    const user = req.user.userId;
    if (!user) return next(createError("Not have a user", 401));

    const overlapping = await prisma.bookings.findFirst({
      where: {
        AND: [
          { check_in: { lte: value.check_out } },
          { check_out: { gte: value.check_in } },
        ],
      },
    });

    if (overlapping) {
      return next(createError("Is has a user booking.", 500));
    }

    const newBooking = await prisma.bookings.create({
      data: {
        ...value,
        user_id: user,
      },
    });

    res.status(200).json(newBooking);
  } catch (error) {
    next(error);
  }
};

exports.listBooking = async (req, res, next) => {
  try {
    const user = req.user.userId;
    const listBooking = await prisma.bookings.findMany({
      where: {
        user_id: user,
      },
      select: {
        id: true,
        check_in: true,
        check_out: true,
        user: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    const bookList = listBooking.map((b) => ({
      id: b.id,
      check_in: b.check_in,
      check_out: b.check_out,
      first_name: b.user.first_name,
      last_name: b.user.last_name,
      email: b.user.email,
    }));

    res.status(200).json(bookList);
  } catch (error) {
    next(error);
  }
};

exports.listAll = async (req, res, next) => {
  try {
    const listBooking = await prisma.bookings.findMany({
      select: {
        id: true,
        check_in: true,
        check_out: true,
        user: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    const bookList = listBooking.map((b) => ({
      id: b.id,
      check_in: b.check_in,
      check_out: b.check_out,
      first_name: b.user.first_name,
      last_name: b.user.last_name,
      email: b.user.email,
    }));

    res.status(200).json(bookList);
  } catch (error) {
    next(error);
  }
};

const Joi = require("joi");

const bookingSchema = Joi.object({
  check_in: Joi.date().greater("now").required().messages({
    "date.greater": "วันที่เช็คอินต้องเป็นวันปัจจุบันหรืออนาคต",
    "any.required": "กรุณาระบุวันที่เช็คอิน",
  }),

  check_out: Joi.date().greater(Joi.ref("check_in")).required().messages({
    "date.greater": "วันที่เช็คเอาต์ต้องมากกว่าวันที่เช็คอิน",
    "any.required": "กรุณาระบุวันที่เช็คเอาต์ (ต้องไม่เว้นว่าง)",
  }),
});

module.exports = { bookingSchema };

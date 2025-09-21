const Joi = require("joi");

const nameRegex = /^(?!\s)([A-Za-zก-๙]+\s?)+(?<!\s)$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.])[A-Za-z0-9@$!%*?&.]{8,12}$/;

const idRegisterShema = Joi.object({
  first_name: Joi.string()
    .trim()
    .min(4)
    .max(60)
    .pattern(nameRegex)
    .required()
    .messages({
      "string.empty": "กรุณากรอกชื่อ",
      "string.min": "ชื่อต้องมีอย่างน้อย 4 ตัวอักษร",
      "string.max": "ชื่อต้องไม่เกิน 60 ตัวอักษร",
      "string.pattern.base":
        "ชื่อต้องเป็นตัวอักษรไทยหรืออังกฤษเท่านั้น ห้ามตัวเลขหรือสัญลักษณ์",
    }),

  last_name: Joi.string()
    .trim()
    .min(4)
    .max(60)
    .pattern(nameRegex)
    .required()
    .messages({
      "string.empty": "กรุณากรอกนามสกุล",
      "string.min": "นามสกุลต้องมีอย่างน้อย 4 ตัวอักษร",
      "string.max": "นามสกุลต้องไม่เกิน 60 ตัวอักษร",
      "string.pattern.base":
        "นามสกุลต้องเป็นตัวอักษรไทยหรืออังกฤษเท่านั้น ห้ามตัวเลขหรือสัญลักษณ์",
    }),

  tel: Joi.string()
    .trim()
    .pattern(/^0[0-9]{9}$/)
    .required()
    .messages({
      "string.empty": "กรุณากรอกเบอร์โทรศัพท์",
      "string.pattern.base":
        "เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลัก และขึ้นต้นด้วย 0",
    }),

  password: Joi.string().trim().pattern(passwordRegex).required().messages({
    "string.empty": "กรุณากรอกรหัสผ่าน",
    "string.pattern.base":
      "รหัสผ่านต้องมี 8–12 ตัวอักษร, ต้องมีพิมพ์เล็ก พิมพ์ใหญ่ ตัวเลข และสัญลักษณ์ อย่างน้อยอย่างละ 1 ตัว และห้ามเป็นภาษาไทย",
  }),

  confirm_password: Joi.string()
    .trim()
    .valid(Joi.ref("password"))
    .required()
    .messages({
      "any.only": "รหัสผ่านยืนยันไม่ตรงกับรหัสผ่าน",
      "string.empty": "กรุณากรอกรหัสผ่านยืนยัน",
    })
    .strip(),

  email: Joi.string()
    .trim()
    .lowercase()
    .email({ tlds: { allow: false } })
    .pattern(emailRegex)
    .required()
    .messages({
      "string.empty": "กรุณากรอกอีเมล",
      "string.email": "อีเมลต้องเป็นรูปแบบที่ถูกต้อง",
      "string.pattern.base": "รูปแบบอีเมลไม่ถูกต้อง",
    }),
});

const loginSchema = Joi.object({
  emailOrMobile: Joi.string().required(),
  password: Joi.string().required(),
});

module.exports = { idRegisterShema, loginSchema };

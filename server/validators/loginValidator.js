const yup = require('yup');

// Export same validation schema as in frontend
const loginValidationSchema = yup.object({
  email_address: yup
    .string()
    .required('Please enter your email address')
    .matches(
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      'Please input the correct email address'
    ),

  login_password: yup
    .string()
    .required('Please enter your password')
    .min(8, 'Password must be at least 8 characters')
    .matches(/[a-z]/, 'Must contain at least one lowercase letter')
    .matches(/[A-Z]/, 'Must contain at least one uppercase letter')
    .matches(/\d/, 'Must contain at least one number'),
});

module.exports = loginValidationSchema;

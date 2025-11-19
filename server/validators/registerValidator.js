const yup = require('yup');

const registerValidationSchema = yup.object({
  email_address: yup
    .string()
    .required('Please enter your email address')
    .matches(
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      'Please input the correct email address'
    ),

  registration_password: yup
    .string()
    .required('Please enter your password')
    .min(8, 'Password must be at least 8 characters')
    .matches(/[a-z]/, 'Must contain at least one lowercase letter')
    .matches(/[A-Z]/, 'Must contain at least one uppercase letter')
    .matches(/\d/, 'Must contain at least one number'),

  confirm_password: yup
    .string()
    .required('Please confirm your password')
    .min(8, 'Password must be at least 8 characters')
    .matches(/[a-z]/, 'Must contain at least one lowercase letter')
    .matches(/[A-Z]/, 'Must contain at least one uppercase letter')
    .matches(/\d/, 'Must contain at least one number')
    .oneOf([yup.ref('registration_password'), null], 'Passwords must match'),
});

module.exports = registerValidationSchema;

// Email Validator
export const emailValidator = (email) => {
  if (!email) {
    return 'Email is required';
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  
  return '';
};

// Password Validator
export const passwordValidator = (password) => {
  if (!password) {
    return 'Password is required';
  }
  
  if (password.length < 6) {
    return 'Password must be at least 6 characters';
  }
  
  return '';
};

// Name Validator
export const nameValidator = (name) => {
  if (!name) {
    return 'Name is required';
  }
  
  if (name.length < 2) {
    return 'Name must be at least 2 characters';
  }
  
  return '';
};

// Phone Validator
export const phoneValidator = (phone) => {
  if (!phone) {
    return 'Phone number is required';
  }
  
  const phoneRegex = /^[0-9]{10}$/;
  
  if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
    return 'Please enter a valid 10-digit phone number';
  }
  
  return '';
};

// Generic Required Field Validator
export const requiredValidator = (value, fieldName = 'This field') => {
  if (!value || value.trim() === '') {
    return `${fieldName} is required`;
  }
  return '';
};
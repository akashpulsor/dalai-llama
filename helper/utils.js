// src/utils/validationUtils.js

/**
 * Validates email format
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if email is valid
 */
export const isValidEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return emailRegex.test(email);
  };
  
  /**
   * Validates phone number format
   * Accepts formats: +1234567890 or 1234567890
   * @param {string} phone - Phone number to validate
   * @returns {boolean} - True if phone number is valid
   */
  export const isValidPhone = (phone) => {
    const phoneRegex = /^\+?[1-9]\d{9,14}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
  };
  
  /**
   * Validates WhatsApp number format
   * Requires country code with + prefix
   * @param {string} whatsapp - WhatsApp number to validate
   * @returns {boolean} - True if WhatsApp number is valid
   */
  export const isValidWhatsApp = (whatsapp) => {
    const whatsappRegex = /^\+[1-9]\d{9,14}$/;
    return whatsappRegex.test(whatsapp.replace(/\s+/g, ''));
  };
  
  /**
   * Cleans contact information by removing whitespace
   * @param {Object} data - Object containing contact information
   * @returns {Object} - Cleaned data object
   */
  export const cleanContactData = (data) => {
    return {
      ...data,
      phone: data.phone?.replace(/\s+/g, ''),
      email: data.email?.trim(),
      whatsapp: data.whatsapp?.replace(/\s+/g, '')
    };
  };
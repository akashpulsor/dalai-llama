// passwordUtils.js

/**
 * Validates password strength based on common security requirements
 * @param {string} password - The password to validate
 * @returns {Object} Object containing validation result and error message
 */
export const validatePassword = (password) => {
    // Initialize validation result
    const result = {
      isValid: true,
      message: '',
    };
  
    // Minimum length check
    if (password.length < 8) {
      return {
        isValid: false,
        message: 'Password must be at least 8 characters long',
      };
    }
  
    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      return {
        isValid: false,
        message: 'Password must contain at least one uppercase letter',
      };
    }
  
    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      return {
        isValid: false,
        message: 'Password must contain at least one lowercase letter',
      };
    }
  
    // Check for at least one number
    if (!/\d/.test(password)) {
      return {
        isValid: false,
        message: 'Password must contain at least one number',
      };
    }
  
    // Check for at least one special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return {
        isValid: false,
        message: 'Password must contain at least one special character',
      };
    }
  
    // Check for common weak patterns
    const commonPatterns = [
      'password',
      '123456',
      'qwerty',
      'admin123',
      '12345678',
    ];
    const lowercasePassword = password.toLowerCase();
    if (commonPatterns.some(pattern => lowercasePassword.includes(pattern))) {
      return {
        isValid: false,
        message: 'Password contains common unsafe patterns',
      };
    }
  
    // Check for repeated characters (more than 3 times in a row)
    if (/(.)\1{3,}/.test(password)) {
      return {
        isValid: false,
        message: 'Password should not contain repeated characters more than 3 times',
      };
    }
  
    // Check for sequential characters
    const sequences = ['abcdefghijklmnopqrstuvwxyz', '0123456789'];
    for (const sequence of sequences) {
      for (let i = 0; i < sequence.length - 3; i++) {
        const pattern = sequence.slice(i, i + 4);
        if (lowercasePassword.includes(pattern) || 
            lowercasePassword.includes(pattern.split('').reverse().join(''))) {
          return {
            isValid: false,
            message: 'Password should not contain sequential characters',
          };
        }
      }
    }
  
    // Additional helper function to calculate password strength
    const calculateStrength = (pwd) => {
      let strength = 0;
      
      // Length contribution
      strength += Math.min(pwd.length * 2, 20);
      
      // Character variety contribution
      if (/[A-Z]/.test(pwd)) strength += 10;
      if (/[a-z]/.test(pwd)) strength += 10;
      if (/\d/.test(pwd)) strength += 10;
      if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) strength += 10;
      
      // Variety of characters
      const uniqueChars = new Set(pwd).size;
      strength += Math.min(uniqueChars * 2, 20);
      
      return Math.min(strength, 100);
    };
  
    // Calculate password strength
    const strength = calculateStrength(password);
    
    // Add strength level to the result
    if (strength < 50) {
      result.strengthLevel = 'weak';
    } else if (strength < 80) {
      result.strengthLevel = 'medium';
    } else {
      result.strengthLevel = 'strong';
    }
    
    // Add strength percentage to the result
    result.strengthScore = strength;
  
    return result;
  };
  
  /**
   * Validates if password and confirm password match
   * @param {string} password - The main password
   * @param {string} confirmPassword - The confirmation password
   * @returns {Object} Object containing validation result and error message
   */
  export const validatePasswordMatch = (password, confirmPassword) => {
    if (!password || !confirmPassword) {
      return {
        isValid: false,
        message: 'Both password fields are required',
      };
    }
  
    if (password !== confirmPassword) {
      return {
        isValid: false,
        message: 'Passwords do not match',
      };
    }
  
    return {
      isValid: true,
      message: '',
    };
  };
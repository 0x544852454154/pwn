export const validators = {
  username: (value) => {
    if (typeof value !== 'string') return 'Username must be a string';
    if (value.length < 3) return 'Username must be at least 3 characters';
    if (value.length > 50) return 'Username must be at most 50 characters';
    if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Username can only contain letters, numbers, and underscores';
    return null;
  },

  pin: (value) => {
    if (typeof value !== 'string') return 'PIN must be a string';
    if (!/^\d{6}$/.test(value)) return 'PIN must be exactly 6 digits';
    return null;
  },

  email: (value) => {
    if (typeof value !== 'string') return 'Email must be a string';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format';
    return null;
  },

  password: (value) => {
    if (typeof value !== 'string') return 'Password must be a string';
    if (value.length < 12) return 'Password must be at least 12 characters';
    return null;
  },

  challengeId: (value) => {
    const num = parseInt(value);
    if (isNaN(num) || num <= 0) return 'Invalid challenge ID';
    return null;
  },

  flag: (value) => {
    if (typeof value !== 'string') return 'Flag must be a string';
    if (value.length === 0) return 'Flag cannot be empty';
    if (value.length > 500) return 'Flag too long';
    return null;
  },

  bio: (value) => {
    if (typeof value !== 'string') return 'Bio must be a string';
    if (value.length > 500) return 'Bio must be at most 500 characters';
    return null;
  },

  url: (value) => {
    if (typeof value !== 'string') return 'URL must be a string';
    if (value.length > 500) return 'URL too long';
    if (!/^https:\/\/[^\s/$.?#].[^\s]*$/i.test(value)) return 'URL must be a valid HTTPS URL';
    return null;
  },
};

export function validate(fields) {
  const errors = {};
  for (const [field, value] of Object.entries(fields)) {
    const validator = validators[field];
    if (validator) {
      const error = validator(value);
      if (error) errors[field] = error;
    }
  }
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

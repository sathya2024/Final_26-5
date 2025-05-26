export const REGEX = {
    name: /^[A-Za-z ]{2,}$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    password: /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/,
  };
 
  export const SECURITY_QUESTIONS = [
    'What was your childhood nickname?',
    'What is the name of your favorite childhood friend?',
    'What is your mother’s maiden name?',
    'What was the name of your first pet?',
    'What is your favorite book?'
  ];
 
  export const API_ENDPOINTS = {
    register: 'http://localhost:5154/api/user/register',
    verifySecurityAnswer: 'http://localhost:5154/api/user/verify',
    forgotPassword: 'http://localhost:5154/api/user/forgot-password',
  };
 
  export const PASSWORD_STRENGTH = {
    getStrengthClass: (strength: number): string => {
      if (strength === 100) return 'bg-success';
      if (strength > 75) return 'bg-info';
      if (strength > 50) return 'bg-warning';
      return 'bg-danger';
    },
    getStrengthLabel: (strength: number): string => {
      if (strength === 100) return 'Strong';
      if (strength > 75) return 'Good';
      if (strength > 50) return 'Fair';
      return 'Weak';
    },
    getStrengthTextClass: (strength: number): string => {
      if (strength === 100) return 'text-success';
      if (strength > 75) return 'text-info';
      if (strength > 50) return 'text-warning';
      return 'text-danger';
    }
  };
 
  export const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 6) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    return Math.min(strength, 100);
  };
 
 
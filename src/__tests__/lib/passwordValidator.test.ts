import { validatePassword, getStrengthColor, getStrengthText } from '../../lib/passwordValidator';

describe('Password Validator', () => {
  describe('validatePassword', () => {
    it('should validate weak passwords correctly', () => {
      const result = validatePassword('123');
      expect(result.isValid).toBe(false);
      expect(result.strength).toBe('weak');
      expect(result.score).toBeLessThan(40);
      expect(result.issues).toContain('Password must be at least 6 characters long');
    });

    it('should validate fair passwords correctly', () => {
      const result = validatePassword('password');
      expect(result.isValid).toBe(false);
      expect(result.strength).toBe('weak'); // 'password' is a common password, so it's weak
      expect(result.score).toBeLessThan(40);
      expect(result.issues).toContain('Add at least one uppercase letter');
      expect(result.issues).toContain('Add at least one number');
      expect(result.issues).toContain('This password is too common');
    });

    it('should validate strong passwords correctly', () => {
      const result = validatePassword('MyPassword123');
      expect(result.isValid).toBe(true); // Valid password
      expect(result.strength).toBe('very-strong'); // Should be very-strong (score 85)
      expect(result.score).toBe(85); // 30 (length) + 15 (upper) + 15 (lower) + 15 (number) + 10 (length bonus) = 85
      expect(result.issues).toHaveLength(0); // No issues, just suggestions
    });

    it('should validate very strong passwords correctly', () => {
      const result = validatePassword('VeryStrongPassword123!');
      expect(result.isValid).toBe(true);
      expect(result.strength).toBe('very-strong');
      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.issues).toHaveLength(0);
    });

    it('should detect common passwords', () => {
      const result = validatePassword('password');
      expect(result.issues).toContain('This password is too common');
      expect(result.score).toBeLessThanOrEqual(20);
    });

    it('should require uppercase letters', () => {
      const result = validatePassword('password123');
      expect(result.issues).toContain('Add at least one uppercase letter');
    });

    it('should require lowercase letters', () => {
      const result = validatePassword('PASSWORD123');
      expect(result.issues).toContain('Add at least one lowercase letter');
    });

    it('should require numbers', () => {
      const result = validatePassword('Password');
      expect(result.issues).toContain('Add at least one number');
    });

    it('should suggest special characters', () => {
      const result = validatePassword('Password123');
      expect(result.suggestions).toContain('Consider adding special characters (!@#$%^&*)');
    });

    it('should limit suggestions to 3', () => {
      const result = validatePassword('a');
      expect(result.suggestions.length).toBeLessThanOrEqual(3);
    });
  });

  describe('getStrengthColor', () => {
    it('should return correct colors for each strength level', () => {
      expect(getStrengthColor('weak')).toBe('red');
      expect(getStrengthColor('fair')).toBe('orange');
      expect(getStrengthColor('strong')).toBe('green');
      expect(getStrengthColor('very-strong')).toBe('blue');
      expect(getStrengthColor('unknown')).toBe('gray');
    });
  });

  describe('getStrengthText', () => {
    it('should return correct text for each strength level', () => {
      expect(getStrengthText('weak')).toBe('Weak');
      expect(getStrengthText('fair')).toBe('Fair');
      expect(getStrengthText('strong')).toBe('Strong');
      expect(getStrengthText('very-strong')).toBe('Very Strong');
      expect(getStrengthText('unknown')).toBe('Unknown');
    });
  });
});

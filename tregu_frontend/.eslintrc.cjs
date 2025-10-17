module.exports = {
  extends: ['next/core-web-vitals'],
  rules: {
    // ═══════════════════════════════════════════════════════════════════════════════
    // BRANDING LOCKDOWN - ESLint Rules
    // Block any branding-related code patterns in frontend
    // ═══════════════════════════════════════════════════════════════════════════════
    'no-restricted-syntax': [
      'error',
      {
        selector: 'Literal[value=/branding/i]',
        message: 'Branding customization is forbidden. Use /lib/brandPolicy.ts constants.',
      },
      {
        selector: 'Literal[value=/theme/i]',
        message: 'Theme customization is forbidden. Use /lib/brandPolicy.ts constants.',
      },
      {
        selector: 'Literal[value=/logo/i]',
        message: 'Logo customization is forbidden. Use /lib/brandPolicy.ts constants.',
      },
      {
        selector: 'Literal[value=/favicon/i]',
        message: 'Favicon customization is forbidden. Use /lib/brandPolicy.ts constants.',
      },
      {
        selector: 'Literal[value=/color_scheme/i]',
        message: 'Color scheme customization is forbidden. Use /lib/brandPolicy.ts constants.',
      },
      {
        selector: 'Literal[value=/white.?label/i]',
        message: 'White-labeling is forbidden. Use /lib/brandPolicy.ts constants.',
      },
    ],
    'no-restricted-properties': [
      'error',
      {
        object: 'process',
        property: 'env',
        message: 'Direct process.env access detected. Check for branding environment variables (BRAND, THEME, COLOR, LOGO, FAVICON). Use /lib/brandPolicy.ts instead.',
      },
    ],
  },
};

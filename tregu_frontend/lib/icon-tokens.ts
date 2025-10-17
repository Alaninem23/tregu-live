/**
 * Icon Design Tokens
 * Consistent sizing, stroke, and color tokens for Tregu Enterprise icon system
 * 
 * Style Guide:
 * - Monoline: 1.5px stroke weight
 * - Rounded joins and caps
 * - No fills (except small accents)
 * - Brand-neutral monochrome
 * - Adapts to light/dark themes
 * - Print-friendly pure vector
 */

export const ICON = {
  // Stroke weight (consistent across all icons)
  strokeWidth: 1.5,
  
  // Size variants
  sizeTile: 20,      // System tiles on /enterprise landing
  sizeHeader: 24,    // Per-system page headers
  sizeDialog: 20,    // Dialog and modal icons
  sizeButton: 16,    // Action button icons
  
  // Color (inherits from text color for theme compatibility)
  color: 'currentColor',
  
  // ViewBox (standard 24x24 grid)
  viewBox: '0 0 24 24',
  
  // SVG attributes (for consistency)
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  fill: 'none',
} as const;

export type IconProps = {
  size?: number;
  className?: string;
};

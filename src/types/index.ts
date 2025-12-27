export interface BionicOptions {
  enabled: boolean;
  fixationPoint: number;
  highlightTag: 'b' | 'strong' | 'mark' | 'span';
  highlightClass: string;
  dimOpacity: number;
}

export type GradientTheme = 'none' | 'ocean' | 'sunset' | 'forest' | 'berry';

export interface GradientOptions {
  theme: GradientTheme;
  applyToHeadings: boolean;
  applyToLinks: boolean;
}

export type LayoutDirection = 'horizontal' | 'vertical';

export interface EditorSettings {
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  theme: 'light' | 'dark';
  previewFontFamily: string;
  layout: LayoutDirection;
}

import type { BionicOptions, EditorSettings, GradientOptions } from '../types';
import { GRADIENT_THEME_LIST } from './colorUtils';

const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const range = (value: unknown, min: number, max: number) => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
export const isMarkdown = (value: unknown): value is string => typeof value === 'string';
export const isBionicOptions = (value: unknown): value is BionicOptions => record(value)
  && typeof value.enabled === 'boolean' && range(value.fixationPoint, 1, 5) && Number.isInteger(value.fixationPoint)
  && typeof value.highlightTag === 'string' && ['b', 'strong', 'mark', 'span'].includes(value.highlightTag)
  && typeof value.highlightClass === 'string' && range(value.dimOpacity, 0, 100);
export const isGradientOptions = (value: unknown): value is GradientOptions => record(value)
  && GRADIENT_THEME_LIST.some(theme => theme.id === value.theme)
  && typeof value.applyToHeadings === 'boolean' && typeof value.applyToLinks === 'boolean';
export const isEditorSettings = (value: unknown): value is EditorSettings => record(value)
  && range(value.fontSize, 12, 24) && range(value.lineHeight, 1.2, 2)
  && typeof value.fontFamily === 'string' && typeof value.previewFontFamily === 'string'
  && ['light', 'dark'].includes(String(value.theme)) && ['horizontal', 'vertical'].includes(String(value.layout))
  && typeof value.panelsSwapped === 'boolean';

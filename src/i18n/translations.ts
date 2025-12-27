export type Language = 'en' | 'zh' | 'fr' | 'ja';

export interface Translations {
  appTitle: string;
  appTitleShort: string;

  bionicReading: string;
  gradientReading: string;

  on: string;
  off: string;
  enabled: string;
  disabled: string;

  leading: string;
  opacity: string;
  less: string;
  more: string;
  hidden: string;
  full: string;

  settings: string;
  typography: string;
  font: string;
  size: string;
  height: string;
  lineHeight: string;

  toggleTheme: string;
  disableBionic: string;
  enableBionic: string;
  disableGradient: string;
  enableGradient: string;
  gradient: string;

  gradientNone: string;
  gradientOcean: string;
  gradientSunset: string;
  gradientForest: string;
  gradientBerry: string;

  markdownEditor: string;
  copyMarkdown: string;
  copied: string;
  resetEditor: string;
  lines: string;
  chars: string;

  previewFontSample: string;

  sansSerif: string;
  serif: string;
  monospace: string;

  language: string;

  layoutHorizontal: string;
  layoutVertical: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    appTitle: 'Bionic Markdown Preview',
    appTitleShort: 'Bionic',

    bionicReading: 'Bionic Markdown Preview',
    gradientReading: 'Gradient Reading',

    on: 'ON',
    off: 'OFF',
    enabled: 'Enabled',
    disabled: 'Disabled',

    leading: 'Leading',
    opacity: 'Opacity',
    less: 'Less',
    more: 'More',
    hidden: 'Hidden',
    full: 'Full',

    settings: 'Settings',
    typography: 'Typography',
    font: 'Font',
    size: 'Size',
    height: 'Height',
    lineHeight: 'Line Height',

    toggleTheme: 'Toggle theme',
    disableBionic: 'Disable Bionic Markdown Preview',
    enableBionic: 'Enable Bionic Markdown Preview',
    disableGradient: 'Disable Gradient Reading',
    enableGradient: 'Enable Gradient Reading',
    gradient: 'Gradient',

    gradientNone: 'None',
    gradientOcean: 'Ocean',
    gradientSunset: 'Sunset',
    gradientForest: 'Forest',
    gradientBerry: 'Berry',

    markdownEditor: 'Markdown Editor',
    copyMarkdown: 'Copy Markdown',
    copied: 'Copied!',
    resetEditor: 'Reset Editor',
    lines: 'lines',
    chars: 'chars',

    previewFontSample: 'Preview font sample',

    sansSerif: 'Sans-Serif',
    serif: 'Serif',
    monospace: 'Monospace',

    language: 'Language',

    layoutHorizontal: 'Horizontal layout',
    layoutVertical: 'Vertical layout',
  },

  zh: {
    appTitle: 'Bionic Markdown 预览',
    appTitleShort: 'Bionic',

    bionicReading: 'Bionic Markdown 预览',
    gradientReading: '渐变阅读',

    on: '开',
    off: '关',
    enabled: '已启用',
    disabled: '已禁用',

    leading: '前导',
    opacity: '透明度',
    less: '少',
    more: '多',
    hidden: '隐藏',
    full: '完整',

    settings: '设置',
    typography: '排版',
    font: '字体',
    size: '大小',
    height: '高度',
    lineHeight: '行高',

    toggleTheme: '切换主题',
    disableBionic: '禁用 Bionic Markdown 预览',
    enableBionic: '启用 Bionic Markdown 预览',
    disableGradient: '禁用渐变阅读',
    enableGradient: '启用渐变阅读',
    gradient: '渐变',

    gradientNone: '无',
    gradientOcean: '海洋',
    gradientSunset: '日落',
    gradientForest: '森林',
    gradientBerry: '莓果',

    markdownEditor: 'Markdown 编辑器',
    copyMarkdown: '复制 Markdown',
    copied: '已复制！',
    resetEditor: '重置编辑器',
    lines: '行',
    chars: '字符',

    previewFontSample: '字体预览示例',

    sansSerif: '无衬线',
    serif: '衬线',
    monospace: '等宽',

    language: '语言',

    layoutHorizontal: '水平布局',
    layoutVertical: '垂直布局',
  },

  fr: {
    appTitle: 'Apercu Bionic Markdown',
    appTitleShort: 'Bionic',

    bionicReading: 'Apercu Bionic Markdown',
    gradientReading: 'Lecture Gradient',

    on: 'ON',
    off: 'OFF',
    enabled: 'Active',
    disabled: 'Desactive',

    leading: 'Accent',
    opacity: 'Opacite',
    less: 'Moins',
    more: 'Plus',
    hidden: 'Cache',
    full: 'Complet',

    settings: 'Parametres',
    typography: 'Typographie',
    font: 'Police',
    size: 'Taille',
    height: 'Hauteur',
    lineHeight: 'Hauteur de ligne',

    toggleTheme: 'Changer le theme',
    disableBionic: 'Desactiver Apercu Bionic Markdown',
    enableBionic: 'Activer Apercu Bionic Markdown',
    disableGradient: 'Desactiver Lecture Gradient',
    enableGradient: 'Activer Lecture Gradient',
    gradient: 'Gradient',

    gradientNone: 'Aucun',
    gradientOcean: 'Ocean',
    gradientSunset: 'Coucher',
    gradientForest: 'Foret',
    gradientBerry: 'Baies',

    markdownEditor: 'Editeur Markdown',
    copyMarkdown: 'Copier Markdown',
    copied: 'Copie !',
    resetEditor: 'Reinitialiser',
    lines: 'lignes',
    chars: 'caracteres',

    previewFontSample: 'Apercu de la police',

    sansSerif: 'Sans-Serif',
    serif: 'Serif',
    monospace: 'Monospace',

    language: 'Langue',

    layoutHorizontal: 'Disposition horizontale',
    layoutVertical: 'Disposition verticale',
  },

  ja: {
    appTitle: 'Bionic Markdown プレビュー',
    appTitleShort: 'Bionic',

    bionicReading: 'Bionic Markdown プレビュー',
    gradientReading: 'グラデーションリーディング',

    on: 'オン',
    off: 'オフ',
    enabled: '有効',
    disabled: '無効',

    leading: '強調度',
    opacity: '透明度',
    less: '少',
    more: '多',
    hidden: '非表示',
    full: '完全',

    settings: '設定',
    typography: 'タイポグラフィ',
    font: 'フォント',
    size: 'サイズ',
    height: '高さ',
    lineHeight: '行の高さ',

    toggleTheme: 'テーマ切替',
    disableBionic: 'Bionic Markdown プレビューを無効にする',
    enableBionic: 'Bionic Markdown プレビューを有効にする',
    disableGradient: 'グラデーションリーディングを無効にする',
    enableGradient: 'グラデーションリーディングを有効にする',
    gradient: 'グラデーション',

    gradientNone: 'なし',
    gradientOcean: 'オーシャン',
    gradientSunset: 'サンセット',
    gradientForest: 'フォレスト',
    gradientBerry: 'ベリー',

    markdownEditor: 'Markdown エディタ',
    copyMarkdown: 'Markdown をコピー',
    copied: 'コピーしました！',
    resetEditor: 'リセット',
    lines: '行',
    chars: '文字',

    previewFontSample: 'フォントプレビュー',

    sansSerif: 'サンセリフ',
    serif: 'セリフ',
    monospace: '等幅',

    language: '言語',

    layoutHorizontal: '横並びレイアウト',
    layoutVertical: '縦並びレイアウト',
  },
};

export const languageNames: Record<Language, string> = {
  en: 'English',
  zh: '中文',
  fr: 'Francais',
  ja: '日本語',
};

export const languageCodes: Record<Language, string> = {
  en: 'EN',
  zh: 'ZH',
  fr: 'FR',
  ja: 'JA',
};

export function detectLanguage(): Language {
  const browserLang = navigator.language.toLowerCase();

  if (browserLang.startsWith('zh')) return 'zh';
  if (browserLang.startsWith('fr')) return 'fr';
  if (browserLang.startsWith('ja')) return 'ja';

  return 'en';
}

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
  gradientLavender: string;
  gradientAutumn: string;
  gradientMint: string;
  gradientTwilight: string;
  gradientCoffee: string;
  gradientMonochrome: string;

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
  previewOnly: string;
  exitPreviewOnly: string;
  feedback: string;
  feedbackPrompt: string;
  feedbackDescription: string;
  feedbackOpenForm: string;
  feedbackCancel: string;
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
    gradientLavender: 'Lavender',
    gradientAutumn: 'Autumn',
    gradientMint: 'Mint',
    gradientTwilight: 'Twilight',
    gradientCoffee: 'Coffee',
    gradientMonochrome: 'Monochrome',

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
    previewOnly: 'Preview only',
    exitPreviewOnly: 'Exit preview only',
    feedback: 'Feedback',
    feedbackPrompt: 'Would you like to provide feedback?',
    feedbackDescription: 'Your feedback helps us improve. Clicking the link below will open a Google Form in a new tab.',
    feedbackOpenForm: 'Open Feedback Form',
    feedbackCancel: 'Cancel',
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
    gradientLavender: '薰衣草',
    gradientAutumn: '秋叶',
    gradientMint: '薄荷',
    gradientTwilight: '暮光',
    gradientCoffee: '咖啡',
    gradientMonochrome: '黑白',

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
    previewOnly: '仅预览',
    exitPreviewOnly: '退出仅预览',
    feedback: '反馈',
    feedbackPrompt: '您想要提供反馈吗？',
    feedbackDescription: '您的反馈有助于我们改进。点击下面的链接将在新标签页中打开 Google 表单。',
    feedbackOpenForm: '打开反馈表单',
    feedbackCancel: '取消',
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
    gradientLavender: 'Lavande',
    gradientAutumn: 'Automne',
    gradientMint: 'Menthe',
    gradientTwilight: 'Crépuscule',
    gradientCoffee: 'Café',
    gradientMonochrome: 'Monochrome',

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
    previewOnly: 'Apercu seul',
    exitPreviewOnly: 'Quitter apercu seul',
    feedback: 'Commentaires',
    feedbackPrompt: 'Souhaitez-vous donner votre avis ?',
    feedbackDescription: 'Vos commentaires nous aident à nous améliorer. Cliquer sur le lien ci-dessous ouvrira un formulaire Google dans un nouvel onglet.',
    feedbackOpenForm: 'Ouvrir le formulaire',
    feedbackCancel: 'Annuler',
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
    gradientLavender: 'ラベンダー',
    gradientAutumn: 'オータム',
    gradientMint: 'ミント',
    gradientTwilight: 'トワイライト',
    gradientCoffee: 'コーヒー',
    gradientMonochrome: 'モノクロ',

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
    previewOnly: 'プレビューのみ',
    exitPreviewOnly: 'プレビューのみを終了',
    feedback: 'フィードバック',
    feedbackPrompt: 'フィードバックを提供しますか？',
    feedbackDescription: 'フィードバックは改善に役立ちます。下のリンクをクリックすると、新しいタブで Google フォームが開きます。',
    feedbackOpenForm: 'フィードバックフォームを開く',
    feedbackCancel: 'キャンセル',
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

export const defaultMarkdown: Record<Language, string> = {
  en: `# Welcome to Bionic Markdown Preview

This editor combines **Markdown** editing with Bionic preview to help you read faster and with better focus.

## What is Bionic Preview?

Bionic preview guides the eyes through text by emphasizing the **initial letters** of words. This helps your brain complete words faster, resulting in:

- Faster reading speeds
- Better comprehension
- Reduced eye strain
- Improved focus

## How to Use

1. Type your Markdown in the **left panel**
2. See the live Bionic preview in the **right panel**
3. Toggle Bionic preview ON/OFF using the button in the toolbar
4. Adjust settings like bold amount using the settings panel

## Markdown Features

You can use all standard Markdown features:

### Text Formatting

- **Bold text** for emphasis
- *Italic text* for style
- ~~Strikethrough~~ for deletions

### Code

Inline \`code\` looks like this.

\`\`\`javascript
// Code blocks are not affected by Bionic preview
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

### Blockquotes

> "The only way to do great work is to love what you do."
> — Steve Jobs

### Lists

- Item one
- Item two
  - Nested item
  - Another nested item
- Item three

---

Start editing to see the magic happen!
`,

  zh: `# 欢迎使用 Bionic Markdown 预览

本编辑器将 **Markdown** 编辑与 Bionic 预览相结合，帮助您更快、更专注地阅读。

## 什么是 Bionic 预览？

Bionic 预览通过强调单词的**首字母**来引导眼睛浏览文本。这有助于大脑更快地完成单词识别，从而实现：

- 更快的阅读速度
- 更好的理解力
- 减少眼睛疲劳
- 提高专注力

## 如何使用

1. 在**左侧面板**输入您的 Markdown
2. 在**右侧面板**查看实时 Bionic 预览
3. 使用工具栏中的按钮开启/关闭 Bionic 预览
4. 使用设置面板调整加粗程度等选项

## Markdown 功能

您可以使用所有标准 Markdown 功能：

### 文本格式

- **粗体文本** 用于强调
- *斜体文本* 用于样式
- ~~删除线~~ 用于删除

### 代码

行内 \`代码\` 看起来像这样。

\`\`\`javascript
// 代码块不受 Bionic 预览影响
function greet(name) {
  return \`你好，\${name}！\`;
}
\`\`\`

### 引用

> "成就伟大事业的唯一途径就是热爱你所做的事。"
> ——史蒂夫·乔布斯

### 列表

- 项目一
- 项目二
  - 嵌套项目
  - 另一个嵌套项目
- 项目三

---

开始编辑，见证奇迹！
`,

  fr: `# Bienvenue dans Apercu Bionic Markdown

Cet editeur combine l'edition **Markdown** avec l'apercu Bionic pour vous aider a lire plus vite et avec une meilleure concentration.

## Qu'est-ce que l'apercu Bionic ?

L'apercu Bionic guide les yeux a travers le texte en mettant en valeur les **premieres lettres** des mots. Cela aide votre cerveau a completer les mots plus rapidement, ce qui permet :

- Une lecture plus rapide
- Une meilleure comprehension
- Moins de fatigue oculaire
- Une concentration amelioree

## Comment utiliser

1. Tapez votre Markdown dans le **panneau gauche**
2. Voyez l'apercu Bionic en direct dans le **panneau droit**
3. Activez/desactivez l'apercu Bionic avec le bouton dans la barre d'outils
4. Ajustez les parametres comme le niveau de gras dans le panneau de reglages

## Fonctionnalites Markdown

Vous pouvez utiliser toutes les fonctionnalites Markdown standard :

### Formatage du texte

- **Texte en gras** pour l'emphase
- *Texte en italique* pour le style
- ~~Barre~~ pour les suppressions

### Code

Le \`code\` en ligne ressemble a ceci.

\`\`\`javascript
// Les blocs de code ne sont pas affectes par l'apercu Bionic
function greet(name) {
  return \`Bonjour, \${name} !\`;
}
\`\`\`

### Citations

> "La seule facon de faire du bon travail est d'aimer ce que vous faites."
> — Steve Jobs

### Listes

- Element un
- Element deux
  - Element imbrique
  - Un autre element imbrique
- Element trois

---

Commencez a editer pour voir la magie operer !
`,

  ja: `# Bionic Markdown プレビューへようこそ

このエディタは **Markdown** 編集と Bionic プレビューを組み合わせて、より速く、より集中して読むことを支援します。

## Bionic プレビューとは？

Bionic プレビューは、単語の**最初の文字**を強調することで、目がテキストを追いやすくします。これにより脳が単語をより速く認識でき、以下の効果が得られます：

- より速い読書速度
- より良い理解力
- 目の疲労軽減
- 集中力の向上

## 使い方

1. **左パネル**に Markdown を入力
2. **右パネル**でリアルタイムの Bionic プレビューを確認
3. ツールバーのボタンで Bionic プレビューのオン/オフを切り替え
4. 設定パネルで太字の量などを調整

## Markdown 機能

すべての標準 Markdown 機能が使用できます：

### テキスト書式

- **太字テキスト** で強調
- *斜体テキスト* でスタイル
- ~~取り消し線~~ で削除

### コード

インライン \`コード\` はこのように表示されます。

\`\`\`javascript
// コードブロックは Bionic プレビューの影響を受けません
function greet(name) {
  return \`こんにちは、\${name}さん！\`;
}
\`\`\`

### 引用

> 「偉大な仕事をする唯一の方法は、自分のやっていることを愛することです。」
> ——スティーブ・ジョブズ

### リスト

- 項目1
- 項目2
  - ネストされた項目
  - 別のネストされた項目
- 項目3

---

編集を始めて、魔法を体験しましょう！
`,
};

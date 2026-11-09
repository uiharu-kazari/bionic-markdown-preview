/**
 * Script-aware emphasis for text written without spaces (Chinese, Japanese, Thai).
 *
 * Kept in step with the VS Code extension (src/markdownParser.ts, applyBionicText)
 * and the Chrome extension (lib/bionic.js). Japanese writes meaning-carrying stems
 * in kanji and grammar (particles, endings) in hiragana, so kanji are emphasized
 * and hiragana dimmed. Chinese has no such split, so only a short list of
 * grammatical characters is dimmed; negations such as 不 and 没 are kept.
 */

export type CjkFragment = { text: string; kind: 'bold' | 'dim' | 'plain' };

export const SPACELESS = /[\u2E80-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF\u0E00-\u0E7F\uFF66-\uFF9F]/;
const KANA = /[\p{Script=Hiragana}\p{Script=Katakana}]/u;
const HIRAGANA_ONLY = /^[\p{Script=Hiragana}\u30FC]+$/u;
const HAN = /\p{Script=Han}/u;
const HAN_RUNS = /\p{Script=Han}+|[^\p{Script=Han}]+/gu;
const CHINESE_FUNCTION = '的地得了着著过過是在和与與及或也都就而把被对對于於从從之其吗嗎呢吧啊';

type Segmenter = new (locale: string, options: { granularity: 'word' }) => {
  segment(input: string): Iterable<{ segment: string; isWordLike?: boolean }>;
};
const IntlSegmenter = (Intl as unknown as { Segmenter?: Segmenter }).Segmenter;

export function hasSpacelessScript(text: string): boolean {
  return SPACELESS.test(text) && IntlSegmenter !== undefined;
}

function prefix(word: string, fixationPoint: number): CjkFragment[] {
  const length = Array.from(word).length;
  const boldLength = length <= 1 ? 1 : Math.max(1, Math.min(Math.floor((length * fixationPoint) / 6), length));
  const chars = Array.from(word);
  const bold = chars.slice(0, boldLength).join('');
  const dim = chars.slice(boldLength).join('');
  return dim ? [{ text: bold, kind: 'bold' }, { text: dim, kind: 'dim' }] : [{ text: bold, kind: 'bold' }];
}

/** Split one whitespace-free run into emphasized, dimmed and plain fragments. */
export function cjkFragments(word: string, fixationPoint: number): CjkFragment[] {
  const japanese = KANA.test(word);
  const segmenter = new IntlSegmenter!(japanese ? 'ja' : 'zh', { granularity: 'word' });
  const fragments: CjkFragment[] = [];
  for (const { segment, isWordLike } of segmenter.segment(word)) {
    if (!isWordLike) {
      fragments.push({ text: segment, kind: 'plain' });
    } else if (japanese && HIRAGANA_ONLY.test(segment)) {
      fragments.push({ text: segment, kind: 'dim' });
    } else if (japanese && HAN.test(segment)) {
      for (const run of segment.match(HAN_RUNS) || []) {
        fragments.push({ text: run, kind: HAN.test(run) ? 'bold' : 'dim' });
      }
    } else if (!japanese && segment.length === 1 && CHINESE_FUNCTION.includes(segment)) {
      fragments.push({ text: segment, kind: 'dim' });
    } else {
      fragments.push(...prefix(segment, fixationPoint));
    }
  }
  return fragments;
}

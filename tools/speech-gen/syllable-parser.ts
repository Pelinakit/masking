/**
 * Syllable Parser
 * Converts text into syllables using the hyphen library
 * Supports English and Finnish
 */

import { hyphenateSync as hyphenateEn } from 'hyphen/en';
import { hyphenateSync as hyphenateFi } from 'hyphen/fi';
import { ParsedSyllable, TIMING } from './types';

export type Language = 'en' | 'fi';

/** Soft hyphen character used by the hyphen library */
const SOFT_HYPHEN = '\u00AD';

/**
 * Get the hyphenation function for a language
 */
function getHyphenator(lang: Language) {
  return lang === 'fi' ? hyphenateFi : hyphenateEn;
}

/**
 * Split a word into syllables using hyphenation
 */
function splitWordIntoSyllables(word: string, lang: Language): string[] {
  if (word.length <= 2) {
    return [word];
  }

  const hyphenate = getHyphenator(lang);

  try {
    const hyphenated = hyphenate(word, { minWordLength: 1 });
    const syllables = hyphenated.split(SOFT_HYPHEN);
    return syllables.length > 0 ? syllables : [word];
  } catch {
    // Fallback for words that can't be hyphenated
    return [word];
  }
}

/**
 * Parse text into syllables with timing information
 */
export function parseText(text: string, lang: Language = 'en'): ParsedSyllable[] {
  const syllables: ParsedSyllable[] = [];

  // Split into sentences first
  const sentences = splitSentences(text);

  for (let sentenceIdx = 0; sentenceIdx < sentences.length; sentenceIdx++) {
    const sentence = sentences[sentenceIdx];
    const words = splitWords(sentence.text);

    for (let wordIdx = 0; wordIdx < words.length; wordIdx++) {
      const word = words[wordIdx];
      const syllableTexts = splitWordIntoSyllables(word.text, lang);

      for (let syllableIdx = 0; syllableIdx < syllableTexts.length; syllableIdx++) {
        const isWordStart = syllableIdx === 0;
        const isWordEnd = syllableIdx === syllableTexts.length - 1;
        const isSentenceStart = wordIdx === 0 && syllableIdx === 0;
        const isSentenceEnd = wordIdx === words.length - 1 && isWordEnd;

        // Determine pause after this syllable
        let pauseAfter = TIMING.syllableGap;

        if (isWordEnd && !isSentenceEnd) {
          pauseAfter = word.hasCommaAfter ? TIMING.commaPause : TIMING.wordGap;
        }

        if (isSentenceEnd) {
          pauseAfter = sentence.pauseAfter;
        }

        syllables.push({
          text: syllableTexts[syllableIdx],
          isWordStart,
          isWordEnd,
          isSentenceStart,
          isSentenceEnd,
          pauseAfter,
        });
      }
    }
  }

  return syllables;
}

/**
 * Split text into sentences with their ending punctuation
 */
function splitSentences(text: string): Array<{ text: string; pauseAfter: number }> {
  const sentences: Array<{ text: string; pauseAfter: number }> = [];

  // Match sentences ending with . ! ? or end of text
  const pattern = /([^.!?]+)([.!?])?/g;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    const sentenceText = match[1].trim();
    if (!sentenceText) continue;

    const punctuation = match[2] || '.';
    let pauseAfter = TIMING.periodPause;

    if (punctuation === '!') {
      pauseAfter = TIMING.exclamationPause;
    } else if (punctuation === '?') {
      pauseAfter = TIMING.questionPause;
    }

    sentences.push({ text: sentenceText, pauseAfter });
  }

  // Handle text with no sentence-ending punctuation
  if (sentences.length === 0 && text.trim()) {
    sentences.push({ text: text.trim(), pauseAfter: TIMING.periodPause });
  }

  return sentences;
}

/**
 * Split sentence into words, handling commas
 */
function splitWords(sentence: string): Array<{ text: string; hasCommaAfter: boolean }> {
  const words: Array<{ text: string; hasCommaAfter: boolean }> = [];

  // Split on whitespace
  const tokens = sentence.split(/\s+/);

  for (const token of tokens) {
    // Track commas
    const hasComma = token.includes(',');
    // Keep letters, apostrophes, hyphens, and common diacritics
    const cleanWord = token.replace(/[^\p{L}'-]/gu, '');

    if (cleanWord) {
      words.push({ text: cleanWord, hasCommaAfter: hasComma });
    }
  }

  return words;
}

/**
 * Count syllables in a word (for reference/testing)
 */
export function countSyllables(word: string, lang: Language = 'en'): number {
  return splitWordIntoSyllables(word, lang).length;
}

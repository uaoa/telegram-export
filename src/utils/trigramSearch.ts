// Триграмний пошук для швидкого fuzzy matching

// Генеруємо триграми з тексту
export function generateTrigrams(text: string): Set<string> {
  const normalized = text.toLowerCase().trim();
  const trigrams = new Set<string>();

  // Додаємо padding для початку і кінця слова
  const padded = `  ${normalized}  `;

  for (let i = 0; i < padded.length - 2; i++) {
    trigrams.add(padded.slice(i, i + 3));
  }

  return trigrams;
}

// Обчислюємо схожість двох наборів триграм (коефіцієнт Жаккара)
export function trigramSimilarity(set1: Set<string>, set2: Set<string>): number {
  if (set1.size === 0 || set2.size === 0) return 0;

  let intersection = 0;
  for (const trigram of set1) {
    if (set2.has(trigram)) {
      intersection++;
    }
  }

  const union = set1.size + set2.size - intersection;
  return intersection / union;
}

// Перевіряємо чи текст містить підрядок (точний пошук)
export function containsSubstring(text: string, query: string): boolean {
  return text.toLowerCase().includes(query.toLowerCase());
}

// Індекс для швидкого пошуку
export interface SearchIndex<T> {
  items: T[];
  trigrams: Map<string, Set<number>>; // trigram -> set of item indices
  getText: (item: T) => string;
}

// Створюємо індекс для колекції
export function createSearchIndex<T>(
  items: T[],
  getText: (item: T) => string
): SearchIndex<T> {
  const trigrams = new Map<string, Set<number>>();

  items.forEach((item, index) => {
    const text = getText(item);
    const itemTrigrams = generateTrigrams(text);

    for (const trigram of itemTrigrams) {
      if (!trigrams.has(trigram)) {
        trigrams.set(trigram, new Set());
      }
      trigrams.get(trigram)!.add(index);
    }
  });

  return { items, trigrams, getText };
}

// Пошук по індексу
export function searchIndex<T>(
  index: SearchIndex<T>,
  query: string,
  limit: number = 100
): T[] {
  if (!query.trim()) return index.items.slice(0, limit);

  const queryLower = query.toLowerCase();
  const queryTrigrams = generateTrigrams(query);

  // Спочатку знаходимо кандидатів через триграми
  const candidateScores = new Map<number, number>();

  for (const trigram of queryTrigrams) {
    const indices = index.trigrams.get(trigram);
    if (indices) {
      for (const idx of indices) {
        candidateScores.set(idx, (candidateScores.get(idx) || 0) + 1);
      }
    }
  }

  // Сортуємо кандидатів за кількістю співпадінь
  const candidates = Array.from(candidateScores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit * 3); // Беремо більше кандидатів для уточнення

  // Уточнюємо результати
  const results: { item: T; score: number; exactMatch: boolean }[] = [];

  for (const [idx] of candidates) {
    const item = index.items[idx];
    const text = index.getText(item);
    const textLower = text.toLowerCase();

    // Точний збіг підрядка має найвищий пріоритет
    const exactMatch = textLower.includes(queryLower);

    // Рахуємо схожість по триграмах
    const itemTrigrams = generateTrigrams(text);
    const similarity = trigramSimilarity(queryTrigrams, itemTrigrams);

    // Комбінований скор
    const score = exactMatch ? 1 + similarity : similarity;

    if (score > 0.1 || exactMatch) {
      results.push({ item, score, exactMatch });
    }
  }

  // Сортуємо: спочатку точні збіги, потім за схожістю
  results.sort((a, b) => {
    if (a.exactMatch !== b.exactMatch) {
      return a.exactMatch ? -1 : 1;
    }
    return b.score - a.score;
  });

  return results.slice(0, limit).map(r => r.item);
}

// Підсвічування знайденого тексту
export function highlightMatches(text: string, query: string): string {
  if (!query.trim()) return text;

  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();

  // Знаходимо всі входження
  const indices: number[] = [];
  let pos = 0;
  while ((pos = textLower.indexOf(queryLower, pos)) !== -1) {
    indices.push(pos);
    pos += 1;
  }

  if (indices.length === 0) return text;

  // Будуємо результат з підсвіченням
  let result = '';
  let lastEnd = 0;

  for (const start of indices) {
    const end = start + query.length;
    result += escapeHtml(text.slice(lastEnd, start));
    result += `<mark>${escapeHtml(text.slice(start, end))}</mark>`;
    lastEnd = end;
  }

  result += escapeHtml(text.slice(lastEnd));
  return result;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

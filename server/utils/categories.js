// UPDATED: category labels (EN + IT) so a search for "beauty", "bellezza" or "laptops" also finds that category.
// Keep in sync with the Product model enum and client/src/i18n/locales (categories.*).
const LABELS = {
  Electronics: ["Electronics", "Elettronica"],
  Cameras: ["Cameras", "Fotocamere"],
  Laptops: ["Laptops", "Portatili"],
  Accessories: ["Accessories", "Accessori"],
  Headphones: ["Headphones", "Cuffie"],
  Phones: ["Phones", "Telefoni"],
  Foods: ["Foods", "Food", "Alimentari"],
  Books: ["Books", "Libri"],
  "Clothes/shoes": ["Clothes & shoes", "Abbigliamento e scarpe"],
  "Beauty/Health": ["Beauty & health", "Bellezza e salute"],
  Sports: ["Sports", "Sport"],
  Outdoor: ["Outdoor"],
  Home: ["Home", "Casa"],
};
const words = (text) => text.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);

// Categories whose name starts with the keyword's words (case-insensitive): "phones" matches Phones but not Headphones.
exports.categoriesForKeyword = (keyword) => {
  const query = words(keyword);
  if (!query.length) return [];
  return Object.entries(LABELS)
    .filter(([name, labels]) => {
      const tokens = new Set([...words(name), ...labels.flatMap(words)]);
      return query.every((q) => [...tokens].some((token) => token.startsWith(q)));
    })
    .map(([name]) => name);
};

const FALLBACK_FOODS = [
  { terms: ["rice"], fdcId: null, description: "Rice, cooked", carbsPer100g: 28.2 },
  { terms: ["potato"], fdcId: null, description: "Potato, cooked", carbsPer100g: 20.1 },
  { terms: ["tofu"], fdcId: null, description: "Tofu", carbsPer100g: 2.8 },
  { terms: ["pasta", "noodle"], fdcId: null, description: "Pasta, cooked", carbsPer100g: 30.9 },
  { terms: ["bread", "toast"], fdcId: null, description: "Bread", carbsPer100g: 49.4 },
  { terms: ["beans", "lentil"], fdcId: null, description: "Legumes, cooked", carbsPer100g: 20.5 },
  { terms: ["sugar"], fdcId: null, description: "Sugar", carbsPer100g: 100 },
  { terms: ["cucumber"], fdcId: null, description: "Cucumber", carbsPer100g: 3.6 },
  { terms: ["vegetable", "broccoli", "carrot"], fdcId: null, description: "Vegetables", carbsPer100g: 7 },
  { terms: ["fruit", "apple", "banana"], fdcId: null, description: "Fruit", carbsPer100g: 15 },
];

const cache = new Map();

function findFallback(query) {
  const normalized = query.toLowerCase();
  return (
    FALLBACK_FOODS.find((entry) =>
      entry.terms.some((term) => normalized.includes(term)),
    ) ?? {
      fdcId: null,
      description: `${query} (generic fallback)`,
      carbsPer100g: 12,
    }
  );
}

function getCarbohydrateNutrient(food) {
  const nutrient = food.foodNutrients?.find((entry) => {
    const name = (entry.nutrientName ?? entry.nutrient?.name ?? "").toLowerCase();
    return name === "carbohydrate, by difference";
  });
  return Number(nutrient?.value ?? nutrient?.amount);
}

async function searchFoodDataCentral(query) {
  const cacheKey = query.trim().toLowerCase();
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const apiKey = process.env.FDC_API_KEY || "DEMO_KEY";
  const params = new URLSearchParams({
    api_key: apiKey,
    query,
    dataType: "Foundation,SR Legacy,Survey (FNDDS)",
    pageSize: "8",
  });

  try {
    const response = await fetch(
      `https://api.nal.usda.gov/fdc/v1/foods/search?${params}`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!response.ok) throw new Error(`USDA returned ${response.status}`);
    const payload = await response.json();
    const candidates = (payload.foods ?? [])
      .map((food) => ({
        fdcId: food.fdcId,
        description: food.description,
        dataType: food.dataType,
        carbsPer100g: getCarbohydrateNutrient(food),
      }))
      .filter((food) => Number.isFinite(food.carbsPer100g));

    const hasUsdaMatch = candidates.length > 0;
    const best = candidates[0] ?? findFallback(query);
    const result = {
      ...best,
      candidates: candidates.slice(0, 3),
      source: hasUsdaMatch ? "USDA FDC" : "built-in fallback",
    };
    cache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.warn(`USDA lookup failed for "${query}":`, error.message);
    const result = {
      ...findFallback(query),
      candidates: [],
      source: "built-in fallback",
    };
    cache.set(cacheKey, result);
    return result;
  }
}

module.exports = { searchFoodDataCentral };

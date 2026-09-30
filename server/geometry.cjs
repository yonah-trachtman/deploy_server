const DENSITY_GRAMS_PER_CM3 = Object.freeze({
  cooked_rice: 0.67,
  cooked_pasta: 0.58,
  potato: 0.72,
  tofu: 0.96,
  bread: 0.27,
  cooked_vegetables: 0.55,
  raw_vegetables: 0.45,
  fruit: 0.65,
  beans: 0.72,
  stew: 0.92,
  soup: 1,
  mixed_dish: 0.78,
  generic_food: 0.75,
});

function clamp(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(Math.max(number, min), max);
}

function calculateVolumeCm3(shape, widthCm, depthCm, heightCm) {
  const width = clamp(widthCm, 0.2, 60);
  const depth = clamp(depthCm, 0.2, 60);
  const height = clamp(heightCm, 0.1, 30);

  switch (shape) {
    case "cuboid":
      return width * depth * height;
    case "cylinder":
      return Math.PI * (width / 2) * (depth / 2) * height;
    case "mound":
      return (2 / 3) * Math.PI * (width / 2) * (depth / 2) * height;
    case "slice":
      return width * depth * height * 0.82;
    case "mixed":
      return width * depth * height * 0.7;
    default:
      return width * depth * height * 0.6;
  }
}

function calculateFoodGeometry(item, reference) {
  const spanCm = reference.spanMm / 10;
  const geometry = item.geometry ?? {};
  const widthCm = clamp(geometry.widthReferenceUnits, 0.1, 30) * spanCm;
  const depthCm = clamp(geometry.depthReferenceUnits, 0.1, 30) * spanCm;
  const heightCm = clamp(geometry.heightReferenceUnits, 0.04, 15) * spanCm;
  const volumeCm3 = calculateVolumeCm3(
    geometry.shape,
    widthCm,
    depthCm,
    heightCm,
  );
  const density =
    DENSITY_GRAMS_PER_CM3[item.densityKey] ??
    DENSITY_GRAMS_PER_CM3.generic_food;
  const grams = clamp(volumeCm3 * density, 1, 2500);

  return {
    widthCm: round(widthCm, 1),
    depthCm: round(depthCm, 1),
    heightCm: round(heightCm, 1),
    volumeCm3: round(volumeCm3, 1),
    grams: round(grams, 1),
    densityKey: item.densityKey ?? "generic_food",
  };
}

function uncertaintyFor(item, referenceConfidence) {
  let uncertainty = 0.18;
  if ((item.confidence ?? 0) < 0.75) uncertainty += 0.1;
  if (referenceConfidence < 0.8) uncertainty += 0.08;
  if (item.mixedDish) uncertainty += 0.15;
  if (item.geometry?.shape === "irregular") uncertainty += 0.08;
  return clamp(uncertainty, 0.15, 0.55);
}

function round(value, digits = 0) {
  const multiplier = 10 ** digits;
  return Math.round(value * multiplier) / multiplier;
}

module.exports = {
  calculateFoodGeometry,
  round,
  uncertaintyFor,
};

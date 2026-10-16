const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const DRUG_PATH = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "datasets",
  "supplement_dataset",
  "drug_clean.csv"
);

let drugDataset = [];
let datasetLoaded = false;
let loadingPromise = null;

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function cleanText(value) {
  return String(value || "").trim();
}

function loadDrugDataset() {
  if (datasetLoaded) {
    return Promise.resolve(drugDataset);
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = new Promise((resolve, reject) => {
    const data = [];

    if (!fs.existsSync(DRUG_PATH)) {
      return reject(new Error(`CSV file not found: ${DRUG_PATH}`));
    }

    console.log("Loading drug dataset from:", DRUG_PATH);

    fs.createReadStream(DRUG_PATH)
      .pipe(csv())
      .on("data", (row) => {
        const name = cleanText(row.Name);
        const contains = cleanText(row.Contains);

        if (!name && !contains) return;

        data.push({
          name,
          contains,
          therapeuticClass: cleanText(row.Therapeutic_Class),
          actionClass: cleanText(row.Action_Class),
          chemicalClass: cleanText(row.Chemical_Class),
          habitForming: cleanText(row.Habit_Forming),
          riskLabel: cleanText(row.risk_label),

          _name: normalizeText(row.Name),
          _contains: normalizeText(row.Contains),
          _therapeuticClass: normalizeText(row.Therapeutic_Class),
          _actionClass: normalizeText(row.Action_Class),
        });
      })
      .on("end", () => {
        drugDataset = data;
        datasetLoaded = true;
        console.log(`Drug dataset loaded successfully: ${drugDataset.length} rows`);
        resolve(drugDataset);
      })
      .on("error", (error) => {
        reject(error);
      });
  });

  return loadingPromise;
}

function getMedicationScore(item, query) {
  const name = item._name;
  const contains = item._contains;
  const therapeuticClass = item._therapeuticClass;
  const actionClass = item._actionClass;

  let score = 0;

  // Exact matches
  if (contains === query) score += 120;
  if (name === query) score += 110;

  // Starts with query
  if (contains.startsWith(query)) score += 100;
  if (name.startsWith(query)) score += 90;

  // Word starts with query: useful for "amox" -> "amoxicillin"
  const containsWords = contains.split(/[\s,+/()%-]+/);
  const nameWords = name.split(/[\s,+/()%-]+/);

  if (containsWords.some((word) => word.startsWith(query))) score += 85;
  if (nameWords.some((word) => word.startsWith(query))) score += 75;

  // Includes query
  if (contains.includes(query)) score += 70;
  if (name.includes(query)) score += 60;

  // Lower priority class search
  if (therapeuticClass.includes(query)) score += 25;
  if (actionClass.includes(query)) score += 20;

  return score;
}

exports.searchMedications = async (req, res) => {
  try {
    const query = normalizeText(req.query.q || req.query.query || "");

    if (query.length < 2) {
      return res.json({
        success: true,
        count: 0,
        data: [],
      });
    }

    await loadDrugDataset();

    const results = drugDataset
      .map((item) => ({
        score: getMedicationScore(item, query),
        name: item.name,
        contains: item.contains,
        therapeuticClass: item.therapeuticClass,
        actionClass: item.actionClass,
        chemicalClass: item.chemicalClass,
        habitForming: item.habitForming,
        riskLabel: item.riskLabel,
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(({ score, ...item }) => item);

    return res.json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Medication search failed",
      error: error.message,
    });
  }
};
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const FOOD_PATH = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "datasets",
  "food_subset.csv"
);

const DRUG_PATH = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "datasets",
  "drug_clean.csv"
);

function streamSearchCsv(filePath, matcher, mapper, maxResults = 10) {
  return new Promise((resolve, reject) => {
    const results = [];
    let finished = false;

    const fileStream = fs.createReadStream(filePath);
    const csvStream = csv();

    const finish = () => {
      if (!finished) {
        finished = true;
        resolve(results);
      }
    };

    fileStream
      .pipe(csvStream)
      .on("data", (row) => {
        if (finished) return;

        try {
          if (matcher(row)) {
            results.push(mapper(row));
          }

          if (results.length >= maxResults) {
            finished = true;
            fileStream.destroy();
            csvStream.destroy();
            resolve(results);
          }
        } catch (error) {
          finished = true;
          fileStream.destroy();
          csvStream.destroy();
          reject(error);
        }
      })
      .on("end", finish)
      .on("close", finish)
      .on("error", (error) => {
        if (!finished) {
          finished = true;
          reject(error);
        }
      });
  });
}

exports.searchFoods = async (req, res) => {
  try {
    const query = String(req.query.q || "").toLowerCase().trim();

    if (query.length < 1) {
      return res.json({ success: true, data: [] });
    }

    const results = await streamSearchCsv(
      FOOD_PATH,
      (item) => String(item.Food || "").toLowerCase().includes(query),
      (item) => ({
        name: item.Food,
        energy: item.energy,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
      }),
      10
    );

    return res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Food search failed",
      error: error.message,
    });
  }
};

exports.searchDrugs = async (req, res) => {
  try {
    const query = String(req.query.q || "").toLowerCase().trim();

    if (query.length < 1) {
      return res.json({ success: true, data: [] });
    }

    const results = await streamSearchCsv(
      DRUG_PATH,
      (item) => {
        const name = String(item.Name || "").toLowerCase();
        const contains = String(item.Contains || "").toLowerCase();

        return name.includes(query) || contains.includes(query);
      },
      (item) => ({
        name: item.Name,
        contains: item.Contains,
      }),
      10
    );

    return res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Drug search failed",
      error: error.message,
    });
  }
};
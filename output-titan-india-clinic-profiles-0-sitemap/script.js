const fs = require("fs");
const xml2js = require("xml2js");

async function processClinicUrlsFromXml(xmlFilePath) {
  // Read XML file
  let xmlData;
  try {
    xmlData = fs.readFileSync(xmlFilePath, "utf8");
  } catch (readError) {
    console.error("Error reading XML file:", readError);
    return;
  }

  // Parse XML to JS object with less strict settings
  let parsedXml;
  try {
    const parser = new xml2js.Parser({ strict: false, normalizeTags: true });
    parsedXml = await parser.parseStringPromise(xmlData);
  } catch (error) {
    console.error("Failed to parse XML:", error);
    return;
  }

  // Extract clinic URLs
  const clinicUrls = new Set();
  const urlEntries = (parsedXml.urlset && parsedXml.urlset.url) || [];
  for (const entry of urlEntries) {
    if (entry.loc && Array.isArray(entry.loc) && entry.loc[0]) {
      const url = entry.loc[0];
      const match = url.match(
        /^https:\/\/www\.practo\.com\/[^\/]+\/clinic\/[^\/]+$/
      );
      if (match) {
        clinicUrls.add(url);
      }
    }
  }

  console.log(`Found ${clinicUrls.size} clinic URLs to process.`);

  // Log each filtered clinic URL
  for (const url of clinicUrls) {
    console.log(`Clinic URL: ${url}`);
  }

  console.log("All clinic URLs have been logged.");
}

/************************************************************
 * Entry point
 ************************************************************/
const xmlFilePath = process.argv[2];
if (!xmlFilePath) {
  console.error("Please provide the XML file path as a command-line argument.");
  process.exit(1);
}

processClinicUrlsFromXml(xmlFilePath)
  .then(() => {
    console.log("Script completed.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Unexpected error:", err);
    process.exit(1);
  });

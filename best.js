const puppeteer = require("puppeteer");

async function scrapeClinicOverview(url) {
  let browser;
  try {
    // 1) Launch Puppeteer WITHOUT a forced 3s timeout
    //    (Removing `timeout: 3000` to avoid "Timed out after 3000 ms" errors)
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox"],
    });

    const page = await browser.newPage();

    // 2) Increase the navigation timeout to e.g. 10 seconds
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 10000 });
    } catch (navError) {
      console.error(`Navigation error for URL: ${url} - ${navError.message}`);
      return null; // Stop if navigation fails
    }

    // 3) Wait for a specific element that indicates the page has loaded
    //    (Adjust selector and timeout as needed)
    await page.waitForSelector('h1[data-qa-id="clinic-name"]', {
      timeout: 8000,
    });

    // 4) Scrape data by evaluating the DOM
    const scrapedData = await page.evaluate(() => {
        const imageElements = document.querySelectorAll('img[data-qa-id="clinic-image"]');
        const logo = Array.from(imageElements).map((img) => ({
          url: img.src.replace("/thumbnail", ""),
          thumbnail: img.src,
          alt: img.alt || "Hospital logo",
        }));
      
        // Extract values from the page
        const name = document.querySelector('h1[data-qa-id="clinic-name"]')?.innerText.trim() || "N/A";
        const rating = parseFloat(document.querySelector('div[data-qa-id="star_rating"] .common__star-rating__value')?.innerText.trim() || "0");
        const feedback = document.querySelector('span[data-qa-id="clinic-votes"]')?.innerText.trim() || "N/A";
        const area = document.querySelector('h2[data-qa-id="clinic-locality"]')?.innerText.trim() || "N/A";
        const address = document.querySelector('p[data-qa-id="clinic-address"]')?.innerText.trim() || "N/A";
      
        // "Get Directions" URL
        const addressUrl = document.querySelector('a[data-qa-id="get_directions"]')?.href.trim() || "N/A";
      
        // Headline
        const headline = document.querySelector('h2[data-qa-id="summary_title"]')?.innerText.trim() || "N/A";
      
        // Timings
        const timings_day = document.querySelector('p[data-qa-id="clinic-timings-day"]')?.innerText.trim() || "N/A";
        
        // Extract multiple session timings and join with newlines
        const timingsSessionElements = document.querySelectorAll('p[data-qa-id="clinic-timings-session"]');
        const timings_session = timingsSessionElements.length 
          ? Array.from(timingsSessionElements).map(el => el.innerText.trim()).join("\n")
          : "N/A";
      
        // About text
        const about = document.querySelector("p.c-profile__description")?.innerText.trim() || "N/A";
      
        // Breadcrumbs and City extraction
        const breadcrumbElements = Array.from(document.querySelectorAll("a.c-breadcrumb__title"))
          .map((el) => el.innerText.trim())
          .filter((text) => text.length > 0);
        const breadcrumbs = breadcrumbElements;
        const city = breadcrumbs.length > 1 ? breadcrumbs[1] : "";
      
        // Return collected data
        return {
          name,
          headline,
          rating,
          feedback,
          area,
          address,
          logo,
          addressUrl,
          about,
          timings_day,
          timings_session,
          breadcrumbs,
          city,
        };
    });

    console.log("Scraped data:", scrapedData);
    return scrapedData;
  } catch (err) {
    console.error("Error in getDataFromUrl:", err);
    return null;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Example usage
(async () => {
  const url = "https://www.practo.com/kolkata/clinic/dental-earth-multispecialty-clinic-and-implant-centre-new-town";
  const result = await getDataFromUrl(url);
  console.log("Final result:", result);
})();

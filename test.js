const puppeteer = require("puppeteer");

async function scrapeClinicOverview(url) {
  let browser;
  try {
    // Launch Puppeteer
    browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox"],
        timeout: 3000,
      });

    const page = await browser.newPage();

    // Attempt to navigate
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 3000 });
    } catch (navError) {
      console.error(`Navigation error for URL: ${url} - ${navError.message}`);
      return; // Stop if navigation fails
    }

    // Check if the Doctors tab exists. If not, skip further scraping.
    const doctorTabExists = await page.$('li[data-qa-id="doctors-tab"] button');
    if (!doctorTabExists) {
      console.log(`Doctors tab not found for URL: ${url}. Skipping scrape.`);
      return;
    }

    // Wait for an element that should be present on the page
    await page.waitForSelector('p[data-qa-id="clinic-timings-day"]', {
      timeout: 8000,
    });

    // Evaluate the page to extract data
    const data = await page.evaluate(() => {
      // Helpers
      const getText = (selector) => {
        const el = document.querySelector(selector);
        return el ? el.innerText.trim() : "N/A";
      };
      const getAllText = (selector) => {
        const els = document.querySelectorAll(selector);
        if (!els || els.length === 0) return "N/A";
        return Array.from(els)
          .map((el) => el.innerText.trim())
          .join("\n");
      };

      // Scrape any clinic images
      const imageElements = document.querySelectorAll('img[data-qa-id="clinic-image"]');
      const logo = Array.from(imageElements).map((img) => ({
        url: img.src.replace("/thumbnail", ""),
        thumbnail: img.src,
        alt: img.alt || "Hospital logo",
      }));

      // "Get Directions" URL
      const directionsAnchor = document.querySelector('a[data-qa-id="get_directions"]');
      const addressUrl = directionsAnchor ? directionsAnchor.href.trim() : "N/A";

      // Headline: <h2 data-qa-id="summary_title">About ...</h2>
      const summaryEl = document.querySelector('h2[data-qa-id="summary_title"]');
      const headline = summaryEl ? summaryEl.innerText.trim() : "N/A";

      // Timings
      const timings_day = getText('p[data-qa-id="clinic-timings-day"]');
      const timings_session = getAllText('p[data-qa-id="clinic-timings-session"]');

      // About
      const about = getText("p.c-profile__description");

      // If breadcrumbs/city exist in your actual page, you can add them here
      const breadcrumbs = []; 
      const city = "";

      return {
        name: getText('h1[data-qa-id="clinic-name"]'),
        headline,
        rating: parseFloat(
          getText('div[data-qa-id="star_rating"] .common__star-rating__value')
        ),
        feedback: getText('span[data-qa-id="clinic-votes"]'),
        area: getText('h2[data-qa-id="clinic-locality"]'),
        address: getText('p[data-qa-id="clinic-address"]'),
        logo,
        addressUrl,
        about,
        timings_day,
        timings_session,
        breadcrumbs,
        city,
      };
    });

    console.log("Scraped data:", data);
    return data;
  } catch (err) {
    console.error(`Error in scrapeClinicOverview: ${err.message}`);
    return {};
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Example runner function
async function runScrape() {
  const url =
    "https://www.practo.com/kolkata/clinic/dental-earth-multispecialty-clinic-and-implant-centre-new-town";
  try {
    const data = await scrapeClinicOverview(url);
    console.log("Final result:", data);
  } catch (error) {
    console.error(`Error processing URL: ${url}`, error);
  }
}

runScrape();

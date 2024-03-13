import axios from "axios";
import cheerio from "cheerio";
import fs from "fs";

interface eventData {
    title: string;
    date: string;
    genre: string;
    location: string;
    time: string;
    price: string;
    image: string;
    excerpt: string;
    isFeatured: boolean;
    rating: number;
    expiresAt: string;
}

const url = "https://www.wonderville.nyc/events";

runProgram();

async function runProgram() {
    console.log(`Scraping data from ${url} ...`);
    const html = await fetchHTML(url);
    if (html) {
        const data = await scrapeData(html);
        await writeToFile(data);
        await closeProgram(data);
    } else {
        console.error("Failed to fetch HTML content.");
    }
}

async function fetchHTML(url: string): Promise<string | null> {
    const AxiosInstance = axios.create();
    try {
        const response = await AxiosInstance.get(url);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch data:', error);
        return null; 
    }
}

async function scrapeData(html: string): Promise<eventData[]> {
    const AxiosInstance = axios.create();
    try {
        const res = await AxiosInstance.get(url);
        html = res.data;
    } catch (error) {
        console.error('Failed to fetch data:', error);
        return []; 
    }
    const $ = cheerio.load(html);

    const articleElements = $(".sqs-events-collection-list > div > article").toArray();
    const events: eventData[] = [];

    for (const elem of articleElements) {
        const title = $(elem).find("div h1").text().trim();
        let dateText = $(elem).find("div ul li.eventlist-meta-item.eventlist-meta-date.event-meta-item > time:nth-child(1)").text();
        const time = $(elem).find("div ul li.eventlist-meta-item.eventlist-meta-date.event-meta-item > span:nth-child(2) > time.event-time-12hr").text();
        const image = $(elem).find("a.eventlist-column-thumbnail img").attr("data-src") || '';
        let excerptHtml = $(elem).find(".eventlist-description .sqs-block-content p").first().html() || '';
        const excerpt = await formatExcerpt(excerptHtml, $);
        const date = await formattedDate(dateText);
        const expiresAt = calculateExpiresAt(date)
        events.push({
            title,
            date,
            genre: "games", 
            location: "wonderville",
            time,
            price: "Free",
            image,
            excerpt,
            isFeatured: false,
            rating: 0,
            expiresAt
        });
    }
    console.log(`Found ${events.length} events`);
    return events;
}

async function formattedDate(dateText: string): Promise<string> {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const [dayOfWeek, month, day, year] = dateText.split(/[\s,]+/);
    const monthIndex = months.indexOf(month);
    const dateObject = new Date(parseInt(year), monthIndex, parseInt(day));
    const formattedDate = dateObject.toISOString().split('T')[0];  
    return formattedDate;
}

async function formatExcerpt(excerptHtml: string, $:any): Promise<string> {
    excerptHtml = excerptHtml.replace(/<br\s*\/?>/gi, "\n").trim();
    let excerpt = $('<div>').html(excerptHtml).text();
    return excerpt;
}
 
async function writeToFile(events: Array<eventData>) {
    if (events.length) {
        console.log(`writing ${events.length} events to file`);
        fs.writeFileSync('events.json', JSON.stringify(events, null, 2), 'utf-8');
        console.log('Data saved to events.json');
      } else {
        console.log('No data to save.');
      }
}

async function closeProgram(events: Array<eventData>) {
    if (events.length) {
        console.log();
        console.log(`Closing program. Have a nice day.`);
        process.exit(0);
    } else {
        console.log('No data to save.');
    }
}

const calculateExpiresAt = (eventDate: any) => {
    const date = new Date(eventDate);
  
    date.setUTCDate(date.getUTCDate() + 1);
    date.setUTCHours(2, 0, 0, 0); 
  
    let isoString = date.toISOString(); 
    return isoString;
  };
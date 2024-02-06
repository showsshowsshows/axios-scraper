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
}

const url = "https://www.wonderville.nyc/events";

runProgram();

async function runProgram() {

    console.log(`Scraping data from ${url} ...`);
    const data = await scrapeData();
    await writeToFile(data);
    await closeProgram(data);

}

async function scrapeData(): Promise<eventData[]> {
    const AxiosInstance = axios.create();
    const res = await AxiosInstance.get(url);
    const html = res.data;
    const $ = cheerio.load(html);

    const articleRows = $(".sqs-events-collection-list > div > article");
    const events: eventData[] = [];
    articleRows.each((i, elem) => {
        const title: string = $(elem).find("div h1").text().trim();
        let dateText: string = $(elem).find("div ul li.eventlist-meta-item.eventlist-meta-date.event-meta-item > time:nth-child(1)").text();
        const time: string = $(elem).find("div ul li.eventlist-meta-item.eventlist-meta-date.event-meta-item > span:nth-child(2) > time.event-time-12hr").text();
        const image: string = $(elem).find("a.eventlist-column-thumbnail img").attr("data-src") || '';
        let excerptHtml: string = $(elem).find(".eventlist-description .sqs-block-content p").first().html() || '';
        excerptHtml = excerptHtml.replace(/<br\s*\/?>/gi, "\n").trim();
        let excerpt: string = $('<div>').html(excerptHtml).text();

        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const [dayOfWeek, month, day, year] = dateText.split(/[\s,]+/);
        const monthIndex = months.indexOf(month);
        const dateObject = new Date(parseInt(year), monthIndex, parseInt(day));
        const formattedDate = dateObject.toISOString().split('T')[0];  // Converts to YYYY-MM-DD format
        
        events.push({
            title,
            date: formattedDate,
            genre: "games", 
            location: "wonderville",
            time,
            price: "Free",
            image,
            excerpt,
            isFeatured: false,
            rating: 0
        });
    });
    console.log(`found ${events.length} events`)
    return events;
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
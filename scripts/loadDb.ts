import { DataAPIClient } from "@datastax/astra-db-ts"
import { PuppeteerWebBaseLoader } from "langchain/document_loaders/web/puppeteer"
import { OpenAI } from "openai"
import {RecursiveCharacterTextSplitter} from "langchain/text_splitter"

import "dotenv/config"

type SimilarityMetric = "dot_product" | "cosine" | "euclidean"

const {
    ASTRA_DB_NAMESPACE,
    ASTRA_DB_COLLECTION,
    ASTRA_DB_API_ENDPOINT,
    ASTRA_DB_APPLICATION_TOKEN,
    OPENAI_API_KEY
} = process.env

const openai = new OpenAI({ apiKey: OPENAI_API_KEY})

const premData = [
    'https://en.wikipedia.org/wiki/Premier_League',
    'https://en.wikipedia.org/wiki/List_of_Premier_League_stadiums',
    'https://en.wikipedia.org/wiki/List_of_Premier_League_managers',
    'https://en.wikipedia.org/wiki/Premier_League_records_and_statistics#Player_records',
    'https://en.wikipedia.org/wiki/List_of_Premier_League_winning_players',
    'https://en.wikipedia.org/wiki/Premier_League_20_Seasons_Awards',
    'https://en.wikipedia.org/wiki/Premier_League_10_Seasons_Awards',
    'https://en.wikipedia.org/wiki/List_of_owners_of_English_football_clubs#Premier_League',
    'https://en.wikipedia.org/wiki/List_of_Premier_League_clubs',
    'https://en.wikipedia.org/wiki/List_of_English_football_champions',
    'https://en.wikipedia.org/wiki/Football_records_and_statistics_in_England#',
    'https://www.footballhistory.org/league/premier-league.html',
    'https://www.britannica.com/topic/Premier-League',
    'https://www.spotrac.com/epl/rankings/player/_/year/2024/sort/cash_total',
    'https://www.spotrac.com/epl/rankings/player/_/year/2024/sort/contract_transfer_fee',
    'https://fbref.com/en/comps/9/stats/Premier-League-Stats'
]

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN)
const db = client.db(ASTRA_DB_API_ENDPOINT, {namespace : ASTRA_DB_NAMESPACE})

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 512,
    chunkOverlap: 100
})

const createCollection = async (similarityMetric: SimilarityMetric = "dot_product") => {
    try {
        const res = await db.createCollection(ASTRA_DB_COLLECTION, {
            vector: {
                dimension: 1536,
                metric: similarityMetric
            }
        })
        console.log("Collection created:", res)
    } catch (err: any) {
        if (err.name === "CollectionAlreadyExistsError") {
            console.log(`Collection '${ASTRA_DB_COLLECTION}' already exists — skipping creation.`)
        } else {
            throw err
        }
    }
}


const loadSampleData = async () => {
    const collection = await db.collection(ASTRA_DB_COLLECTION)
    for await ( const url of premData) {
        const content = await scrapePage(url)
        const chunks = await splitter.splitText(content)
        for await (const chunk of chunks) {
            const embedding = await openai.embeddings.create({
                model: "text-embedding-3-small",
                input: chunk,
                encoding_format:"float"

            })

            const vector = embedding.data[0].embedding

            const res = await collection.insertOne({
                $vector: vector,
                text: chunk
            })

            console.log(res)

        }
    }
}

const scrapePage = async (url: string) => {
    const loader = new PuppeteerWebBaseLoader(url, {
        launchOptions: {
            headless: true
        },
        gotoOptions: {
            waitUntil: "domcontentloaded"
        },
        evaluate: async (page, browser) => {
            const result = await page.evaluate(() => document.body.innerHTML)
            await browser.close()
            return result
        }
    })
    return (await loader.scrape())?.replace(/<[^>]*>?/gm, '')
}

createCollection().then(() => loadSampleData())







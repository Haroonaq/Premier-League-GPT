import OpenAI from 'openai';
import { DataAPIClient } from '@datastax/astra-db-ts';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

const {
    ASTRA_DB_NAMESPACE,
    ASTRA_DB_COLLECTION,
    ASTRA_DB_API_ENDPOINT,
    ASTRA_DB_APPLICATION_TOKEN,
    OPENAI_API_KEY,
} = process.env;

const openAi = new OpenAI({ apiKey: OPENAI_API_KEY });
const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT, { namespace: ASTRA_DB_NAMESPACE });

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();
        const latestMessage = messages[messages.length - 1]?.content;

        let docContext = '';

        const embedding = await openAi.embeddings.create({
            model: 'text-embedding-3-small',
            input: latestMessage,
            encoding_format: 'float',
        });

        try {
            const collection = await db.collection(ASTRA_DB_COLLECTION);
            const cursor = collection.find(null, {
                sort: {
                    $vector: embedding.data[0].embedding,
                },
                limit: 10,
            });
            const documents = await cursor.toArray();

            const docsMap = documents.map((doc) => doc.text);

            docContext = JSON.stringify(docsMap);
        } catch (error) {
            console.log('Error querying db...', error);
            docContext = '';
        }

        const template = {
            role: 'system',
            content: `You are an AI assistant who knows everything about the Premier League.
            Use the below context to augment what you know about the Premier League.
            The context will provide you with the most recent page of data from wikipedia,
            spotrac and others.
            If the context doesn't include the information you need answer based on your
            existing knowledge and don't mention the source of your information or 
            what the context does or doesn't include.
            Format responses using markdown where applicable and don't return
            images. 
        ----------------
        START CONTEXT
        ${docContext}
        END CONTEXT
        ----------------
        QUESTION: ${latestMessage}
        ----------------

        `,
        };

        const result = streamText({
            model: openai('gpt-4'),
            messages: [template, ...messages],
            system:
                'You are an AI assistant who knows everything about the Premier League. ' +
                'Use the below context to augment what you know about the Premier League. ' +
                'The context will provide you with the most recent page of data from wikipedia,spotrac and others.' +
                ' If the context does not include the information you need answer based on your EXISTING KNOWLEDGE ' +
                'and do not mention the source of your information or what the context does or does not include. ' +
                'Format responses using markdown where applicable and do not return images.',
        });

        return result.toDataStreamResponse();
    } catch (error) {
        throw new Error(error);
    }
}


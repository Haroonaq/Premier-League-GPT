"use client"

import Image from "next/image"
import { useChat } from "ai/react"
import { Message } from "ai"
import Bubble from "./componets/Bubble"
import LoadingBubble from "./componets/LoadingBubble"
import PromptSuggestionsRow from "./componets/PromptSuggestionsRow"

declare global {
    interface Window {
        debugStream: () => Promise<void>;
    }
}


export default function Home() {


    const { append, isLoading, messages, input, handleInputChange, handleSubmit} = useChat();


    const noMessages = !messages || messages.length === 0


    const handlePrompt = ( promptText) => {
        const msg: Message = {
            id: crypto.randomUUID(),
            content: promptText,
            role: "user"

        }

        append(msg)

    }

    return (
        <main style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "2rem" }}>
            <Image
                src="/PremierLeagueGpt.jpg"
                width={250}
                height={250}
                alt="Premier League Logo"
            />
            <h1 style={{ marginTop: "1rem" }}>Premier League GPT</h1>
            <section className={noMessages ? "" : "populated"}>
                {noMessages ? (
                    <>
                        <p className="starter-text">
                            For the fans of the best Football league in the world,
                            Ask Premier League GPT anything about the Premier League
                            and it will come back with the most up-to-date answer.
                            We hope you enjoy!
                        </p>
                        <br/>
                        <PromptSuggestionsRow onPromptClick={handlePrompt}/>

                    </>
                ) : (
                    <>
                        {messages.map((message, index) => <Bubble key={`message-${index}`} message={message} />)}
                    {isLoading && <LoadingBubble/>}

                    </>
                )}

            </section>

            <form onSubmit={handleSubmit} >
                <input className="question-box" onChange={handleInputChange} value={input} placeholder={"Ask me something..."}/>
                <input type="submit"/>
            </form>

        </main>
    )
}

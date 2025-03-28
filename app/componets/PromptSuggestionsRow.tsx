import PromptSuggestionButton from "./PromptSuggestionButton";

const PromptSuggestionsRow = ({onPromptClick}) => {
    const prompts = [
        "What team most recently won the Premier League?",
        "Who are some of the best players that played in the Premier League?",
        "How many teams get relegated and how?",
        "Name some of the most successful teams in the Premier League?",

    ]
    return (
        <div className="prompt-suggestions-row">
            {prompts.map((prompt, index) =>
                <PromptSuggestionButton
                    key={`suggestion-${index}`}
                    text={prompt}
                    onClick={() => onPromptClick(prompt)}

                />)}

        </div>

    )
}

export default PromptSuggestionsRow
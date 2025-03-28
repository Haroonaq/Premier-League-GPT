type BubbleProps = {
    message: {
        content: string
        role: string
    }
}

const Bubble = ({ message }: BubbleProps) => {
    const { content, role } = message

    if (!content) return null;

    return (
        <div className={`bubble ${role}`}>
            {content}
        </div>
    )
}

export default Bubble


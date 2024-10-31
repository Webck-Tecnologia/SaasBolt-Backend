export const getRandomMessage = (messageObj) => {
    try {
        if (!messageObj.variations || messageObj.variations.length === 0) {
            return messageObj.content;
        }

        const allMessages = [messageObj.content, ...messageObj.variations];
        const randomIndex = Math.floor(Math.random() * allMessages.length);

        return allMessages[randomIndex];
    } catch (error) {
        console.error('Erro ao selecionar mensagem aleatória:', error);
        return messageObj.content;
    }
};
class MessageQueue {
    constructor() {
        this.queue = [];
        this.processing = false;
        this.minDelay = 3000; // 3 segundos entre mensagens
    }

    async add(message, sendFunction) {
        this.queue.push({ message, sendFunction });
        if (!this.processing) {
            this.processQueue();
        }
    }

    async processQueue() {
        if (this.queue.length === 0) {
            this.processing = false;
            return;
        }

        this.processing = true;
        const { message, sendFunction } = this.queue.shift();

        try {
            await sendFunction(message);
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
        }

        // Aguarda o delay mínimo antes de processar a próxima mensagem
        await new Promise(resolve => setTimeout(resolve, this.minDelay));
        this.processQueue();
    }
}

export const messageQueue = new MessageQueue(); 
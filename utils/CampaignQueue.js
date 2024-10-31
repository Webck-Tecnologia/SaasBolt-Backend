class CampaignQueue {
    constructor() {
        this.queues = new Map();
    }

    async addToCampaign(instanceId, messages, sendFunction, messageInterval) {
        const delayMs = messageInterval * 1000;
        console.log(`\x1b[34m[Campaign Queue]\x1b[0m Configurando fila para instância ${instanceId} com intervalo de ${messageInterval} segundos`);

        if (!this.queues.has(instanceId)) {
            this.queues.set(instanceId, {
                messages: [],
                processing: false,
                messageInterval: delayMs
            });
        }

        const queue = this.queues.get(instanceId);
        queue.messages.push(...messages.map(msg => ({
            message: msg,
            sendFunction
        })));

        console.log(`\x1b[34m[Campaign Queue]\x1b[0m Adicionadas ${messages.length} mensagens à fila da instância ${instanceId}`);

        if (!queue.processing) {
            this.processCampaignQueue(instanceId);
        }
    }

    async processCampaignQueue(instanceId) {
        const queue = this.queues.get(instanceId);
        if (!queue || queue.messages.length === 0) {
            if (queue) {
                queue.processing = false;
                console.log(`\x1b[32m[Campaign Queue]\x1b[0m Processamento finalizado para instância ${instanceId}`);
                this.queues.delete(instanceId);
            }
            return;
        }

        queue.processing = true;
        const { message, sendFunction } = queue.messages.shift();
        const remainingMessages = queue.messages.length;

        try {
            console.log(`\x1b[33m[Campaign Queue]\x1b[0m Enviando mensagem para instância ${instanceId}`);
            const startTime = new Date();
            
            await sendFunction(message);
            
            const endTime = new Date();
            const processingTime = (endTime - startTime) / 1000;
            
            console.log(`\x1b[32m[Campaign Queue]\x1b[0m Mensagem enviada com sucesso em ${processingTime.toFixed(2)}s`);
            console.log(`\x1b[36m[Campaign Queue]\x1b[0m Aguardando ${queue.messageInterval/1000}s antes da próxima mensagem...`);
            console.log(`\x1b[35m[Campaign Queue]\x1b[0m Mensagens restantes: ${remainingMessages}`);

            // Criar uma barra de progresso para o tempo de espera
            const waitStart = Date.now();
            const interval = setInterval(() => {
                const elapsed = (Date.now() - waitStart) / 1000;
                const remaining = (queue.messageInterval / 1000) - elapsed;
                if (remaining > 0) {
                    process.stdout.write(`\r\x1b[33m[Campaign Queue]\x1b[0m Tempo restante: ${remaining.toFixed(1)}s `);
                }
            }, 1000);

            await new Promise(resolve => setTimeout(() => {
                clearInterval(interval);
                process.stdout.write('\n'); // Nova linha após a contagem
                resolve();
            }, queue.messageInterval));

        } catch (error) {
            console.error(`\x1b[31m[Campaign Queue]\x1b[0m Erro ao enviar mensagem (Instance ${instanceId}):`, error);
        }

        this.processCampaignQueue(instanceId);
    }
}

export const campaignQueue = new CampaignQueue();
import { htmlToWhatsAppFormat } from './htmlToWhatsAppFormat.js';

export const processMessageVariables = (message, contact) => {
    try {
        let processedMessage = message;

        if (contact.nome) {
            processedMessage = processedMessage.replace(/{{nome}}/g, contact.nome);
        }

        return htmlToWhatsAppFormat(processedMessage);
    } catch (error) {
        console.error('Erro ao processar variáveis da mensagem:', error);
        return message;
    }
};
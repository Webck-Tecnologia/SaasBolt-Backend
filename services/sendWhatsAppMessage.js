import axios from 'axios';
import { getRandomMessage } from '../utils/getRandomMessage.js';
import { processMessageVariables } from '../utils/processMessageVariables.js';
import pkg from '../config/evolutionapi.cjs';
const { EVOLUTION_API_URL, EVOLUTION_API_KEY } = pkg;

// Função auxiliar para determinar o tipo de mídia
const getMediaType = (fileName) => {
    if (!fileName) return { mediatype: "image", mimetype: "image/jpeg" };
    
    const extension = fileName.toLowerCase().split('.').pop();
    
    const mediaTypes = {
        'pdf': { mediatype: "document", mimetype: "application/pdf" },
        'doc': { mediatype: "document", mimetype: "application/msword" },
        'docx': { mediatype: "document", mimetype: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
        'jpg': { mediatype: "image", mimetype: "image/jpeg" },
        'jpeg': { mediatype: "image", mimetype: "image/jpeg" },
        'png': { mediatype: "image", mimetype: "image/png" }
        // Adicione mais tipos conforme necessário
    };

    return mediaTypes[extension] || { mediatype: "image", mimetype: "image/jpeg" };
};

export const sendWhatsAppMessage = async (workspaceId, instanceId, contact, messages) => {
    try {
        const messageArray = Array.isArray(messages) ? messages : JSON.parse(messages);

        for (const messageObj of messageArray) {
            const selectedContent = getRandomMessage(messageObj);
            const processedContent = processMessageVariables(selectedContent, contact);
            const instancePath = `${workspaceId}-${instanceId}`;
            
            let formattedPhone = contact.phone || '';
            formattedPhone = formattedPhone.replace(/\D/g, '');
            if (!formattedPhone.startsWith('55')) {
                formattedPhone = '55' + formattedPhone;
            }

            let url;
            let payload;

            switch (messageObj.type) {
                case 'TEXT':
                    url = `${EVOLUTION_API_URL}/message/sendText/${instancePath}`;
                    payload = {
                        number: formattedPhone,
                        text: processedContent,
                        delay: 1000
                    };
                    break;

                case 'MEDIA':
                    url = `${EVOLUTION_API_URL}/message/sendMedia/${instancePath}`;
                    
                    if (!messageObj.mediaUrl) {
                        throw new Error('URL da mídia não fornecida');
                    }

                    // Extrair apenas a parte base64 da string
                    const base64Data = messageObj.mediaUrl.includes('base64,') 
                        ? messageObj.mediaUrl.split('base64,')[1] 
                        : messageObj.mediaUrl;

                    // Determinar o tipo de mídia e mimetype baseado no arquivo
                    const { mediatype, mimetype } = getMediaType(messageObj.fileName);

                    payload = {
                        number: formattedPhone,
                        mediatype,
                        mimetype,
                        caption: processedContent,
                        media: base64Data,
                        ...(mediatype === "document" && { fileName: messageObj.fileName })
                    };

                    console.log(`\x1b[34m[WhatsApp API]\x1b[0m Enviando ${mediatype === "document" ? 'documento' : 'imagem'}`);
                    break;

                case 'AUDIO':
                    url = `${EVOLUTION_API_URL}/message/sendWhatsAppAudio/${instancePath}`;
                    payload = {
                        number: formattedPhone,
                        audio: messageObj.mediaUrl,
                        delay: 1000,
                        encoding: true,
                        quoted: {
                            key: {
                                remoteJid: formattedPhone + "@s.whatsapp.net",
                                fromMe: true,
                                id: Date.now().toString(),
                                participant: formattedPhone + "@s.whatsapp.net"
                            },
                            message: {
                                conversation: ""
                            }
                        },
                        mentionsEveryOne: false,
                        mentioned: []
                    };
                    break;

                default:
                    throw new Error(`Tipo de mensagem não suportado: ${messageObj.type}`);
            }

            console.log(`\x1b[34m[WhatsApp API]\x1b[0m Enviando mensagem tipo ${messageObj.type} para ${formattedPhone}`);
            console.log('\x1b[34m[Debug]\x1b[0m Payload completo:', JSON.stringify(payload, null, 2));

            try {
                const response = await axios.post(
                    url,
                    payload,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'apikey': EVOLUTION_API_KEY
                        }
                    }
                );

                console.log('\x1b[34m[Debug]\x1b[0m Resposta da API:', response.data);

                if (response.status >= 400) {
                    throw new Error(`Erro na resposta da API: ${JSON.stringify(response.data)}`);
                }

                console.log(`\x1b[32m[WhatsApp API]\x1b[0m Mensagem enviada com sucesso para ${formattedPhone}`);
            } catch (error) {
                console.error('\x1b[31m[WhatsApp API Error]\x1b[0m', {
                    status: error.response?.status,
                    data: error.response?.data,
                    message: error.message,
                    url: url,
                    payload: payload
                });
                throw error;
            }
        }

        return true;
    } catch (error) {
        console.error('Erro detalhado ao enviar mensagem:', {
            error: error.message,
            contact: contact,
            response: error.response?.data
        });
        throw error;
    }
};
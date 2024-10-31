import axios from 'axios';
import pkg from '../config/evolutionapi.cjs';
const { EVOLUTION_API_URL, EVOLUTION_API_KEY } = pkg;

export const sendMessage = async (message) => {
  const { type, content, recipientPhone, instanceName } = message;

  let endpoint;
  let data;

  switch (type) {
    case 'TEXT':
      endpoint = '/message/sendText';
      data = {
        number: recipientPhone,
        text: content.text,
        delay: content.delay || 0,
        linkPreview: content.linkPreview || false
      };
      break;
    case 'AUDIO':
      endpoint = '/message/sendWhatsAppAudio';
      data = {
        number: recipientPhone,
        audio: content.audioUrl,
        delay: content.delay || 0,
        encoding: true
      };
      break;
    case 'IMAGE':
    case 'DOCUMENT':
      endpoint = '/message/sendMedia';
      data = {
        number: recipientPhone,
        mediatype: type.toLowerCase(),
        mimetype: content.mimetype,
        caption: content.caption || '',
        media: content.mediaUrl,
        fileName: content.fileName,
        delay: content.delay || 0
      };
      break;
    default:
      throw new Error('Tipo de mensagem não suportado');
  }

  try {
    const response = await axios.post(`${EVOLUTION_API_URL}${endpoint}/${instanceName}`, data, {
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      }
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error.response?.data || error.message);
    throw error;
  }
};

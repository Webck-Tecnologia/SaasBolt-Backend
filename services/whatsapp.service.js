import pkg from '../config/evolutionapi.cjs';
const { EVOLUTION_API_URL, EVOLUTION_API_KEY } = pkg;

export class WhatsAppService {
  async verifyNumbers(numbers, instanceName) {
    try {
      console.log('Configurações da API:', {
        url: EVOLUTION_API_URL,
        hasApiKey: !!EVOLUTION_API_KEY,
        instanceName
      });

      if (!EVOLUTION_API_URL) {
        throw new Error('EVOLUTION_API_URL não configurado');
      }

      if (!EVOLUTION_API_KEY) {
        throw new Error('EVOLUTION_API_KEY não configurado');
      }

      const response = await fetch(
        `${EVOLUTION_API_URL}/chat/whatsappNumbers/${instanceName}`, 
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': EVOLUTION_API_KEY
          },
          body: JSON.stringify({ numbers })
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Erro na API do WhatsApp: ${response.status} - ${errorData}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro no serviço de WhatsApp:', error);
      throw error;
    }
  }
}

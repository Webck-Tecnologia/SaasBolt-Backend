import { WhatsAppService } from '../services/whatsapp.service.js';

export class WhatsAppController {
  constructor() {
    this.whatsappService = new WhatsAppService();
  }

  async verifyNumbers(req, res) {
    try {
      const { numbers, instanceName } = req.body;

      if (!numbers || !Array.isArray(numbers)) {
        return res.status(400).json({ 
          error: 'O campo numbers deve ser um array de números' 
        });
      }

      if (!instanceName) {
        return res.status(400).json({ 
          error: 'O campo instanceName é obrigatório' 
        });
      }

      const result = await this.whatsappService.verifyNumbers(numbers, instanceName);
      return res.json(result);
    } catch (error) {
      console.error('Erro ao verificar números:', error);
      return res.status(500).json({ 
        error: 'Erro ao verificar números do WhatsApp' 
      });
    }
  }
}

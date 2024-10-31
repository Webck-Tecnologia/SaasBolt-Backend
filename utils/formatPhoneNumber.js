export const formatPhoneNumber = (phone) => {
    try {
        let cleaned = phone.replace(/\D/g, '');
        
        if (cleaned.startsWith('0')) {
            cleaned = cleaned.substring(1);
        }
        
        if (!cleaned.startsWith('55')) {
            cleaned = '55' + cleaned;
        }
        
        if (cleaned.length === 12 && !cleaned.substring(2, 4).startsWith('0')) {
            return cleaned;
        }
        
        if (cleaned.length === 13) {
            return cleaned;
        }
        
        if (cleaned.length === 8) {
            cleaned = cleaned.substring(0, 0) + '9' + cleaned;
        }
        
        return cleaned;
    } catch (error) {
        console.error('Erro ao formatar número:', error);
        return phone;
    }
};

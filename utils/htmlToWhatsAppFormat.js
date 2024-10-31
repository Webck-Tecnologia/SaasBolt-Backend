export const htmlToWhatsAppFormat = (html) => {
    try {
        let text = html;
        console.log('HTML original:', text);

        // Converte tags de formatação para o padrão WhatsApp antes de remover as tags
        text = text
            // Bold - WhatsApp usa *texto*
            .replace(/<strong>(.*?)<\/strong>/g, '*$1*')
            .replace(/<b>(.*?)<\/b>/g, '*$1*')
            // Italic - WhatsApp usa _texto_
            .replace(/<em>(.*?)<\/em>/g, '_$1_')
            .replace(/<i>(.*?)<\/i>/g, '_$1_')
            // Strikethrough - WhatsApp usa ~texto~
            .replace(/<strike>(.*?)<\/strike>/g, '~$1~')
            .replace(/<s>(.*?)<\/s>/g, '~$1~')
            // Monospace - WhatsApp usa ```texto```
            .replace(/<code>(.*?)<\/code>/g, '```$1```')
            .replace(/<pre>(.*?)<\/pre>/g, '```$1```');

        // Preserva as tags p vazias convertendo-as em marcadores especiais
        text = text.replace(/<p>\s*<\/p>/g, '{{EMPTY_P}}');

        // Remove outras tags HTML mantendo o conteúdo
        text = text
            .replace(/>\s+</g, '><')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<p>(.*?)<\/p>/g, '$1\n')
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");

        // Restaura as tags p vazias como quebras de linha
        text = text.replace(/{{EMPTY_P}}/g, '\n');

        // Normaliza quebras de linha preservando a quantidade
        text = text
            .split(/\r\n|\r|\n/)
            .map(line => line.trim())
            .join('\n');

        // Remove espaços em branco no início e fim
        text = text.trim();
        return text;
    } catch (error) {
        return html;
    }
};
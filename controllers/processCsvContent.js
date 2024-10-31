export const processCsvContent = async (csvContent) => {
    try {
        // Divide o conteúdo em linhas e remove linhas vazias
        const rows = csvContent
            .split('\n')
            .filter(row => row.trim());

        // Pega os headers das outras colunas (ignora o primeiro completamente)
        const headers = rows[0]
            .split(',')
            .slice(1) // Ignora primeira coluna independente do nome
            .map(h => h.trim().toLowerCase());

        // Processa as linhas de dados
        const contacts = rows
            .slice(1) // Pula o cabeçalho
            .map(row => {
                const values = row.split(',').map(v => v.trim());
                const contact = {
                    phone: values[0] // Primeira coluna sempre contém o telefone
                };

                // Mapeia as demais colunas
                headers.forEach((header, index) => {
                    contact[header] = values[index + 1] || '';
                });

                return contact;
            })
            .filter(contact => contact.phone); // Mantém apenas registros com telefone

        return contacts;

    } catch (error) {
        console.error('Erro ao processar conteúdo do CSV:', error);
        throw new Error('Erro ao processar arquivo CSV');
    }
};
import minioClient from '../config/minio.js';

export const getMediaBase64 = async (bucketName, objectName) => {
    try {
        const dataStream = await minioClient.getObject(bucketName, objectName);
        const chunks = [];
        
        return new Promise((resolve, reject) => {
            dataStream.on('data', (chunk) => chunks.push(chunk));
            dataStream.on('end', () => {
                const buffer = Buffer.concat(chunks);
                const base64String = buffer.toString('base64');
                
                // Se por algum motivo ainda vier com o prefixo, vamos removê-lo
                if (base64String.includes('base64,')) {
                    resolve(base64String.split('base64,')[1]);
                } else {
                    resolve(base64String);
                }
            });
            dataStream.on('error', reject);
        });
    } catch (error) {
        console.error('Erro ao converter mídia para base64:', error);
        throw new Error('Erro ao converter mídia para base64');
    }
}; 
import minioClient from '../config/minio.js';

export const getCsvContent = async (csvFileUrl) => {
    try {
        if (!csvFileUrl) throw new Error('URL do arquivo CSV não fornecida');

        console.log('\x1b[34m[Debug]\x1b[0m Buscando CSV:', csvFileUrl);

        const [bucketName, ...objectParts] = csvFileUrl.split('/');
        const objectName = objectParts.join('/');

        if (!bucketName || !objectName) {
            throw new Error('URL do CSV mal formatada');
        }

        console.log('\x1b[34m[Debug]\x1b[0m Bucket:', bucketName, 'Object:', objectName);

        const stream = await minioClient.getObject(bucketName, objectName);
        const chunks = [];

        return new Promise((resolve, reject) => {
            stream.on('data', chunk => chunks.push(chunk));
            stream.on('error', error => {
                console.error('\x1b[31m[Error]\x1b[0m Erro ao ler stream:', error);
                reject(error);
            });
            stream.on('end', () => {
                const content = Buffer.concat(chunks).toString('utf-8');
                resolve(content);
            });
        });
    } catch (error) {
        console.error('\x1b[31m[Error]\x1b[0m Erro ao buscar arquivo CSV:', error);
        throw new Error('Erro ao buscar arquivo CSV');
    }
};
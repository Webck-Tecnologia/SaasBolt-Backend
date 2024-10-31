import { Client } from 'minio';
import dotenv from 'dotenv';
import path from 'path';

// Carrega o arquivo .env apropriado
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

const minioConfig = {
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000'),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ROOT_USER || 'minioadmin',
    secretKey: process.env.MINIO_ROOT_PASSWORD || 'minioadmin',
    insecure: true
};

console.log('Configuração MinIO:', {
    endPoint: minioConfig.endPoint,
    port: minioConfig.port,
    accessKey: minioConfig.accessKey,
    bucketName: process.env.MINIO_BUCKET
});

const minioClient = new Client(minioConfig);

const initializeMinio = async () => {
    const maxRetries = 5;
    const retryDelay = 3000;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const bucketName = process.env.MINIO_BUCKET || 'campaigns';
            console.log(`Tentativa ${attempt} de conectar ao MinIO...`);
            
            const bucketExists = await minioClient.bucketExists(bucketName);
            
            if (!bucketExists) {
                await minioClient.makeBucket(bucketName);
                console.log(`✅ Bucket '${bucketName}' criado com sucesso`);
            } else {
                console.log(`✅ Bucket '${bucketName}' já existe`);
            }
            
            console.log('✅ Conexão com MinIO estabelecida com sucesso');
            return true;
        } catch (error) {
            console.error(`❌ Tentativa ${attempt}/${maxRetries} falhou:`, error.message);
            if (attempt === maxRetries) {
                throw new Error(`Falha ao conectar ao MinIO após ${maxRetries} tentativas: ${error.message}`);
            }
            await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
    }
};

// Função para testar a conexão
const testConnection = async () => {
    try {
        const buckets = await minioClient.listBuckets();
        console.log('Buckets disponíveis:', buckets.map(b => b.name));
        return true;
    } catch (error) {
        console.error('Erro ao listar buckets:', error.message);
        return false;
    }
};

export { initializeMinio, testConnection };
export default minioClient;

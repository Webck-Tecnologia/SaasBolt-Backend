import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
    process.env.POSTGRES_DB,
    process.env.POSTGRES_USER,
    process.env.POSTGRES_PASSWORD,
    {
        host: process.env.POSTGRES_HOST,
        dialect: 'postgres',
        logging: false
    }
);

const initDB = async () => {
    try {
        // ... outras tabelas ...

        // Tabela Campaigns
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS "Campaigns" (
                id SERIAL PRIMARY KEY,
                "workspaceId" INTEGER NOT NULL,
                name VARCHAR(255) NOT NULL,
                type VARCHAR(255),
                "startImmediately" BOOLEAN,
                "startDate" TIMESTAMP,
                "messageInterval" INTEGER,
                messages JSONB,
                "instanceIds" TEXT[],
                "csvFileUrl" VARCHAR(255),
                "imageUrl" VARCHAR(255),
                status VARCHAR(255) DEFAULT 'PENDING',
                "successCount" INTEGER DEFAULT 0,
                "failureCount" INTEGER DEFAULT 0,
                error TEXT,
                "lastProcessedAt" TIMESTAMP,
                "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "instanceId" VARCHAR(255),
                FOREIGN KEY ("workspaceId") REFERENCES "Workspaces"(id) ON DELETE CASCADE
            );
        `);

        // ... outras tabelas ...

        console.log('Banco de dados inicializado com sucesso!');
    } catch (error) {
        console.error('Erro ao inicializar banco de dados:', error);
    }
};

export { sequelize, initDB }; 
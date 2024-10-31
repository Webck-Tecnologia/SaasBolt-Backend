import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  dialect: 'postgres',
  host: process.env.POSTGRES_HOST || 'postgres',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB,
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  dialectOptions: {
    host: process.env.POSTGRES_HOST || 'postgres'
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  logging: false
};

const sequelize = new Sequelize(config);

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexão com PostgreSQL estabelecida com sucesso.');
    console.log('Configuração atual:', {
      host: config.host,
      port: config.port,
      database: config.database,
      username: config.username
    });
  } catch (error) {
    console.error('❌ Erro ao conectar ao PostgreSQL:', error);
  }
};

testConnection();

export default sequelize; 
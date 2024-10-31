import 'dotenv/config'; // Carregar variáveis de ambiente do arquivo .env
import pkg from 'pg'; // Importando o pacote 'pg'
const { Client } = pkg;

// Configurações do banco de dados usando as variáveis do .env
const client = new Client({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT || 5432,  // Porta padrão do PostgreSQL
});

// Função para excluir todas as tabelas
const dropAllTables = async () => {
  try {
    // Conectando ao banco de dados
    await client.connect();
    console.log('Conectado ao banco de dados!');

    // Desabilitar temporariamente as restrições de chave estrangeira
    await client.query('SET session_replication_role = replica;');

    // Excluir todas as tabelas no esquema 'public'
    await client.query('DROP SCHEMA public CASCADE;');

    // Recriar o esquema 'public'
    await client.query('CREATE SCHEMA public;');

    // Habilitar novamente as restrições de chave estrangeira
    await client.query('SET session_replication_role = DEFAULT;');

    console.log('Todas as tabelas foram excluídas com sucesso!');
  } catch (error) {
    console.error('Erro ao excluir as tabelas:', error);
  } finally {
    // Fechar a conexão com o banco de dados
    await client.end();
  }
};

// Executar a função
dropAllTables();

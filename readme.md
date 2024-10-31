### Para rodar o projeto

1- Criar o banco de dados com Docker ( docker compose up -d )
2- alterar o .env.example para .env
3- Executar o comando para criar as tabelas: npx sequelize-cli db:migrate --config config/config.cjs
4- Rodar o comando npx sequelize-cli db:seed:all --config config/config.cjs
5- Rodar o comando npm run dev


### Para Limpar o banco de dados

1- Rodar o comando npx sequelize-cli db:seed:undo:all --config config/config.cjs

## Forçar reversão de migrations

1- Rodar o comando npx sequelize-cli db:migrate:undo:all --config config/config.cjs

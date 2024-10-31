#!/bin/sh

echo "Aguardando PostgreSQL..."
until pg_isready -h postgres -p 5432 -U ${POSTGRES_USER}; do
    echo "PostgreSQL não está pronto - aguardando..."
    sleep 2
done
echo "PostgreSQL está pronto!"

echo "Inicializando banco de dados..."
npm run db-init

echo "Iniciando o servidor..."
npm start

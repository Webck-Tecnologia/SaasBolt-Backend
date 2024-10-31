FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Instala o cliente PostgreSQL e outras ferramentas necessárias
RUN apk add --no-cache postgresql-client

# Torna o script executável
RUN chmod +x wait-and-start.sh

EXPOSE 2345

CMD ["./wait-and-start.sh"]

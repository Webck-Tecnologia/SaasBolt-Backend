require('dotenv').config();

const EVOLUTION_API_URL = process.env.URL_EVOLUTION_API || 'http://localhost:8080';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'sua-chave-api';


module.exports = {
  EVOLUTION_API_URL,
  EVOLUTION_API_KEY
};

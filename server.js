import express from 'express'
import dotenv from 'dotenv'
import pkg from 'pg'
import cookieParse from 'cookie-parser'
import { server, app, io } from './socket/socket.js';
import instanceRoutes from './routes/instance.routes.js';
import campaignRoutes from './routes/campaign.routes.js';
import messageCampaignRoutes from './routes/messageCampaign.js';
import recipientRoutes from './routes/recipient.js';
import webhookRoutes from './routes/webhook.routes.js';
import messageHistoryRoutes from './routes/messageHistory.routes.js';
import cors from 'cors';

app.set('io', io);

dotenv.config()

const { Pool } = pkg

const PORT = process.env.PORT || 3000
// Conexão do Postgres
const pool = new Pool({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: process.env.POSTGRES_PORT || 5432,
})

// Teste de conexão ao PostgreSQL
pool.connect()
    .then(client => {
        console.log('Conectado ao PostgreSQL com sucesso!')
        client.release()
    })
    .catch(err => {
        console.error('Erro ao conectar ao PostgreSQL:', err)
    })

 //const app = express()
app.get("/", async (req, res) => {
    let client;

    try {
        client = await pool.connect()
        const result = await client.query("SELECT NOW()")
        res.status(200).send('Servidor está rodando e o PostgreSQL retornou: ' + result.rows[0].now)
    } catch (err) {
        console.error(err)
        res.status(500).send('Erro ao conectar ao PostgreSQL: ' + err)
    } finally {
        if (client) {
            client.release()
        }
    }
})

//importação de rotas
import authRouters from "./routes/auth.routes.js"
import messageRouters from "./routes/message.routes.js"
import userRouters from "./routes/user.routes.js"
import workspacesRouters from "./routes/workspaces.routes.js"
import conversationsRouters from "./routes/conversations.routes.js"
import contactRoutes from './routes/contact.routes.js'
import whatsappRoutes from './routes/whatsapp.routes.js';

//JSON para enviar os dados para o frontend
app.use(express.json())

//cookie para autenticar o usuario
app.use(cookieParse())
app.use("/api/auth", authRouters)
app.use("/api/messages", messageRouters)
app.use("/api/users", userRouters)
app.use("/api/workspaces", workspacesRouters)
app.use("/api/conversations", conversationsRouters)
app.use('/api/contacts', contactRoutes)
app.use('/api/instances', instanceRoutes)
app.use('/api/campaigns', campaignRoutes);
app.use('/api/message-campaigns', messageCampaignRoutes);
app.use('/api/recipients', recipientRoutes);
app.use('/webhook', webhookRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/message-history', messageHistoryRoutes);

app.use(cors({
  origin: ['http://localhost:4173', 'http://localhost:5173', 'http://frontend:4173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Inicia o serviço de campanhas após iniciar o servidor
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

//Error Handler
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500
    const message = err.message || "Internal Server Error"
    return res.status(statusCode).json({
        success: false,
        message,
    })
})

io.on('connection', (socket) => {
    console.log('Novo cliente conectado');

    socket.on('joinWorkspace', (workspace) => {
        socket.join(workspace);
        console.log(`Cliente ${socket.id} entrou na sala: ${workspace}`);
    });

    socket.on('leaveWorkspace', (workspace) => {
        socket.leave(workspace);
        console.log(`Cliente ${socket.id} saiu da sala: ${workspace}`);
    });

    socket.on('disconnect', () => {
        console.log(`Cliente ${socket.id} desconectado`);
    });

    // ... outros handlers de socket
});

export default server;

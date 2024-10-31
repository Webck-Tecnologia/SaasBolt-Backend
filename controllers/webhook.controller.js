import models from '../models/index.js';
import { getReceiverSocketId, io } from "../socket/socket.js";
import { getInstanceById } from './instance.controller.js';

const { Instance } = models;

export const handleWebhook = async (req, res) => {
    try {
        const { event, instance, data } = req.body;

        if (event === "qrcode.updated") {
            if (data && data.qrcode && data.qrcode.base64) {
                io.to(`qrcode-${instance}`).emit('qrcodeUpdated', { 
                    instance: instance, 
                    qrcode: data.qrcode.base64 
                });
            }
        } else if (event === "connection.update") {
            const room = `instance-${instance}`;
            
            io.to(room).emit('connectionUpdate', { 
                instance: instance,
                state: data.state,
                statusReason: data.statusReason
            });

            // Lógica adicional baseada no estado da conexão
            switch(data.state) {
                case 'open':
                    // Você pode atualizar o status da instância no banco de dados aqui
                    break;
                case 'close':
                    // Você pode lidar com a desconexão aqui
                    break;
            }

            io.emit('connectionUpdate', { 
                instance: instance,
                state: data.state,
                statusReason: data.statusReason
            });
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Erro ao processar webhook:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

import models from '../models/index.js';

const { Recipient, Campaign } = models;

export const createRecipient = async (req, res) => {
    try {
        const { phoneNumber, variables, campaignId } = req.body;
        const recipient = await Recipient.create({
            phoneNumber,
            variables,
            campaignId
        });
        res.status(201).json(recipient);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const getAllRecipients = async (req, res) => {
    try {
        const recipients = await Recipient.findAll({
            include: [Campaign]
        });
        res.status(200).json(recipients);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getRecipientById = async (req, res) => {
    try {
        const recipient = await Recipient.findByPk(req.params.id, {
            include: [Campaign]
        });
        if (recipient) {
            res.status(200).json(recipient);
        } else {
            res.status(404).json({ message: 'Destinatário não encontrado' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateRecipient = async (req, res) => {
    try {
        const recipient = await Recipient.findByPk(req.params.id);
        if (recipient) {
            await recipient.update(req.body);
            res.status(200).json(recipient);
        } else {
            res.status(404).json({ message: 'Destinatário não encontrado' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteRecipient = async (req, res) => {
    try {
        const recipient = await Recipient.findByPk(req.params.id);
        if (recipient) {
            await recipient.destroy();
            res.status(204).send();
        } else {
            res.status(404).json({ message: 'Destinatário não encontrado' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

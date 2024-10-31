import dotenv from 'dotenv';
dotenv.config();

const emailConfig = {
    host: 'mail.bolt360.com.br',
    port: 587,
    secure: false,
    auth: {
        user: 'testesti@bolt360.com.br',
        pass: 'Gmais2023@@'
    },
    tls: {
        rejectUnauthorized: false,
        ciphers: 'SSLv3'
    },
    debug: true,
    logger: true
};

export default emailConfig; 
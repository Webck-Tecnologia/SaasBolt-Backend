import models from '../models/index.js';
import bcryptjs from "bcryptjs"
import jwt from "jsonwebtoken"
import dotenv from "dotenv"
import { sequelize } from "../models/index.js"
import { validateCPF } from "../utils/validarCPF.js"
import { errorHandler } from "../utils/error.js"
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { Op } from 'sequelize';
import emailConfig from '../config/emailConfig.js';

dotenv.config();
const { User, Workspace, UserWorkspace, PwdReset, PasswordResetToken } = models;
//Cadastro
export const cadastro = async(req, res, next) => {
    const { username, email, password, confirmPassword, cpf, gender } = req.body
    //Verificar se todos os campos foram preenchidos
    if (!username || !email || !password || !confirmPassword || !cpf || !gender) {
        return next(errorHandler(400, 'Por favor, preencha todos os campos'));
    }
    //Limpar os CPF
    const cleanedCPF = cpf.replace(/\D/g, '');
    //Validações Iniciais
    if(!username || !email || !password || !confirmPassword || !cleanedCPF || !gender){
        return next(errorHandler(400, 'Este CPF ja existe'))
    }
    if(!validateCPF(cleanedCPF)){
        return res.status(400).json({
            sucess: false,
            message: 'CPF inválido',
        })
    }
    //Verifica se o email já está em uso
    let validUser = await User.findOne({ where: { email } });
    if(validUser){
        return next(errorHandler(400, 'Este email ja existe'))
    }
    //Verifica se o CPF já está em uso
    let validUserCPF = await User.findOne({ where: { cpf: cleanedCPF } });
    if(validUserCPF){
        return next(errorHandler(400, 'Este CPF ja existe'))
    }
    //Verificar se as senhas conferem
    if(password !== confirmPassword){
        return next(errorHandler(400, 'As senhas não conferem'))
    }
    //Criptografar a senha
    const hashedPassword = bcryptjs.hashSync(password, 10)
    //Define a imagem de perfil com base no genero
    const boyProfilePic = `https://avatar.iran.liara.run/public/boy?username=${username}`
    const girlProfilePic = `https://avatar.iran.liara.run/public/girl?username=${username}`
    //Criar o usuário
    const newUser = new User({
        username,
        email,
        password: hashedPassword,
        cpf: cleanedCPF,
        gender,
        profilePicture: gender === 'Masculino' ? boyProfilePic : girlProfilePic
    })
    try{
        //Gerar Token JWT
        const token = jwt.sign({
            id: newUser._id,
            email: newUser.email,
            username: newUser.username,
        }, process.env.JWT_SECRET, {
            expiresIn: '7d',
        })
        // Salvar o usuário no banco de dados
        await newUser.save()
        res.status(201).json({
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                profilePicture: newUser.profilePicture,
            },
            token
        });
    }catch(error){
        return next(errorHandler(500, 'Erro interno do servidor'));
    }
}

//Login
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({
            where: { email },
            include: [
                {
                    model: Workspace,
                    as: 'participatedWorkspaces',
                    through: { model: UserWorkspace, attributes: ['role'] },
                    required: false
                },
                {
                    model: Workspace,
                    as: 'activeWorkspace',
                    required: false
                }
            ],
            attributes: ['id', 'email', 'username', 'password', 'profilePicture'] // Adicionando profilePicture
        });

        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.status(401).json({ message: "Credenciais inválidas" });
        }

        const token = jwt.sign({
            id: user.id,
            email: user.email,
            username: user.username,
            activeWorkspaceId: user.activeWorkspace ? user.activeWorkspace.id : null,
            profilePicture: user.profilePicture // Adicionando profilePicture ao token
        }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                profilePicture: user.profilePicture, // Adicionando profilePicture à resposta
                activeWorkspaceId: user.activeWorkspace ? user.activeWorkspace.id : null,
                workspaces: user.participatedWorkspaces ? user.participatedWorkspaces.map(w => ({
                    id: w.id,
                    name: w.name,
                    role: w.UserWorkspace ? w.UserWorkspace.role : null
                })) : []
            },
            token
        });
    } catch (error) {
        next(error);
    }
};

export const logout = (req, res) => {
    try{
        res.clearCookie('access_token').status(200).json({
            success: true,
            message: 'Logout realizado com sucesso'
        })
    }catch(error){
        next(errorHandler(500, 'Internal Server Error'))
    }
}

// Enviar código de recuperação
export const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: 'E-mail é obrigatório' 
            });
        }

        // Busca o usuário
        const user = await User.findOne({ 
            where: { email },
            include: [{
                model: PasswordResetToken,
                as: 'passwordResetTokens',
                where: {
                    used: false,
                    expiresAt: {
                        [Op.gt]: new Date()
                    }
                },
                required: false
            }]
        });

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'Usuário não encontrado' 
            });
        }

        // Verifica se já existe um token válido
        if (user.passwordResetTokens && user.passwordResetTokens.length > 0) {
            return res.status(409).json({ 
                success: false, 
                message: 'Já existe um código de recuperação válido. Aguarde alguns minutos para solicitar um novo código.',
                expiresAt: user.passwordResetTokens[0].expiresAt
            });
        }

        // Gera o token
        const token = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 30);

        // Cria o token no banco
        await PasswordResetToken.create({
            token,
            userId: user.id,
            expiresAt,
            used: false
        });

        // Configuração do transportador de email usando o config
        const transporter = nodemailer.createTransport(emailConfig);

        // Log para debug
        console.log('Configurações de email:', emailConfig);

        try {
            // Envia o email
            await transporter.sendMail({
                from: `"Bolt 360" <${emailConfig.auth.user}>`,
                to: email,
                subject: 'Recuperação de Senha - Bolt 360',
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    </head>
                    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 20px 0; text-align: center; background-color: #11ab8a;">
                                    <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Bolt 360</h1>
                                </td>
                            </tr>
                        </table>
                        
                        <table role="presentation" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <tr>
                                <td style="padding: 40px;">
                                    <h2 style="color: #333333; margin-top: 0;">Recuperação de Senha</h2>
                                    
                                    <p style="color: #666666; font-size: 16px; line-height: 1.5;">
                                        Olá,
                                    </p>
                                    
                                    <p style="color: #666666; font-size: 16px; line-height: 1.5;">
                                        Recebemos uma solicitação para redefinir a senha da sua conta. Use o código abaixo para continuar o processo:
                                    </p>
                                    
                                    <div style="background-color: #f8f9fa; border-radius: 4px; padding: 20px; margin: 30px 0; text-align: center;">
                                        <span style="font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; color: #11ab8a; letter-spacing: 4px;">
                                            ${token}
                                        </span>
                                    </div>
                                    
                                    <p style="color: #666666; font-size: 16px; line-height: 1.5;">
                                        Este código é válido por <strong>30 minutos</strong>. Por questões de segurança, não compartilhe este código com ninguém.
                                    </p>
                                    
                                    <p style="color: #666666; font-size: 16px; line-height: 1.5;">
                                        Se você não solicitou esta recuperação de senha, por favor, ignore este e-mail ou entre em contato com nossa equipe de suporte.
                                    </p>
                                    
                                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                                    
                                    <p style="color: #666666; font-size: 16px; line-height: 1.5;">
                                        Atenciosamente,<br>
                                        <strong style="color: #11ab8a;">Equipe Bolt 360</strong>
                                    </p>
                                </td>
                            </tr>
                        </table>
                        
                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 20px 0; text-align: center;">
                                    <p style="color: #999999; font-size: 14px; margin: 0;">
                                        Este é um e-mail automático, não responda.
                                    </p>
                                    <p style="color: #999999; font-size: 12px; margin: 10px 0 0 0;">
                                        © ${new Date().getFullYear()} Bolt 360. Todos os direitos reservados.
                                    </p>
                                </td>
                            </tr>
                        </table>
                    </body>
                    </html>
                `
            });

            return res.status(200).json({
                success: true,
                message: 'Código de recuperação enviado com sucesso'
            });

        } catch (emailError) {
            console.error('Erro ao enviar email:', emailError);
            // Remove o token criado se o email falhar
            await PasswordResetToken.destroy({ where: { token } });
            return res.status(500).json({
                success: false,
                message: 'Erro ao enviar o email de recuperação',
                error: emailError.message
            });
        }

    } catch (error) {
        console.error('Erro no processo de recuperação de senha:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro interno no processo de recuperação de senha',
            error: error.message
        });
    }
};

// Verificar código de recuperação
export const verifyResetCode = async (req, res, next) => {
    const { token, email } = req.body;

    try {
        const user = await User.findOne({ where: { email } });
        
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }

        const resetRecord = await PwdReset.findOne({
            where: {
                userId: user.id,
                token,
                expiresAt: { [Op.gt]: new Date() }
            }
        });

        if (!resetRecord) {
            return res.status(400).json({
                success: false,
                message: 'Código inválido ou expirado'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Código válido'
        });

    } catch (error) {
        next(errorHandler(500, 'Erro ao verificar código'));
    }
};

export const verTokenExists = async (req, res, next) => {
    const { email } = req.body;

    try {
        // Verifica se o email foi fornecido
        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: 'E-mail é obrigatório' 
            });
        }

        // Busca o usuário com o email fornecido
        const user = await User.findOne({ 
            where: { email },
            include: [{
                model: PasswordResetToken,
                as: 'passwordResetTokens',
                where: {
                    used: false,
                    expiresAt: {
                        [Op.gt]: new Date() // Verifica apenas tokens não expirados
                    }
                },
                required: false // LEFT JOIN para trazer o usuário mesmo sem tokens
            }]
        });

        // Se usuário não existe
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'Usuário não encontrado' 
            });
        }

        // Verifica se existe token válido
        if (user.passwordResetTokens && user.passwordResetTokens.length > 0) {
            return res.status(409).json({ 
                success: false, 
                message: 'Já existe um código de recuperação válido para este usuário. Aguarde alguns minutos para solicitar um novo código.',
                expiresAt: user.passwordResetTokens[0].expiresAt
            });
        }

        // Se não existe token válido
        return res.status(200).json({ 
            success: true, 
            message: 'Nenhum código de recuperação ativo encontrado' 
        });

    } catch (error) {
        console.error("Erro ao verificar token existente:", error);
        return next(errorHandler(500, 'Erro interno ao verificar código de recuperação'));
    }
};

// Alterar senha
export const resetPassword = async (req, res, next) => {
    const { email, newPassword, token } = req.body;

    try {
        console.log('1. Iniciando reset de senha:', { email });

        // Validações iniciais
        if (!email || !newPassword || !token) {
            return res.status(400).json({
                success: false,
                message: 'Email, nova senha e token são obrigatórios'
            });
        }

        // Busca o usuário
        const user = await User.findOne({ 
            where: { email },
            include: [{
                model: PasswordResetToken,
                as: 'passwordResetTokens',
                where: {
                    token: token,
                    used: false,
                    expiresAt: {
                        [Op.gt]: new Date()
                    }
                },
                required: false
            }]
        });

        console.log('2. Usuário encontrado:', user ? 'Sim' : 'Não');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }

        // Verifica se existe um token válido
        const resetToken = user.passwordResetTokens?.[0];
        
        console.log('3. Token válido encontrado:', resetToken ? 'Sim' : 'Não');

        if (!resetToken) {
            return res.status(400).json({
                success: false,
                message: 'Token inválido ou expirado'
            });
        }

        // Validação da nova senha
        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'A nova senha deve ter pelo menos 8 caracteres'
            });
        }

        try {
            // Inicia uma transação
            await sequelize.transaction(async (t) => {
                // Criptografa a nova senha
                const hashedPassword = bcryptjs.hashSync(newPassword, 10);

                // Atualiza a senha do usuário
                await user.update({ 
                    password: hashedPassword 
                }, { transaction: t });

                // Marca o token como usado
                await resetToken.update({ 
                    used: true 
                }, { transaction: t });

                console.log('4. Senha atualizada com sucesso');
            });

            return res.status(200).json({
                success: true,
                message: 'Senha alterada com sucesso'
            });

        } catch (updateError) {
            console.error('Erro ao atualizar senha:', updateError);
            return res.status(500).json({
                success: false,
                message: 'Erro ao atualizar senha',
                error: updateError.message
            });
        }

    } catch (error) {
        console.error('Erro ao resetar senha:', {
            message: error.message,
            stack: error.stack
        });
        
        return res.status(500).json({
            success: false,
            message: 'Erro ao alterar senha',
            error: error.message
        });
    }
};

export const verPwdToken = async (req, res, next) => {
    const { token, email } = req.body;

    try {
        console.log('1. Iniciando verificação do token:', { token, email });

        // Validação dos campos
        if (!token || !email) {
            console.log('2. Campos inválidos');
            return res.status(400).json({
                success: false,
                message: 'Token e email são obrigatórios'
            });
        }

        // Primeiro, busca o usuário
        const user = await User.findOne({ 
            where: { email } 
        });

        console.log('3. Usuário encontrado:', user ? 'Sim' : 'Não');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }

        // Depois, busca o token separadamente
        const resetToken = await PasswordResetToken.findOne({
            where: {
                userId: user.id,
                token: token,
                used: false,
                expiresAt: {
                    [Op.gt]: new Date()
                }
            }
        });

        console.log('4. Token encontrado:', resetToken ? 'Sim' : 'Não');
        
        if (!resetToken) {
            return res.status(400).json({
                success: false,
                message: 'Token inválido ou expirado'
            });
        }

        // Token válido encontrado
        console.log('5. Token válido, retornando sucesso');
        
        return res.status(200).json({
            success: true,
            message: 'Token válido',
            expiresAt: resetToken.expiresAt
        });

    } catch (error) {
        console.error('Erro detalhado:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        
        return res.status(500).json({
            success: false,
            message: 'Erro ao verificar código',
            details: error.message // Adicionando detalhes do erro na resposta
        });
    }
};

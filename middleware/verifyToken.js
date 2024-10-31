import { errorHandler } from "../utils/error.js"
import jwt from "jsonwebtoken"

export const isAuthenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next(errorHandler(401, "Não autorizado. Token não fornecido."));
        }

        const token = authHeader.split(' ')[1];
        jwt.verify(token, process.env.JWT_SECRET, (err, decodedUser) => {
            if (err) {
                return next(errorHandler(403, "Token inválido ou expirado"));
            }

            req.user = decodedUser;
            next();
        });
    } catch (error) {
        next(errorHandler(500, "Erro interno do servidor na autenticação"));
    }
}

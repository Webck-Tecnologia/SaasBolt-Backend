import express from "express"
import { cadastro, login, logout, forgotPassword, verPwdToken, resetPassword, verTokenExists } from "../controllers/auth.controller.js"

const router = express.Router()

router.post("/cadastro", cadastro)

router.post("/login", login)

router.get("/logout", logout)

router.post("/forgotpassword", forgotPassword)

router.post("/verpwdtoken", verPwdToken)

router.post("/changepwd", resetPassword)

router.post("/tokenresetverify", verTokenExists)

export default router
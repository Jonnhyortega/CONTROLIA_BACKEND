import User from "../models/User.js";
import { OAuth2Client } from "google-auth-library";
import generateToken from "../utils/generateToken.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleSignIn = async (req, res) => {
  try {
    const { id_token } = req.body;
    if (!id_token) return res.status(400).json({ message: "id_token requerido" });

    // Verify token
    const ticket = await client.verifyIdToken({ idToken: id_token, audience: process.env.GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();

    if (!payload || !payload.email) return res.status(400).json({ message: "Token inválido" });

    const email = payload.email.toLowerCase();
    const name = payload.name || payload.email.split("@")[0];

    // Buscar o crear usuario
    let user = await User.findOne({ email });
    if (!user) {
      // crear usuario con random password (no se usa)
      user = await User.create({ name, email, password: Math.random().toString(36).slice(-10) });
    }

    const token = generateToken(user._id);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (error) {
    console.error("Error Google SignIn:", error);
    res.status(500).json({ message: "Error verificando token de Google" });
  }
};

export default { googleSignIn };

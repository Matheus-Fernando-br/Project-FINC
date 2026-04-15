import { supabase } from "../services/supabase.js";
import { COOKIE_NAME } from "../utils/authCookies.js";

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.[COOKIE_NAME];

    if (!token) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({ error: "Sessão inválida ou expirada" });
    }

    req.user = {
      id: data.user.id,
      email: data.user.email,
    };

    return next();
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(401).json({ error: "Falha na autenticação" });
  }
};

export default authMiddleware;

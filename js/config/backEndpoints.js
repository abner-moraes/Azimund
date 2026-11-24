
//padrão para tomcat
export const BACK_URL = "/back";

// AuthController (/back/auth)
export const CADASTRO = "/usuarios/cadastro"; // POST   { nome, email, senha }                 (UsuarioCreateDTO)
export const LOGIN = "/auth/login";           // POST   { email, senha }                       (LoginDTO)   -> { email, nome }
export const LOGOUT = "/auth/logout";         // POST   (sem body)
export const ME = "/auth/me";                 // GET    -> { id, nome }

// UsuarioController (/back/usuarios)
export const UPDATE = "/usuarios/update";     // PATCH  { id, email, senha, nome, funcao }     (UsuarioPatchDTO)
export const DELETE = (id) => `/usuarios/delete/${encodeURIComponent(id)}`; // DELETE

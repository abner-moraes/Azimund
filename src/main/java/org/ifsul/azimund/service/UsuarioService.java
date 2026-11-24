package org.ifsul.azimund.service;

import lombok.AllArgsConstructor;
import org.ifsul.azimund.model.Usuario;
import org.ifsul.azimund.repository.UsuarioRepo;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@AllArgsConstructor
@Service
public class UsuarioService {
    private final UsuarioRepo usuarioRepo;
    private final PasswordEncoder passwordEncoder;

    public Usuario save(Usuario usuario) {
        String hash = passwordEncoder.encode(usuario.getSenhaHash());
        usuario.setSenhaHash(hash);

        return usuarioRepo.save(usuario);
    }
}

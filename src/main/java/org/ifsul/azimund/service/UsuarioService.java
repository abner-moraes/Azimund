package org.ifsul.azimund.service;

import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.ifsul.azimund.config.AMUsuarioDetails;
import org.ifsul.azimund.dto.UsuarioCreateDTO;
import org.ifsul.azimund.dto.UsuarioPatchDTO;
import org.ifsul.azimund.model.Usuario;
import org.ifsul.azimund.repository.UsuarioRepo;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

@AllArgsConstructor
@Service
public class UsuarioService {
    private final UsuarioRepo usuarioRepo;
    private final PasswordEncoder passwordEncoder;

    public Usuario save(UsuarioCreateDTO usuarioCreateDTO) {
        String hash = passwordEncoder.encode(usuarioCreateDTO.senha());

        Usuario usuario = new Usuario();
        usuario.setHorarioCriado(LocalDateTime.now());
        usuario.setEmail(usuarioCreateDTO.email());
        usuario.setSenhaHash(hash);
        usuario.setTipo("USER");
        usuario.setNome(usuarioCreateDTO.nome());

        return usuarioRepo.save(usuario);
    }

    @Transactional
    public Usuario update(UsuarioPatchDTO usuarioPatchDTO, Authentication auth) {
        AMUsuarioDetails deets = (AMUsuarioDetails) auth.getPrincipal();

        if (deets == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Precisa estar autenticado para tentar alterar detalhes da conta.");
        }

        String hash = passwordEncoder.encode(usuarioPatchDTO.senha());

        Usuario usuario = new Usuario();
        usuario.setId(deets.getUsuario().getId());
        usuario.setEmail(usuarioPatchDTO.email());
        usuario.setSenhaHash(hash);
        usuario.setNome(usuarioPatchDTO.nome());
        usuario.setFuncao(usuarioPatchDTO.funcao());

        return usuarioRepo.save(usuario);
    }

    public void delete(Long id, Authentication auth) {
        AMUsuarioDetails deets = (AMUsuarioDetails) auth.getPrincipal();

        if (deets == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Precisa estar autenticado para tentar deletar conta.");
        } else if (!deets.getUsuario().getId().equals(id)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Não pode deletar conta de outro usuário.");
        }

        Usuario usuario = deets.getUsuario();
        usuarioRepo.delete(usuario);
    }
}

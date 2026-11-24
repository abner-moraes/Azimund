package org.ifsul.azimund.service;

import lombok.AllArgsConstructor;
import org.ifsul.azimund.config.AMUsuarioDetails;
import org.ifsul.azimund.model.Usuario;
import org.ifsul.azimund.repository.UsuarioRepo;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@AllArgsConstructor
@Service
public class AMUsuarioDetailsService implements UserDetailsService {
    private final UsuarioRepo usuarioRepo;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException { //definitely wrong somehow
        Usuario usuario = usuarioRepo.findByEmail(username);
        if (usuario == null) throw new UsernameNotFoundException("qq é tu krl num te conheço");

        return new AMUsuarioDetails(usuario);
    }

}

package org.ifsul.azimund.controller;

import lombok.AllArgsConstructor;
import org.ifsul.azimund.dto.UsuarioCreateDTO;
import org.ifsul.azimund.dto.UsuarioPatchDTO;
import org.ifsul.azimund.model.Usuario;
import org.ifsul.azimund.service.UsuarioService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@AllArgsConstructor

@RestController
@RequestMapping("/back/usuarios")
public class UsuarioController {
    private final UsuarioService usuarioService;

    @PostMapping("/cadastro")
    public Usuario signUp(@RequestBody UsuarioCreateDTO usuarioCreateDTO) {
        return usuarioService.save(usuarioCreateDTO);
    }

    @PatchMapping
    public Usuario update(@RequestBody UsuarioPatchDTO usuarioPatchDTO, Authentication auth) {
        return usuarioService.update(usuarioPatchDTO, auth);
    }

    @DeleteMapping
    public void remover(@PathVariable Long id, Authentication auth) {
        usuarioService.delete(id, auth);
    }
}

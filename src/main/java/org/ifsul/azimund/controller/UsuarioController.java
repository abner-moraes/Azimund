package org.ifsul.azimund.controller;

import lombok.AllArgsConstructor;
import org.ifsul.azimund.model.Usuario;
import org.ifsul.azimund.service.UsuarioService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@AllArgsConstructor

@RestController
@RequestMapping("/back/usuarios")
public class UsuarioController {
    private final UsuarioService usuarioService;

    @PostMapping("/cadastro")
    public Usuario signUp(@RequestBody Usuario usuario) {
        return usuarioService.save(usuario);
    }
}

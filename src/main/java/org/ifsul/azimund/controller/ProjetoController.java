package org.ifsul.azimund.controller;

import lombok.AllArgsConstructor;
import org.ifsul.azimund.dto.ProjetoPatchDTO;
import org.ifsul.azimund.model.Projeto;
import org.ifsul.azimund.service.ProjetoService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@AllArgsConstructor

@RestController
@RequestMapping("/back/projetos")
public class ProjetoController {
    private final ProjetoService projetoService;

    @PostMapping("/novo")
    public Projeto criar(Authentication auth) {
        return projetoService.criar(auth);
    }

    @PatchMapping("/update")
    public Projeto update(@RequestBody ProjetoPatchDTO projetoPatchDTO, Authentication auth) {
        return projetoService.update(projetoPatchDTO, auth);
    }

    @DeleteMapping("/delete/{id}")
    public void remover(@PathVariable Long id, Authentication auth) {
        projetoService.delete(id, auth);
    }

    @GetMapping("/buscar/{codigo}")
    public Projeto procurarPorCodigo(@PathVariable String codigo) {
        return projetoService.procurarPorCodigo(codigo);
    }
}

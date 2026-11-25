package org.ifsul.azimund.controller;

import lombok.AllArgsConstructor;
import org.ifsul.azimund.dto.ProjetoPatchDTO;
import org.ifsul.azimund.model.Conteudo;
import org.ifsul.azimund.model.Projeto;
import org.ifsul.azimund.service.ConteudoService;
import org.ifsul.azimund.service.ProjetoService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@AllArgsConstructor

@RestController
@RequestMapping("/back/projetos")
public class ProjetoController {
    private final ProjetoService projetoService;
    private final ConteudoService conteudoService;

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

    @GetMapping("/porcodigo/{codigo}")
    public Projeto procurarPorCodigo(@PathVariable String codigo) {
        return projetoService.procurarPorCodigo(codigo);
    }

    @GetMapping("/porusuario/{id}")
    public List<Projeto> procurarPorIdUsuario(@PathVariable Long idUsuario) {
        return projetoService.procurarPorIdUsuario(idUsuario);
    }

    @GetMapping("/porid/{id}")
    public Projeto procurarPorId(@PathVariable Long id) {
        return projetoService.procurarPorId(id);
    }

    @GetMapping("/porid/{id}/conteudo")
    public Conteudo procurarConteudo(@PathVariable Long id) {
        return conteudoService.procurarPorIdProjeto(id);
    }
}

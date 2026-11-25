package org.ifsul.azimund.controller;

import lombok.AllArgsConstructor;
import org.ifsul.azimund.dto.ConteudoCreateDTO;
import org.ifsul.azimund.dto.ConteudoPatchDTO;
import org.ifsul.azimund.model.Conteudo;
import org.ifsul.azimund.service.ConteudoService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@AllArgsConstructor

@RestController
@RequestMapping("/back/conteudo")
public class ConteudoController {
    private final ConteudoService conteudoService;

    @PostMapping("/novo")
    public Conteudo criar(@RequestBody ConteudoCreateDTO conteudoCreateDTO) {
        return conteudoService.criar(conteudoCreateDTO);
    }

    @PatchMapping("/update")
    public Conteudo update(@RequestBody ConteudoPatchDTO conteudoPatchDTO) {
        return conteudoService.update(conteudoPatchDTO);
    }
}

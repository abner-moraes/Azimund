package org.ifsul.azimund.service;

import lombok.AllArgsConstructor;
import org.ifsul.azimund.dto.ConteudoCreateDTO;
import org.ifsul.azimund.dto.ConteudoPatchDTO;
import org.ifsul.azimund.model.Conteudo;
import org.ifsul.azimund.repository.ConteudoRepo;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@AllArgsConstructor

@Service
public class ConteudoService {
    private final ConteudoRepo conteudoRepo;

    public Conteudo criar(ConteudoCreateDTO conteudoCreateDTO) {

        if (conteudoCreateDTO.idProjeto() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Conteudo precisa ser associado com um projeto.");
        }

        Conteudo conteudo = new Conteudo();
        conteudo.setIdProjeto(conteudoCreateDTO.idProjeto());
        conteudo.setAnotacoes(conteudoCreateDTO.anotacoes());
        conteudo.setObjetos(conteudoCreateDTO.objetos());

        return conteudoRepo.save(conteudo);
    }

    public Conteudo update(ConteudoPatchDTO conteudoPatchDTO) {
        if (conteudoPatchDTO.id() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informações insuficientes para atualizar conteúdo");
        }

        Conteudo conteudo = conteudoRepo.findById(conteudoPatchDTO.id())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conteúdo a ser alterado não foi encontrado."));

        if (conteudoPatchDTO.anotacoes() != null) conteudo.setAnotacoes(conteudoPatchDTO.anotacoes());
        if (conteudoPatchDTO.objetos() != null) conteudo.setObjetos(conteudoPatchDTO.objetos());

        return conteudoRepo.save(conteudo);
    }

    public Conteudo procurarPorIdProjeto(Long idProjeto) {
        return conteudoRepo.findByIdProjeto(idProjeto);
    }
}

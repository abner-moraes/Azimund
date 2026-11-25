package org.ifsul.azimund.service;

import lombok.AllArgsConstructor;
import org.ifsul.azimund.config.AMUsuarioDetails;
import org.ifsul.azimund.dto.ProjetoPatchDTO;
import org.ifsul.azimund.model.Projeto;
import org.ifsul.azimund.repository.ProjetoRepo;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Objects;

@AllArgsConstructor
@Service
public class ProjetoService {
    private final ProjetoRepo projetoRepo;

    public Projeto criar(Authentication auth) {
        AMUsuarioDetails deets = (AMUsuarioDetails) auth.getPrincipal();

        if (deets == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Precisa estar autenticado para criar um projeto.");
        }

        int numeroAcesso = (int) Math.floor((Math.random() * Math.pow(10, 5) * 9) + 100000);
        String codigoAcesso = String.valueOf(numeroAcesso);

        Projeto projeto = new Projeto();
        projeto.setIdCriador(deets.getUsuario().getId());
        projeto.setHorarioCriado(LocalDateTime.now());
        projeto.setHorarioModificado(LocalDateTime.now());
        projeto.setCodigoAcesso(codigoAcesso);
        projeto.setTipo("Rascunho");

        return projetoRepo.save(projeto);
    }

    public Projeto update(ProjetoPatchDTO projetoPatchDTO, Authentication auth) {
        if (projetoPatchDTO.id() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informações insuficientes para atualizar projeto.");
        }

        Projeto projeto = projetoRepo.findById(projetoPatchDTO.id())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Projeto a ser alterado não foi encontrado."));
        AMUsuarioDetails deets = (AMUsuarioDetails) auth.getPrincipal();

        if (deets == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Precisa estar autenticado para tentar alterar um projeto.");
        } else if (!deets.getUsuario().getId().equals(projeto.getIdCriador())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Não pode alterar projeto de outro usuário.");
        }

        if (projetoPatchDTO.tipo() != null) projeto.setTipo(projetoPatchDTO.tipo());
        if (projetoPatchDTO.titulo() != null) projeto.setTitulo(projetoPatchDTO.tipo());
        if (projetoPatchDTO.descricao() != null) projeto.setDescricao(projetoPatchDTO.titulo());
        if (projetoPatchDTO.propriedades() != null) projeto.setPropriedades(projetoPatchDTO.propriedades());
        projeto.setHorarioModificado(LocalDateTime.now());

        return projetoRepo.save(projeto);
    }

    public void delete(Long id, Authentication auth) {
        if (projetoRepo.findById(id).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Projeto a ser deletado não foi encontrado.");
        }

        Projeto projeto = projetoRepo.findById(id).get();
        AMUsuarioDetails deets = (AMUsuarioDetails) auth.getPrincipal();

        if (!Objects.equals(projeto.getIdCriador(), deets.getUsuario().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Não pode deletar projeto de outro usuário");
        }

        projetoRepo.delete(projeto);
    }

    public Projeto procurarPorCodigo(String codigo) {
        return projetoRepo.findByCodigo(codigo);
    }
}

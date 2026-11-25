package org.ifsul.azimund.repository;

import org.ifsul.azimund.model.Conteudo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.NativeQuery;
import org.springframework.stereotype.Repository;

@Repository
public interface ConteudoRepo extends JpaRepository<Conteudo, Long> {
    @NativeQuery("SELECT * FROM conteudo c WHERE c.id_projeto = ?1 LIMIT 1")
    Conteudo findByIdProjeto(Long idProjeto);
}

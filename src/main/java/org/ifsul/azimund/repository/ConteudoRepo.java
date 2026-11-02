package org.ifsul.azimund.repository;

import org.ifsul.azimund.model.Conteudo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ConteudoRepo extends JpaRepository<Conteudo, Long> {
}

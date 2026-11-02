package org.ifsul.azimund.repository;

import org.ifsul.azimund.model.Projeto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProjetoRepo extends JpaRepository<Projeto, Long> {
}

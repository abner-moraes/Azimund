package org.ifsul.azimund.repository;

import org.ifsul.azimund.model.Projeto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.NativeQuery;
import org.springframework.stereotype.Repository;

@Repository
public interface ProjetoRepo extends JpaRepository<Projeto, Long> {
    @NativeQuery("SELECT * FROM projeto p WHERE p.codigo_acesso = ?1 LIMIT 1")
    Projeto findByCodigo(String codigo);
}

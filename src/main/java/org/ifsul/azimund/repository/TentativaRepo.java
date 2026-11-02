package org.ifsul.azimund.repository;

import org.ifsul.azimund.model.Tentativa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TentativaRepo extends JpaRepository<Tentativa, Long> {
}

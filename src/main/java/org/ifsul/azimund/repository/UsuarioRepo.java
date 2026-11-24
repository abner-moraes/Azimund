package org.ifsul.azimund.repository;

import org.ifsul.azimund.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.NativeQuery;
import org.springframework.stereotype.Repository;

@Repository
public interface UsuarioRepo extends JpaRepository<Usuario, Long> {
    @NativeQuery("SELECT * FROM usuario u WHERE u.email = ?1 LIMIT 1")
    Usuario findByEmail(String email);
}

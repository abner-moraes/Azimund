package org.ifsul.azimund.dto;

public record UsuarioPatchDTO(
        Long id,
        String email,
        String senha,
        String nome,
        String funcao
) {
}

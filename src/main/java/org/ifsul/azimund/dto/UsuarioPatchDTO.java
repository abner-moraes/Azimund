package org.ifsul.azimund.dto;

public record UsuarioPatchDTO(
        String email,
        String senha,
        String nome,
        String funcao
) {
}

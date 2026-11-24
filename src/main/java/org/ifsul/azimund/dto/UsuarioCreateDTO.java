package org.ifsul.azimund.dto;

public record UsuarioCreateDTO(
        String nome,
        String email,
        String senha
) {
}

package org.ifsul.azimund.dto;

public record ProjetoPatchDTO(
        Long id,
        String tipo,
        String titulo,
        String descricao,
        String propriedades
) {
}

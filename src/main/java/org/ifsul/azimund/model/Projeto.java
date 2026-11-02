package org.ifsul.azimund.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "projeto")

@Data
@NoArgsConstructor
public class Projeto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_projeto")
    private Long id;

    @Column(name = "id_criador", nullable = false)
    private Long idCriador;

    @Column(name = "horario_criado", columnDefinition = "datetime", nullable = false)
    private LocalDateTime horarioCriado;

    @Column(name = "horario_modificado", columnDefinition = "datetime", nullable = false)
    private LocalDateTime horarioModificado;

    @Column(name = "codigo_acesso")
    private String codigoAcesso;

    @Column(name = "tipo", columnDefinition = "enum")
    private String tipo;

    @Column(name = "titulo", length = 63)
    private String titulo;

    @Column(name = "descricao", columnDefinition = "text")
    private String descricao;
}

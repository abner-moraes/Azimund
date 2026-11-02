package org.ifsul.azimund.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Entity
@Table

@Data
@NoArgsConstructor
public class Tentativa {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_tentativa")
    private Long id;

    @Column(name = "id_atividade", nullable = false)
    private Long idAtividade;

    @Column(name = "id_usuario")
    private Long idUsuario;

    @Column(name = "horario_submissao")
    private LocalDateTime horarioSubmissao;

    @Column(name = "nome_anonimo", length = 63)
    private String nomeAnonimo;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "respostas")
    private String respostas;
}

package org.ifsul.azimund.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "conteudo")

@Data
@NoArgsConstructor
public class Conteudo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_conteudo")
    private Long id;

    @Column(name = "id_projeto", nullable = false)
    private Long idProjeto;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "objetos")
    private String objetos;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "anotacoes")
    private String anotacoes;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "questoes")
    private String questoes;
}
package org.ifsul.azimund.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "usuario")

@Data
@NoArgsConstructor
public class Usuario {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_usuario")
    private Long id;

    @Column(name = "horario_criado", columnDefinition = "datetime", nullable = false)
    private LocalDateTime horarioCriado;

    @Column(name = "email", nullable = false)
    private String email;

    @Column(name = "senha_hash", nullable = false, length = 63)
    private String senhaHash;

    @Column(name = "tipo", columnDefinition = "enum", nullable = false)
    private String tipo;

    @Column(name = "nome", nullable = false, length = 63)
    private String nome;
}
package org.ifsul.azimund.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "visualizacao")

@Data
@NoArgsConstructor
public class View {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_visualizacao")
    private Long id;

    @Column(name = "id_usuario", nullable = false)
    private Long idUsuario;

    @Column(name = "id_projeto", nullable = false)
    private Long idProjeto;

    @Column(name = "horario", columnDefinition = "datetime", nullable = false)
    private LocalDateTime horario;
}

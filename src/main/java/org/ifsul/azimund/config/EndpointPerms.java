package org.ifsul.azimund.config;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;

@AllArgsConstructor
@Getter
public enum EndpointPerms {
    //endpoints by permission level needed
    NONE (new String[]{
            "/",
            "/login.html",
            "/cadastro.html",
            "/back/usuarios/cadastro",
            "/back/auth/login",
            "/back/projetos/porcodigo/**"
    }),
    AUTH (new String[]{
            "/back/auth/logout",
            "/back/auth/me",
            "/back/usuarios/update",
            "/back/usuarios/delete/**",
            "/back/projetos/novo",
            "/back/projetos/update",
            "/back/projetos/delete/**",
            "/back/conteudo/novo",
            "/back/conteudo/update",
            "/back/projetos/porusuario/**",
            "/back/projetos/porid/**"
    });

    private final String[] urls;
}
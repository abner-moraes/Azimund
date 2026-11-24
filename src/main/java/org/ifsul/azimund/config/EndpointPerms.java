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
            "/back/auth/login"
    }),
    AUTH (new String[]{
            "/baguio"
    });

    private final String[] urls;
}
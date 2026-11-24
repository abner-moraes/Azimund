package org.ifsul.azimund.controller;

import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;
import org.ifsul.azimund.config.AMUsuarioDetails;
import org.ifsul.azimund.dto.LoginDTO;
import org.ifsul.azimund.model.Usuario;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@AllArgsConstructor

@RestController
@RequestMapping("/back/auth")
public class AuthController {
    private final AuthenticationManager authManager;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginDTO dto, HttpServletRequest req) {
        Authentication auth = authManager.authenticate(
                new UsernamePasswordAuthenticationToken(dto.email(), dto.senha())
        );

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);

        req.getSession(true).setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, context);

        AMUsuarioDetails deets = (AMUsuarioDetails) auth.getPrincipal();
        Usuario user = deets.getUsuario();

        Map rep = Map.of(
                "email", user.getEmail(),
                "nome", user.getNome()
        );
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(rep);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<?> handleBadCredentials() {
        Map rep = Map.of(
                "ERRO", "Email ou senha inválidos."
        );
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(rep);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest req) {
        req.getSession().invalidate();
        SecurityContextHolder.clearContext();

        return ResponseEntity
                .status(HttpStatus.OK)
                .build();
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication auth) {
        if (auth == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .build();
        }

        AMUsuarioDetails deets = (AMUsuarioDetails) auth.getPrincipal();
        Usuario user = deets.getUsuario();

        Map rep = Map.of(
                "nome", user.getNome()
        );

        return ResponseEntity
                .status(HttpStatus.OK)
                .body(rep);
    }
}

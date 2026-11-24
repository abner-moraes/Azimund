package org.ifsul.azimund.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

//https://dev.to/mspilari/fullstack-app-developing-the-back-end-with-spring-boot-and-postgresql-bbk
@Configuration
public class WebConfig {

    private String allowedOrigins;

    public WebConfig(@Value("${cors.allowed-origins}") String allowedOrigins) {
        this.allowedOrigins = allowedOrigins;
    }

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                        .allowedOrigins(allowedOrigins.split(","))
                        .allowedMethods("GET", "POST", "PUT", "DELETE")
                        .allowedHeaders("*");
            }
        };

    }
}

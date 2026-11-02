-- DROP DATABASE azimund;
CREATE DATABASE azimund;
USE azimund;

CREATE TABLE usuario(
	id_usuario BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    horario_criado DATETIME NOT NULL,
    
    email VARCHAR(255) NOT NULL UNIQUE,
    senha_hash VARCHAR(63) NOT NULL,
    tipo ENUM("USER", "ADMIN") NOT NULL,
    nome VARCHAR(63) NOT NULL
);

CREATE TABLE projeto(
	id_projeto BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    id_criador BIGINT NOT NULL,
    FOREIGN KEY(id_criador) REFERENCES usuario(id_usuario),
    horario_criado DATETIME NOT NULL,
    horario_modificado DATETIME NOT NULL,
    
    codigo_acesso VARCHAR(15), -- redundancia
    tipo ENUM("Mapa", "Apresentacao", "Atividade"),
    titulo VARCHAR(63),
    descricao TEXT
);

CREATE TABLE conteudo(
	id_conteudo BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    id_projeto BIGINT NOT NULL,
    FOREIGN KEY(id_projeto) REFERENCES projeto(id_projeto),
    
    objetos JSON,
    anotacoes JSON,
    questoes JSON
);

CREATE TABLE tentativa(
	id_tentativa BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    id_atividade BIGINT NOT NULL,
    FOREIGN KEY(id_atividade) REFERENCES projeto(id_projeto),
    id_usuario BIGINT,
    FOREIGN KEY(id_usuario) REFERENCES usuario(id_usuario),
    horario_submissao DATETIME,
    
    nome_anonimo VARCHAR(63), -- um de id_usuario e nome_anonimo tem que ser NOT NULL
    respostas JSON
);

CREATE TABLE visualizacao(
	id_visualizacao BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT,
	id_usuario BIGINT NOT NULL,
    FOREIGN KEY(id_usuario) REFERENCES usuario(id_usuario),
    id_projeto BIGINT NOT NULL,
    FOREIGN KEY(id_projeto) REFERENCES projeto(id_projeto)
);


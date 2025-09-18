CREATE DATABASE IF NOT EXISTS votacao_db;


USE votacao_db;


CREATE TABLE IF NOT EXISTS enquetes (
id int NOT NULL AUTO_INCREMENT,
titulo varchar(255) NOT NULL,
data_inicio datetime NOT NULL,
data_fim datetime NOT NULL,
created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE IF NOT EXISTS opcoes (
id int NOT NULL AUTO_INCREMENT,
descricao varchar(255) NOT NULL,
enquete_id int NOT NULL,
votos int NOT NULL DEFAULT '0',
created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
PRIMARY KEY (id),
KEY enquete_id (enquete_id),
CONSTRAINT opcoes_ibfk_1 FOREIGN KEY (enquete_id) REFERENCES enquetes (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

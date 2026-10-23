CREATE TABLE IF NOT EXISTS flag_override (
    session_id VARCHAR(64) NOT NULL,
    stream VARCHAR(64) NOT NULL,
    t_ms BIGINT NOT NULL,
    flag TINYINT NOT NULL,
    reason VARCHAR(500),
    PRIMARY KEY (session_id, stream, t_ms)
);

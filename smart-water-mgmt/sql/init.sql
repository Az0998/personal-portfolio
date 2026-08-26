-- 智慧水利管理系统 MySQL 8
CREATE DATABASE IF NOT EXISTS smart_water DEFAULT CHARSET utf8mb4;
USE smart_water;

CREATE TABLE sys_user (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(64) NOT NULL UNIQUE,
  password VARCHAR(100) NOT NULL,
  name VARCHAR(64) NOT NULL,
  role VARCHAR(16) NOT NULL DEFAULT 'user',
  phone VARCHAR(32),
  dept VARCHAR(64),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE station (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(64) NOT NULL,
  type VARCHAR(32),
  basin VARCHAR(64),
  cycle_type VARCHAR(32),
  water_level DECIMAL(10,2),
  flow_rate DECIMAL(10,2),
  status VARCHAR(16),
  note VARCHAR(255)
);

CREATE TABLE attendance_config (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  work_in VARCHAR(8) NOT NULL DEFAULT '09:30',
  work_out VARCHAR(8) NOT NULL DEFAULT '18:30'
);

CREATE TABLE attendance (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  punch_type VARCHAR(8) NOT NULL,
  punch_time DATETIME NOT NULL,
  place VARCHAR(64),
  status VARCHAR(16),
  remark VARCHAR(64)
);

CREATE TABLE leave_request (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  leave_type VARCHAR(16),
  start_date DATE,
  end_date DATE,
  reason VARCHAR(255),
  status VARCHAR(16) DEFAULT 'pending',
  reply VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE hydro_task (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(128) NOT NULL,
  station_id BIGINT,
  assignee_id BIGINT,
  priority VARCHAR(8),
  progress INT DEFAULT 0,
  status VARCHAR(16),
  deadline DATE,
  content TEXT,
  feedback TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE measure_report (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  station_id BIGINT NOT NULL,
  kind VARCHAR(16),
  value_num DECIMAL(12,3),
  unit VARCHAR(16),
  remark VARCHAR(255),
  image_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE equipment (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(64) NOT NULL,
  spec VARCHAR(64),
  stock INT DEFAULT 0,
  status VARCHAR(16),
  note VARCHAR(255)
);

CREATE TABLE borrow_record (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  equipment_id BIGINT NOT NULL,
  qty INT DEFAULT 1,
  reason VARCHAR(255),
  status VARCHAR(16) DEFAULT 'pending',
  reply VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  return_at DATETIME NULL
);

CREATE TABLE material (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(64) NOT NULL,
  spec VARCHAR(64),
  stock INT DEFAULT 0,
  unit VARCHAR(16),
  warn_line INT DEFAULT 0
);

CREATE TABLE stock_record (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  material_id BIGINT NOT NULL,
  io_type VARCHAR(8) NOT NULL,
  qty INT NOT NULL,
  note VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE banner (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(128),
  subtitle VARCHAR(255),
  sort_no INT DEFAULT 1,
  enabled TINYINT DEFAULT 1
);

CREATE TABLE op_log (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT,
  action VARCHAR(64),
  detail VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO sys_user (username, password, name, role, phone, dept) VALUES
('admin', 'admin123', '王调度', 'admin', '13900001001', '洮河管理局'),
('lintao', '123456', '李巡测', 'user', '13800002002', '临洮水文站');

INSERT INTO attendance_config (work_in, work_out) VALUES ('09:30', '18:30');

INSERT INTO station (name, type, basin, cycle_type, water_level, flow_rate, status, note) VALUES
('临洮水文站', '河道站', '洮河', '逐时', 4.82, 128, '正常', '控制站'),
('渭源水文站', '降水站', '洮河上游', '逐时', 3.16, 41, '正常', '山区站'),
('康乐水文站', '河道站', '洮河支流', '逐时', 2.74, 19, '关注', '支流控制'),
('峡口水库', '水库站', '洮河中游', '整点', 18.60, 86, '正常', '防洪兴利');

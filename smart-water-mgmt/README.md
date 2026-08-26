# 智慧水利管理系统

参考「智慧农场管理系统」的前后端分离结构，换成水文业务：

| 农场 | 水利 |
|------|------|
| 农作物 / 采收上报 | 测站 / 测报上报（水位·流量·降水·水质） |
| 农事任务 | 水事任务（断面复测、水位计校核、汛限检查） |
| 农具借用 | 测验仪器借用（ADCP、全站仪、水质仪） |
| 农资库存 | 防汛物资与出入库 |
| 农场首页作物卡片 | 重点测站卡片 |

## 在线演示（本站挂载）

个人站路径：`/smart-water`  
静态前端：`public/smart-water/`（Vue 3 + Element Plus + ECharts，数据在 `localStorage`）

演示账号：

- 巡测员 `lintao` / `123456`
- 管理员 `admin` / `admin123`

## 本地完整栈（SpringBoot + MySQL）

```bash
# 1. 建库
mysql -u root -p < sql/init.sql

# 2. 改 backend/src/main/resources/application.yml 账号密码

# 3. 启动
cd backend
mvn spring-boot:run
# API: http://localhost:8088/api
```

技术：Java 11、SpringBoot 2.7、MyBatis-Plus、MySQL。登录返回 `X-Token`，与前端演示接口形态对齐。

## 角色

- **巡测员（前台）**：登录注册、首页、考勤打卡/日历、请假、任务反馈、测报登记（含图片）、仪器申请/归还、个人中心
- **管理员（后台）**：看板、用户、测站、任务分配、测报、考勤时间配置、请假审核、仪器与借用审核、防汛物资/出入库、轮播图、操作日志

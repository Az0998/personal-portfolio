# 微型蒸渗仪教学演示站

面向高校实验课的 SmartField / SFL 微型蒸渗仪数据处理网站：接入 DT80 CSV，检出异常，按 Kapilaratne and Lu (2017) 订正 5TE 含水量，对比滑动平均 / 线性插值 / AWAT，计算降水、蒸散、渗漏与土壤水储量变化，并给出 0/1/2 质量旗标与实验报告。

## 启动

需要 JDK 17 与 Node.js。

```bat
cd backend
mvnw.cmd spring-boot:run
```

另开终端：

```bat
cd frontend
npm install
npm run dev
```

浏览器打开 http://localhost:5173 。前端把 `/api` 代理到后端 `8080`。

课堂可点「载入 MATLAB 课堂仿真」（起始 **2024-06-01**，共 14 天，雨日 **2024-06-05、2024-06-11**，含尖峰与泵，非实测）。也可上传称重、探头、气象 CSV/xlsx。

开发请用 `mvnw.cmd spring-boot:run` 编译当前源码，**不要** `java -jar target/backend-0.1.0.jar`（旧包日期/质控会和源码不一致）。

若要打部署包：

```bat
cd backend
mvnw.cmd -DskipTests package
java -jar target\backend-0.1.0.jar
```

打包装的是刚刚编译的 class，打完再运行，不要沿用仓库里已经过期的 jar。

## 教学硬约束

- 底面积 0.0707 m²，1 kg = 14.14 mm。5 g 门限 ≈ 0.071 mm，不是手册误写的 0.035 mm。
- 泵是土柱与补水桶之间的内部调水，不是降水或蒸散。
- 温度订正只作用于 5TE 体积含水量；辐射只作日变化诊断。
- ET0 是参考蒸散，不是蒸渗仪实测 ETa。

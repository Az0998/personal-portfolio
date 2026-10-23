FROM node:20-alpine AS fe
WORKDIR /fe
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend ./
RUN npx vite build

FROM maven:3.9-eclipse-temurin-17 AS be
WORKDIR /app
COPY backend ./
COPY --from=fe /fe/dist src/main/resources/static
RUN mvn -q -DskipTests package

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN adduser -D -u 10001 app
COPY --from=be /app/target/*.jar /app/app.jar
USER app
ENV PORT=8080
EXPOSE 8080
CMD ["sh", "-c", "java -XX:MaxRAMPercentage=75 -jar /app/app.jar --server.port=${PORT} --server.address=0.0.0.0"]

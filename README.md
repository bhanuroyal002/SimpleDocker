# Movie Ticket Booking - Jenkins CI/CD

A simple Spring Boot WAR application for practicing an end-to-end Jenkins CI/CD pipeline.

## Stack
- Java 17 target
- Spring Boot 3.4.5
- Maven
- SonarQube
- JFrog Artifactory
- Docker / Docker Compose
- MySQL 8.0
- Trivy
- Jenkins
- GitHub

## Endpoints
- GET /
- GET /movies
- GET /health

The application listens on port 8080 inside its container. Docker Compose exposes it on host port 8081 because Jenkins uses host port 8080.

## Project Structure
```text
.
├── Jenkinsfile
├── Dockerfile
├── Dockerfile.db
├── docker-compose.yml
├── pom.xml
├── db/
│   └── init.sql
└── src/
    └── main/
        ├── java/com/movie/booking/
        │   └── MovieBookingApplication.java
        └── resources/
            └── application.properties
```

## Build Locally
```bash
mvn clean package
```

WAR:
```text
target/movie-ticket-booking.war
```

## Jenkins Pipeline
```text
GitHub
  ↓
Pull Code
  ↓
Maven Build
  ↓
SonarQube Analysis
  ↓
Quality Gate
  ↓
Upload WAR to Artifactory
  ↓
Download WAR from Artifactory
  ↓
Build App Docker Image
  ↓
Build DB Docker Image
  ↓
Trivy Scan App + DB
  ↓
Docker Compose Deploy
  ↓
Health Check
```

The WAR is downloaded from Artifactory before the application Docker image is built.

## Jenkins Configuration
Configure:
- GitHub credential ID: `github-credentials`
- Maven installation name: `Maven-3.9`
- SonarQube server name: `SonarQube`
- Artifactory credential ID: `artifactory-credentials`

The Jenkins agent must be able to run:
```bash
java --version
mvn --version
docker --version
docker compose version
trivy --version
```

Replace the placeholder `ARTIFACTORY_URL` in the Jenkinsfile with your actual Artifactory URL.

## Artifactory
The WAR is stored by Jenkins build number:
```text
maven-releases/
└── movie-ticket-booking/
    └── <BUILD_NUMBER>/
        └── movie-ticket-booking.war
```

## Docker
Builds produce:
```text
movie-ticket-booking:<BUILD_NUMBER>
movie-ticket-db:<BUILD_NUMBER>
```

Both images are scanned for HIGH and CRITICAL vulnerabilities. The pipeline currently uses `--ignore-unfixed` and fails on applicable HIGH/CRITICAL findings.

## Database
The MySQL image runs `db/init.sql` when the MySQL data volume is initialized for the first time.

## Security
The database credentials are for learning only. Use Jenkins credentials, Docker secrets, or a secret-management system in production.

## Repository
https://github.com/bhanuroyal002/SimpleDocker

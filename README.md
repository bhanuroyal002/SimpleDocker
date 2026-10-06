# Movie Ticket Booking - Jenkins CI/CD

A Spring Boot movie ticket booking application for practicing an end-to-end DevOps CI/CD workflow with Jenkins, Maven, SonarQube, Docker, MySQL, Trivy and Docker Compose.

## Stack
- Java 17
- Spring Boot 3.4.5
- Maven
- Spring JDBC
- MySQL 8.0
- HTML / CSS / JavaScript
- Jenkins
- GitHub
- SonarQube
- Docker / Docker Compose
- Trivy

## Application Features
- Responsive MovieMate web UI
- Dynamic movie listing
- Movie and showtime selection
- Interactive seat selection
- Maximum 6 seats per booking
- Customer name and email validation
- Live ticket count and total price
- Booking confirmation with booking ID
- MySQL persistence

## REST APIs
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/movies` | Get available movies |
| POST | `/api/bookings` | Create a booking |
| GET | `/api/health` | Application and database health check |

The application listens on port `8080` inside the container. Docker Compose exposes it on host port `8081`.

```text
http://<EC2_PUBLIC_IP>:8081
http://<EC2_PUBLIC_IP>:8081/api/health
```

## Current Project Structure
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
        ├── java/
        │   └── com/movie/booking/
        │       └── MovieBookingApplication.java
        └── resources/
            ├── static/
            │   ├── index.html
            │   ├── style.css
            │   └── app.js
            ├── application.properties
            └── schema.sql
```

## Important Files
| File | Purpose |
|---|---|
| `Jenkinsfile` | Jenkins CI/CD pipeline |
| `pom.xml` | Maven build, dependencies and Sonar Maven plugin |
| `MovieBookingApplication.java` | Spring Boot application and REST APIs |
| `static/index.html` | MovieMate frontend |
| `static/style.css` | Responsive UI styling |
| `static/app.js` | Booking UI and API integration |
| `application.properties` | Application/database configuration |
| `schema.sql` | Creates required tables on application startup |
| `db/init.sql` | MySQL initialization and seed movies |
| `Dockerfile` | Application image |
| `Dockerfile.db` | MySQL image |
| `docker-compose.yml` | Application + database deployment |

## Local Build
```bash
mvn clean package
```

Generated artifact:
```text
target/movie-ticket-booking.war
```

## Current CI/CD Pipeline
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
Build Application Docker Image
   ↓
Build Database Docker Image
   ↓
Trivy Scan - Application
   ↓
Trivy Scan - Database
   ↓
Docker Compose Deploy
   ↓
Application Health Check
```

### Maven
Jenkins uses the configured `Maven-3.9` installation and produces the WAR artifact.

### SonarQube
The pipeline runs `mvn sonar:sonar` and waits for the SonarQube Quality Gate. The Sonar Maven plugin is explicitly configured in `pom.xml`.

### Docker
Images are tagged with the Jenkins build number:
```text
movie-ticket-booking:<BUILD_NUMBER>
movie-ticket-db:<BUILD_NUMBER>
```

### Trivy
Both images are scanned for HIGH and CRITICAL vulnerabilities.

Current Trivy mode is **report-only**:
- `--severity HIGH,CRITICAL`
- `--ignore-unfixed`
- `--exit-code 0`

Trivy findings therefore do not currently fail the pipeline.

### Docker Compose
The app is exposed as host `8081 → container 8080`. MySQL port 3306 is not published to the host and is available only through the Docker Compose network.

### Deployment Verification
Jenkins verifies:
```text
GET http://localhost:8081/api/health
```

## Database
The project uses MySQL 8.0 with a persistent Docker volume named `mysql_data`.

`db/init.sql` initializes the database and seed movies when the MySQL volume is created for the first time.

`schema.sql` is executed by Spring Boot with `spring.sql.init.mode=always`, ensuring required tables are also created when an existing MySQL volume is reused.

## Jenkins Configuration
Configure:
- GitHub credential ID: `github-credentials`
- Maven installation name: `Maven-3.9`
- SonarQube server name: `SonarQube`

The Jenkins agent should provide:
```bash
java --version
mvn --version
docker --version
docker compose version
trivy --version
```

## Nexus Artifact Repository

### Can Nexus be integrated?
**Yes. Nexus Repository can be integrated and is a good next improvement for this project.**

Currently the pipeline goes directly from Maven build to Docker image creation. Nexus is not yet active in the pipeline.

With Nexus, the recommended flow becomes:
```text
GitHub
   ↓
Maven Build
   ↓
SonarQube
   ↓
Quality Gate
   ↓
Publish WAR → Nexus
   ↓
Build Docker Image
   ↓
Trivy
   ↓
Docker Compose Deploy
```

Nexus can store the WAR centrally so the same immutable artifact can be reused for Docker image creation and future environment promotion.

### Recommended Nexus Repository
Create a Maven hosted repository, for example:
```text
movie-releases
```

Recommended coordinates:
```text
Group ID:    com.movie
Artifact ID: movie-ticket-booking
Packaging:   war
Version:     1.0.<BUILD_NUMBER>
```

Example:
```text
movie-releases/
└── com/movie/movie-ticket-booking/1.0.25/
    └── movie-ticket-booking-1.0.25.war
```

### Jenkins + Nexus
Jenkins should authenticate to Nexus using a Jenkins credential such as:
```text
Credential ID: nexus-credentials
Nexus URL:     http://<NEXUS_HOST>:8081
Repository:    movie-releases
```

Credentials must not be hard-coded in the Jenkinsfile.

### Build Once, Promote
Nexus enables a cleaner DevOps model:
```text
Source Code
    ↓
Build / Test
    ↓
SonarQube
    ↓
Quality Gate
    ↓
Publish immutable WAR to Nexus
    ↓
Build container from the stored artifact
    ↓
Security scan
    ↓
Deploy
```

This avoids rebuilding different binaries for different environments.

## Production Readiness
This is currently a production-style DevOps practice application, not a complete commercial ticket-booking platform.

Implemented:
- Containerized application
- Persistent database
- Health check
- CI/CD pipeline
- SonarQube Quality Gate
- Trivy scanning
- Docker Compose deployment
- Input validation
- MySQL persistence
- Responsive frontend

Still required for a real commercial production platform:
- Authentication and authorization
- Payment integration
- Real-time seat locking/concurrency control
- Proper show/movie scheduling
- Database migration management
- HTTPS/TLS
- Externalized secrets
- Production database configuration
- Centralized logging and monitoring
- Backup/recovery
- High availability and scaling

## Security Notes
The current database credentials are for learning only:
```text
DB_USER=movieuser
DB_PASSWORD=moviepass
MYSQL_ROOT_PASSWORD=rootpass
```

For production, use Jenkins credentials, Docker/Kubernetes secrets or an external secrets-management solution.

## Repository
`https://github.com/bhanuroyal002/SimpleDocker`

## Next DevOps Enhancement
The next CI/CD improvement is to integrate Nexus so the Maven WAR is published centrally before Docker image creation. This will make the project demonstrate a more complete enterprise-style flow:

```text
GitHub → Jenkins → Maven → SonarQube → Quality Gate → Nexus → Docker → Trivy → Compose → Health Check
```
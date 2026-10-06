# Movie Ticket Booking - Jenkins CI/CD

A Spring Boot movie ticket booking application for practicing an end-to-end DevOps CI/CD workflow with Jenkins, Maven, SonarQube, Nexus Repository, Docker, MySQL, Trivy and Docker Compose.

The project also includes a cinema-marketplace-style MovieMate frontend with movie banners, search, category navigation, hero carousel, recommended movie cards and a dedicated booking page.

## Stack
- Java 17
- Spring Boot 3.4.5
- Maven
- Spring JDBC
- MySQL 8.0
- HTML / CSS / JavaScript
- JUnit 5 / Spring Boot Test
- JaCoCo
- Jenkins
- GitHub
- SonarQube
- Nexus Repository
- Docker / Docker Compose
- Trivy

## Application Features
- Cinema-marketplace-style responsive MovieMate UI
- Dark header/navigation with orange/red accents
- Search bar, location selector, category navigation and hero carousel
- Recommended movie card grid with genre filters and quick booking
- Dynamic movie listing from `/api/movies`
- Local movie banner artwork for Avatar, Avengers and Inception
- Clickable movie cards that navigate to the dedicated booking page
- Dedicated `/booking.html?movieId=<id>` booking flow
- Showtime selection
- Interactive seat selection
- Maximum 6 seats per booking
- Customer name and email validation
- Live ticket count and total price
- Booking confirmation with booking ID
- MySQL persistence

## Movie Booking Flow
```text
Home / Now Showing
        ↓
Select movie banner
        ↓
/booking.html?movieId=<id>
        ↓
Choose showtime
        ↓
Select seats
        ↓
Enter customer details
        ↓
Confirm booking
```

Movie banner assets are stored locally under:
```text
src/main/resources/static/banners/
```

## REST APIs
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/movies` | Get available movies |
| POST | `/api/bookings` | Create a booking |
| GET | `/api/health` | Application and database health check |

The application listens on port `8080` inside the container. Docker Compose exposes it on host port `8081`.

```text
http://<EC2_PUBLIC_IP>:8081
http://<EC2_PUBLIC_IP>:8081/booking.html?movieId=1
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
    ├── main/
    │   ├── java/
    │   │   └── com/movie/booking/
    │   │       └── MovieBookingApplication.java
    │   └── resources/
    │       ├── static/
    │       │   ├── index.html
    │       │   ├── style.css
    │       │   ├── app.js
    │       │   ├── booking.html
    │       │   ├── booking.js
    │       │   └── banners/
    │       │       ├── avatar.svg
    │       │       ├── avengers.svg
    │       │       ├── inception.svg
    │       │       └── cinema.svg
    │       ├── application.properties
    │       └── schema.sql
    └── test/
        └── java/
            └── com/movie/booking/
                └── MovieBookingApplicationTest.java
```

## Important Files
| File | Purpose |
|---|---|
| `Jenkinsfile` | Jenkins CI/CD pipeline and automatic N+1 release versioning |
| `pom.xml` | Maven build, dependencies, Nexus metadata, Sonar Maven plugin and JaCoCo |
| `MovieBookingApplication.java` | Spring Boot application and REST APIs |
| `MovieBookingApplicationTest.java` | Controller/API tests |
| `static/index.html` | MovieMate cinema-style home/movie-selection page |
| `static/style.css` | Frontend and booking-page styling |
| `static/app.js` | Movie listing, search, filters, hero carousel and booking navigation |
| `static/booking.html` | Dedicated ticket booking page |
| `static/booking.js` | Booking-page seats and API integration |
| `static/banners/*.svg` | Local movie/cinema banner artwork |
| `application.properties` | Application/database configuration |
| `schema.sql` | Creates required tables on startup |
| `db/init.sql` | MySQL initialization and seed movies |
| `Dockerfile` | Application image |
| `Dockerfile.db` | MySQL image |
| `docker-compose.yml` | Application + database deployment |

## Local Build and Test
```bash
mvn clean package
```

Generated files:
```text
target/movie-ticket-booking.war
target/site/jacoco/jacoco.xml
target/surefire-reports/*.xml
```

The tests use Spring Boot Test + MockMvc with a mocked JdbcTemplate, so the API tests do not require a running MySQL instance.

## Test Coverage
JaCoCo generates `target/site/jacoco/jacoco.xml` for SonarQube.

Current tests cover:
- Movie listing
- Health endpoint
- Successful booking
- Maximum 6-seat validation
- Movie-not-found handling
- Invalid customer/booking data validation

## Current CI/CD Pipeline
```text
GitHub
   ↓
Pull Code
   ↓
Read latest released version from Nexus
   ↓
Calculate N + 1 release version
   ↓
Update workspace POM
   ↓
Maven Build & Unit Tests
   ↓
JaCoCo Coverage
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
   ↓
Publish versioned WAR to Nexus
   ↓
Commit release POM version to GitHub
```

### Automatic Release Versioning
Nexus is the source of truth for the latest successfully published release.

Example:
```text
Nexus latest = 1.0.2
      ↓
Next pipeline = 1.0.3
      ↓
Publish 1.0.3
      ↓
Next pipeline = 1.0.4
```

If a pipeline fails before successful WAR publication, that release version is not added to Nexus. The next build therefore uses the same next version.

The pipeline also uses `disableConcurrentBuilds()` so two builds cannot calculate the same release version concurrently.

### Maven Build & Test
Jenkins runs `mvn clean package` using the configured `Maven-3.9` installation. The build compiles the application, runs tests, generates the WAR and creates the JaCoCo report.

### SonarQube
The pipeline runs `mvn sonar:sonar` and waits for the Quality Gate.

Jenkins configuration:
```text
Name: SonarQube
Server URL: http://localhost:9000
```

SonarQube must have a Jenkins webhook configured for `/sonarqube-webhook/` so `waitForQualityGate` can receive the analysis result.

### Quality Gate
```groovy
timeout(time: 5, unit: 'MINUTES') {
    waitForQualityGate abortPipeline: true
}
```

A failed Quality Gate stops Docker build, deployment and Nexus publication.

### Docker
Images use the Jenkins build number:
```text
movie-ticket-booking:<BUILD_NUMBER>
movie-ticket-db:<BUILD_NUMBER>
```

### Trivy
Both images are scanned for HIGH and CRITICAL vulnerabilities.

Current mode is report-only:
- `--severity HIGH,CRITICAL`
- `--ignore-unfixed`
- `--exit-code 0`

### Docker Compose
The application uses host port `8081 → container 8080`. MySQL port 3306 is internal to the Compose network.

### Deployment Verification
Jenkins verifies:
```text
GET http://localhost:8081/api/health
```

## Nexus Artifact Repository
Nexus Repository is integrated as the Maven hosted artifact repository.

```text
Repository: movie-releases
Jenkins repository URL: http://localhost:8082/repository/movie-releases/
Repository ID: nexus-releases
Credential ID: nexus-credentials
```

Artifact coordinates:
```text
Group ID:    com.movie
Artifact ID: movie-ticket-booking
Packaging:   war
Version:     1.0.x
```

Example:
```text
com/movie/movie-ticket-booking/1.0.2/
└── movie-ticket-booking-1.0.2.war
```

The pipeline reads `maven-metadata.xml` from Nexus to determine the latest released version and calculates the next patch version.

Credentials are injected into Maven at runtime and are not hard-coded in the Jenkinsfile.

## GitHub Release Version Update
After the WAR is successfully published to Nexus, Jenkins stages only `pom.xml`, commits the release version and pushes it to `main` using:

```text
Credential ID: github-credentials
```

No Git commands are required on the EC2 server for normal releases.

## Database
The project uses MySQL 8.0 with persistent Docker volume `mysql_data`.

`db/init.sql` initializes the database and seed movies when the MySQL volume is created for the first time.

`schema.sql` runs with `spring.sql.init.mode=always`, ensuring required tables are created when an existing volume is reused.

## Jenkins Configuration
Configure:
- GitHub credential ID: `github-credentials`
- Maven installation name: `Maven-3.9`
- SonarQube server name: `SonarQube`
- Nexus credential ID: `nexus-credentials`

The Jenkins agent should provide:
```bash
java --version
mvn --version
docker --version
docker compose version
trivy --version
```

## Production Readiness
Implemented:
- Containerized application
- Persistent database
- Health check
- CI/CD pipeline
- Automated unit/API tests
- JaCoCo coverage
- SonarQube Quality Gate
- Nexus WAR artifact repository
- Automatic N+1 release versioning
- GitHub release-version update
- Trivy scanning
- Docker Compose deployment
- Input validation
- MySQL persistence
- Responsive cinema-marketplace frontend
- Search and movie filters
- Hero movie carousel
- Dedicated movie booking page
- Local movie banner assets

Still required for a real commercial platform:
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
Current database credentials are for learning only:
```text
DB_USER=movieuser
DB_PASSWORD=moviepass
MYSQL_ROOT_PASSWORD=rootpass
```

For production, use Jenkins credentials, Docker/Kubernetes secrets or an external secrets-management solution.

For Nexus, use a dedicated CI/service account instead of the `admin` account in a production environment.

## Repository
https://github.com/bhanuroyal002/SimpleDocker

## Maintenance Rule
Whenever the application architecture, frontend flow, project structure, CI/CD stages, artifact/versioning strategy, deployment configuration or tooling changes, update this README in the same change set so the documentation remains aligned with the repository.

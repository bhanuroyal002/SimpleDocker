pipeline {

    agent any

    environment {

        // ============================================================
        // APPLICATION
        // ============================================================

        APP_NAME = 'movie-ticket-booking'
        APP_VERSION = "${BUILD_NUMBER}"

        WAR_FILE = "movie-ticket-booking-${BUILD_NUMBER}.war"


        // ============================================================
        // GITHUB
        // ============================================================

        GIT_REPO = 'https://github.com/bhanuroyal002/SimpleDocker.git'
        GIT_BRANCH = 'main'


        // ============================================================
        // MAVEN
        // ============================================================

        MAVEN_HOME = tool 'Maven-3.9'

        PATH = "${MAVEN_HOME}/bin:${env.PATH}"


        // ============================================================
        // SONARQUBE
        // ============================================================

        SONARQUBE_SERVER = 'SonarQube'


        // ============================================================
        // ARTIFACTORY
        // ============================================================

        ARTIFACTORY_URL = 'http://YOUR_ARTIFACTORY_IP:8081/artifactory'

        ARTIFACTORY_REPO = 'maven-releases'

        ARTIFACTORY_CREDENTIALS =
            credentials('artifactory-credentials')


        // ============================================================
        // DOCKER
        // ============================================================

        DOCKER_REGISTRY = 'local'

        APP_IMAGE = 'movie-ticket-booking'

        DB_IMAGE = 'movie-ticket-db'

        IMAGE_TAG = "${BUILD_NUMBER}"
    }


    stages {


        // ============================================================
        // 1. PULL CODE
        // ============================================================

        stage('Pull Code') {

            steps {

                echo '============================================'
                echo 'Pulling code from GitHub'
                echo '============================================'

                git(
                    branch: "${GIT_BRANCH}",
                    url: "${GIT_REPO}",
                    credentialsId: 'github-credentials'
                )
            }
        }


        // ============================================================
        // 2. MAVEN BUILD
        // ============================================================

        stage('Maven Build') {

            steps {

                echo '============================================'
                echo 'Building Java application'
                echo '============================================'

                sh '''
                    mvn clean package -DskipTests
                '''

                sh '''
                    echo "Generated WAR:"
                    ls -lh target/*.war
                '''
            }
        }


        // ============================================================
        // 3. SONARQUBE CODE QUALITY
        // ============================================================

        stage('Code Quality Analysis') {

            steps {

                echo '============================================'
                echo 'Running SonarQube analysis'
                echo '============================================'

                withSonarQubeEnv("${SONARQUBE_SERVER}") {

                    sh '''
                        mvn sonar:sonar \
                        -Dsonar.projectKey=movie-ticket-booking \
                        -Dsonar.projectName=Movie-Ticket-Booking
                    '''
                }
            }
        }


        // ============================================================
        // 4. QUALITY GATE
        // ============================================================

        stage('Quality Gate') {

            steps {

                echo '============================================'
                echo 'Checking SonarQube Quality Gate'
                echo '============================================'

                timeout(
                    time: 5,
                    unit: 'MINUTES'
                ) {

                    waitForQualityGate(
                        abortPipeline: true
                    )
                }
            }
        }


        // ============================================================
        // 5. PREPARE WAR
        // ============================================================

        stage('Prepare WAR') {

            steps {

                echo '============================================'
                echo 'Preparing WAR artifact'
                echo '============================================'

                sh '''
                    WAR_SOURCE=$(find target -maxdepth 1 \
                        -name "*.war" \
                        -type f \
                        ! -name "*.original" \
                        | head -1)

                    if [ -z "$WAR_SOURCE" ]; then

                        echo "ERROR: WAR file not found"

                        exit 1

                    fi

                    echo "WAR Source:"
                    echo "$WAR_SOURCE"

                    cp "$WAR_SOURCE" "$WORKSPACE/${WAR_FILE}"

                    echo "Prepared WAR:"
                    ls -lh "$WORKSPACE/${WAR_FILE}"
                '''
            }
        }


        // ============================================================
        // 6. UPLOAD WAR TO ARTIFACTORY
        // ============================================================

        stage('Upload WAR to Artifactory') {

            steps {

                echo '============================================'
                echo 'Uploading WAR to Artifactory'
                echo '============================================'

                sh '''
                    curl -f \
                    -u "$ARTIFACTORY_CREDENTIALS_USR:$ARTIFACTORY_CREDENTIALS_PSW" \
                    -T "$WORKSPACE/${WAR_FILE}" \
                    "$ARTIFACTORY_URL/$ARTIFACTORY_REPO/$APP_NAME/$APP_VERSION/$WAR_FILE"
                '''

                echo 'WAR uploaded successfully.'
            }
        }


        // ============================================================
        // 7. DOWNLOAD WAR FROM ARTIFACTORY
        // ============================================================

        stage('Download WAR from Artifactory') {

            steps {

                echo '============================================'
                echo 'Downloading WAR from Artifactory'
                echo '============================================'

                sh '''
                    rm -f "$WORKSPACE/${WAR_FILE}"

                    curl -f \
                    -u "$ARTIFACTORY_CREDENTIALS_USR:$ARTIFACTORY_CREDENTIALS_PSW" \
                    -o "$WORKSPACE/${WAR_FILE}" \
                    "$ARTIFACTORY_URL/$ARTIFACTORY_REPO/$APP_NAME/$APP_VERSION/$WAR_FILE"

                    echo "Downloaded WAR:"
                    ls -lh "$WORKSPACE/${WAR_FILE}"
                '''
            }
        }


        // ============================================================
        // 8. BUILD APPLICATION DOCKER IMAGE
        // ============================================================

        stage('Build App Docker Image') {

            steps {

                echo '============================================'
                echo 'Building Application Docker Image'
                echo '============================================'

                sh '''
                    docker build \
                    -t ${APP_IMAGE}:${IMAGE_TAG} \
                    -f Dockerfile .
                '''

                sh '''
                    docker images | grep ${APP_IMAGE}
                '''
            }
        }


        // ============================================================
        // 9. BUILD DATABASE DOCKER IMAGE
        // ============================================================

        stage('Build DB Docker Image') {

            steps {

                echo '============================================'
                echo 'Building Database Docker Image'
                echo '============================================'

                sh '''
                    docker build \
                    -t ${DB_IMAGE}:${IMAGE_TAG} \
                    -f Dockerfile.db .
                '''

                sh '''
                    docker images | grep ${DB_IMAGE}
                '''
            }
        }


        // ============================================================
        // 10. TRIVY - APPLICATION IMAGE
        // ============================================================

        stage('Trivy Scan - Application') {

            steps {

                echo '============================================'
                echo 'Scanning Application Docker Image'
                echo '============================================'

                sh '''
                    trivy image \
                    --severity HIGH,CRITICAL \
                    --exit-code 1 \
                    --ignore-unfixed \
                    ${APP_IMAGE}:${IMAGE_TAG}
                '''
            }
        }


        // ============================================================
        // 11. TRIVY - DATABASE IMAGE
        // ============================================================

        stage('Trivy Scan - Database') {

            steps {

                echo '============================================'
                echo 'Scanning Database Docker Image'
                echo '============================================'

                sh '''
                    trivy image \
                    --severity HIGH,CRITICAL \
                    --exit-code 1 \
                    --ignore-unfixed \
                    ${DB_IMAGE}:${IMAGE_TAG}
                '''
            }
        }


        // ============================================================
        // 12. DOCKER COMPOSE DEPLOYMENT
        // ============================================================

        stage('Docker Compose Deploy') {

            steps {

                echo '============================================'
                echo 'Deploying using Docker Compose'
                echo '============================================'

                sh '''
                    export IMAGE_TAG=${IMAGE_TAG}

                    docker compose down || true

                    docker compose up -d
                '''
            }
        }


        // ============================================================
        // 13. VERIFY DEPLOYMENT
        // ============================================================

        stage('Verify Deployment') {

            steps {

                echo '============================================'
                echo 'Verifying deployment'
                echo '============================================'

                sh '''
                    docker compose ps
                '''

                sh '''
                    docker ps
                '''

                sh '''
                    sleep 10

                    curl -f http://localhost:8081/health
                '''
            }
        }
    }


    // ================================================================
    // POST BUILD
    // ================================================================

    post {

        success {

            echo '''
            ============================================
                 PIPELINE EXECUTION SUCCESSFUL
            ============================================

            Application:
            movie-ticket-booking

            Build:
            ${BUILD_NUMBER}

            App Image:
            movie-ticket-booking:${BUILD_NUMBER}

            DB Image:
            movie-ticket-db:${BUILD_NUMBER}

            Application:
            http://<SERVER-IP>:8081

            ============================================
            '''
        }


        failure {

            echo '''
            ============================================
                    PIPELINE EXECUTION FAILED
            ============================================

            Check the Jenkins console output.

            ============================================
            '''
        }


        always {

            archiveArtifacts(
                artifacts: '*.war',
                allowEmptyArchive: true
            )

            junit(
                testResults: 'target/surefire-reports/*.xml',
                allowEmptyResults: true
            )
        }
    }
}

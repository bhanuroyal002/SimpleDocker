pipeline {
    agent any

    environment {
        APP_NAME = 'movie-ticket-booking'
        APP_IMAGE = 'movie-ticket-booking'
        DB_IMAGE = 'movie-ticket-db'
        GIT_REPO = 'https://github.com/bhanuroyal002/SimpleDocker.git'
        GIT_BRANCH = 'main'
        MAVEN_HOME = tool('Maven-3.9')
        PATH = "${MAVEN_HOME}/bin:${env.PATH}"
        SONARQUBE_SERVER = 'SonarQube'
    }

    stages {
        stage('Pull Code') {
            steps {
                checkout scmGit(
                    branches: [[name: "*/${GIT_BRANCH}"]],
                    userRemoteConfigs: [[
                        url: "${GIT_REPO}",
                        credentialsId: 'github-credentials'
                    ]]
                )
            }
        }

        stage('Maven Build & Test') {
            steps {
                sh '''
                    mvn clean package
                    echo "WAR artifact:"
                    ls -lh target/*.war
                    echo "JaCoCo coverage report:"
                    ls -lh target/site/jacoco/jacoco.xml
                '''
            }
        }

        stage('Code Quality Analysis') {
            steps {
                withSonarQubeEnv("${SONARQUBE_SERVER}") {
                    sh '''
                        mvn sonar:sonar \
                          -Dsonar.projectKey=movie-ticket-booking \
                          -Dsonar.projectName=Movie-Ticket-Booking
                    '''
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 2, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Build App Docker Image') {
            steps {
                sh '''
                    docker build --pull -t "${APP_IMAGE}:${BUILD_NUMBER}" -f Dockerfile .
                '''
            }
        }

        stage('Build DB Docker Image') {
            steps {
                sh '''
                    docker build --pull -t "${DB_IMAGE}:${BUILD_NUMBER}" -f Dockerfile.db .
                '''
            }
        }

        stage('Trivy Scan - App') {
            steps {
                sh '''
                    TMPDIR=/var/lib/trivy-tmp trivy image \
                      --cache-dir /var/lib/trivy \
                      --scanners vuln \
                      --severity HIGH,CRITICAL \
                      --ignore-unfixed \
                      --exit-code 0 \
                      "${APP_IMAGE}:${BUILD_NUMBER}"
                '''
            }
        }

        stage('Trivy Scan - DB') {
            steps {
                sh '''
                    TMPDIR=/var/lib/trivy-tmp trivy image \
                      --cache-dir /var/lib/trivy \
                      --scanners vuln \
                      --severity HIGH,CRITICAL \
                      --ignore-unfixed \
                      --exit-code 0 \
                      "${DB_IMAGE}:${BUILD_NUMBER}"
                '''
            }
        }

        stage('Docker Compose Deploy') {
            steps {
                sh '''
                    IMAGE_TAG="${BUILD_NUMBER}" docker compose down || true
                    IMAGE_TAG="${BUILD_NUMBER}" docker compose up -d
                '''
            }
        }

        stage('Verify Deployment') {
            steps {
                sh '''
                    echo "Deployment status:"
                    IMAGE_TAG="${BUILD_NUMBER}" docker compose ps

                    echo "Waiting for application health endpoint..."
                    for i in $(seq 1 12); do
                        if curl -fsS http://localhost:8081/api/health; then
                            echo
                            echo "Application is healthy."
                            exit 0
                        fi
                        echo "Waiting for application... attempt ${i}/12"
                        sleep 5
                    done

                    echo "Application health check failed."
                    IMAGE_TAG="${BUILD_NUMBER}" docker compose ps
                    IMAGE_TAG="${BUILD_NUMBER}" docker compose logs --tail=100 app
                    IMAGE_TAG="${BUILD_NUMBER}" docker compose logs --tail=100 db
                    exit 1
                '''
            }
        }
    }

    post {
        always {
            junit testResults: 'target/surefire-reports/*.xml', allowEmptyResults: true
        }
        success {
            archiveArtifacts artifacts: 'target/*.war', allowEmptyArchive: true
            echo "Pipeline completed successfully. Build: ${BUILD_NUMBER}"
        }
        failure {
            echo 'Pipeline failed. Check the Jenkins console log.'
        }
    }
}

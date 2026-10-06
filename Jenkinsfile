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
        ARTIFACTORY_URL = 'http://YOUR_ARTIFACTORY_HOST:8081/artifactory'
        ARTIFACTORY_REPO = 'maven-releases'
        ARTIFACTORY_CREDENTIALS = credentials('artifactory-credentials')
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

        stage('Maven Build') {
            steps {
                sh 'mvn clean package'
                sh 'ls -lh target/*.war'
            }
        }

        stage('Code Quality Analysis') {
            steps {
                withSonarQubeEnv("${SONARQUBE_SERVER}") {
                    sh '''
                        mvn sonar:sonar                           -Dsonar.projectKey=movie-ticket-booking                           -Dsonar.projectName=Movie-Ticket-Booking
                    '''
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Prepare WAR') {
            steps {
                sh '''
                    set -e
                    WAR_SOURCE=$(find target -maxdepth 1 -type f -name "*.war" ! -name "*.original" | head -1)
                    test -n "$WAR_SOURCE"
                    cp "$WAR_SOURCE" "$WORKSPACE/movie-ticket-booking.war"
                    ls -lh "$WORKSPACE/movie-ticket-booking.war"
                '''
            }
        }

        stage('Upload WAR to Artifactory') {
            steps {
                sh '''
                    set -e
                    curl -f                       -u "$ARTIFACTORY_CREDENTIALS_USR:$ARTIFACTORY_CREDENTIALS_PSW"                       -T "$WORKSPACE/movie-ticket-booking.war"                       "$ARTIFACTORY_URL/$ARTIFACTORY_REPO/$APP_NAME/${BUILD_NUMBER}/movie-ticket-booking.war"
                '''
            }
        }

        stage('Download WAR from Artifactory') {
            steps {
                sh '''
                    set -e
                    rm -f "$WORKSPACE/movie-ticket-booking.war"
                    curl -f                       -u "$ARTIFACTORY_CREDENTIALS_USR:$ARTIFACTORY_CREDENTIALS_PSW"                       -o "$WORKSPACE/movie-ticket-booking.war"                       "$ARTIFACTORY_URL/$ARTIFACTORY_REPO/$APP_NAME/${BUILD_NUMBER}/movie-ticket-booking.war"
                    ls -lh "$WORKSPACE/movie-ticket-booking.war"
                '''
            }
        }

        stage('Build App Docker Image') {
            steps {
                sh 'docker build --pull -t "${APP_IMAGE}:${BUILD_NUMBER}" -f Dockerfile .'
            }
        }

        stage('Build DB Docker Image') {
            steps {
                sh 'docker build --pull -t "${DB_IMAGE}:${BUILD_NUMBER}" -f Dockerfile.db .'
            }
        }

        stage('Trivy Scan - App') {
            steps {
                sh '''
                    trivy image                       --severity HIGH,CRITICAL                       --ignore-unfixed                       --exit-code 1                       "${APP_IMAGE}:${BUILD_NUMBER}"
                '''
            }
        }

        stage('Trivy Scan - DB') {
            steps {
                sh '''
                    trivy image                       --severity HIGH,CRITICAL                       --ignore-unfixed                       --exit-code 1                       "${DB_IMAGE}:${BUILD_NUMBER}"
                '''
            }
        }

        stage('Docker Compose Deploy') {
            steps {
                sh '''
                    export IMAGE_TAG="${BUILD_NUMBER}"
                    docker compose down || true
                    docker compose up -d
                '''
            }
        }

        stage('Verify Deployment') {
            steps {
                sh '''
                    docker compose ps
                    for i in $(seq 1 12); do
                        if curl -fsS http://localhost:8081/health; then
                            echo
                            echo "Application is healthy."
                            exit 0
                        fi
                        echo "Waiting for application..."
                        sleep 5
                    done
                    docker compose logs --tail=100 app
                    exit 1
                '''
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: 'movie-ticket-booking.war', allowEmptyArchive: true
            junit testResults: 'target/surefire-reports/*.xml', allowEmptyResults: true
        }
        success {
            echo "Pipeline completed successfully. Build: ${BUILD_NUMBER}"
        }
        failure {
            echo 'Pipeline failed. Check the Jenkins console log.'
        }
    }
}

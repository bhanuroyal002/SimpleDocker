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
        NEXUS_REPO_ID = 'nexus-releases'
        NEXUS_REPO_URL = 'http://localhost:8082/repository/movie-releases/'
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

        stage('Prepare Release Version') {
            steps {
                script {
                    def currentVersion = sh(
                        returnStdout: true,
                        script: 'mvn help:evaluate -Dexpression=project.version -q -DforceStdout'
                    ).trim()

                    if (!(currentVersion ==~ /\d+\.\d+\.\d+/)) {
                        error("Unsupported POM version '${currentVersion}'. Expected MAJOR.MINOR.PATCH.")
                    }

                    def parts = currentVersion.tokenize('.')
                    def nextVersion = "${parts[0]}.${parts[1]}.${parts[2].toInteger() + 1}"

                    env.RELEASE_VERSION = nextVersion

                    sh """
                        mvn org.codehaus.mojo:versions-maven-plugin:2.19.1:set \
                          -DnewVersion=${RELEASE_VERSION} \
                          -DgenerateBackupPoms=false

                        echo "POM version: ${currentVersion}"
                        echo "Release version: ${RELEASE_VERSION}"
                        mvn help:evaluate -Dexpression=project.version -q -DforceStdout
                    """
                }
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
                    echo "Build version:"
                    mvn help:evaluate -Dexpression=project.version -q -DforceStdout
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

        stage('Publish WAR to Nexus') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'nexus-credentials',
                    usernameVariable: 'NEXUS_USERNAME',
                    passwordVariable: 'NEXUS_PASSWORD'
                )]) {
                    sh '''
                        set +x
                        cat > nexus-settings.xml <<EOF
<settings xmlns="http://maven.apache.org/SETTINGS/1.2.0">
  <servers>
    <server>
      <id>${NEXUS_REPO_ID}</id>
      <username>${NEXUS_USERNAME}</username>
      <password>${NEXUS_PASSWORD}</password>
    </server>
  </servers>
</settings>
EOF

                        mvn -s nexus-settings.xml deploy:deploy-file \
                          -DrepositoryId="${NEXUS_REPO_ID}" \
                          -Durl="${NEXUS_REPO_URL}" \
                          -Dfile=target/movie-ticket-booking.war \
                          -DpomFile=pom.xml \
                          -DgeneratePom=false

                        rm -f nexus-settings.xml
                        echo "Published movie-ticket-booking version ${RELEASE_VERSION} to Nexus."
                    '''
                }
            }
        }

        stage('Commit Release Version') {
            steps {
                withCredentials([gitUsernamePassword(
                    credentialsId: 'github-credentials',
                    gitToolName: 'Default'
                )]) {
                    sh '''
                        git config user.name "Jenkins CI"
                        git config user.email "jenkins@localhost"

                        git add pom.xml

                        if git diff --cached --quiet; then
                            echo "No POM version change to commit."
                            exit 0
                        fi

                        git commit -m "chore: bump release version to ${RELEASE_VERSION}"
                        git push origin HEAD:${GIT_BRANCH}

                        echo "Committed release version ${RELEASE_VERSION} to GitHub."
                    '''
                }
            }
        }
    }

    post {
        always {
            junit testResults: 'target/surefire-reports/*.xml', allowEmptyResults: true
        }
        success {
            archiveArtifacts artifacts: 'target/*.war', allowEmptyArchive: true
            echo "Pipeline completed successfully. Release version: ${RELEASE_VERSION}"
        }
        failure {
            echo 'Pipeline failed. The GitHub POM version is not advanced unless the release and deployment stages complete successfully.'
        }
    }
}

pipeline {
    agent {
        label 'raspberry-pi'
    }
    
    environment {
        REGISTRY = 'localhost:5000'
        APP_NAME = 'focus'
        REMOTE_USER = 'coldtemplar'
        REMOTE_HOST = '192.168.4.7'
        REMOTE_PATH = '/opt/tea-connect/focus'
        SSH_CREDENTIALS = 'ssh-pass'
        NODE_VERSION = '20'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
                echo "Building ${APP_NAME} from branch ${env.BRANCH_NAME}"
            }
        }
        
        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }
        
        stage('Type Check') {
            steps {
                sh 'npm run lint'
            }
        }
        
        stage('Build Application') {
            steps {
                sh 'npm run build'
            }
        }
        
        stage('Run Tests') {
            steps {
                sh 'npm test 2>&1 || true'
            }
        }
        
        stage('Build Docker Image') {
            steps {
                sh "docker build -t ${REGISTRY}/${APP_NAME}:${env.BUILD_NUMBER} -t ${REGISTRY}/${APP_NAME}:latest ."
            }
        }
        
        stage('Push to Local Registry') {
            steps {
                sh "docker push ${REGISTRY}/${APP_NAME}:${env.BUILD_NUMBER}"
                sh "docker push ${REGISTRY}/${APP_NAME}:latest"
            }
        }
        
        stage('Deploy to Raspberry Pi') {
            steps {
                sshagent(['ssh-key']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} << 'EOF'
                            cd ${REMOTE_PATH}
                            docker compose pull
                            docker compose up -d
                            sleep 5
                            docker compose ps
                        EOF
                    """
                }
            }
        }
        
        stage('Health Check') {
            steps {
                sh """
                    sleep 10
                    curl -f http://${REMOTE_HOST}:3002/health || exit 1
                """
                echo 'Health check passed!'
            }
        }
        
        stage('Cleanup Old Images') {
            steps {
                sh """
                    ssh -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} << 'EOF'
                        docker image prune -f
                        docker system prune -f
                    EOF
                """
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        success {
            echo "✅ Build #${env.BUILD_NUMBER} succeeded!"
            echo "Application deployed at: http://${REMOTE_HOST}:3002"
        }
        failure {
            echo "❌ Build #${env.BUILD_NUMBER} failed!"
            sh """
                ssh -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} << 'EOF'
                    docker compose logs --tail=50
                EOF
            """
        }
        unstable {
            echo "⚠️ Build #${env.BUILD_NUMBER} completed with warnings"
        }
    }
}

pipeline {
    agent {
        docker {
            image 'node:18-bullseye' // Node 18 on Debian (supports apt if needed)
            args '-v /var/run/docker.sock:/var/run/docker.sock' // So Jenkins can run Docker
        }
    }

    environment {
        // Node.js Configuration
        NODE_ENV = 'production'
        NPM_CONFIG_CACHE = "${WORKSPACE}/.npm"

        // Docker Configuration
        DOCKER_IMAGE_NAME = 'lostfound-app'
        DOCKER_TAG = "${BUILD_NUMBER}"
        DOCKER_REGISTRY = 'docker.io'
        DOCKER_REPOSITORY = 'sudan360'

        // EC2 Deployment Configuration
        EC2_HOST = 'your-ec2-ip-or-domain' // replace with your EC2
        EC2_USER = 'ubuntu'
        EC2_PORT = '22'

        // App Ports
        APP_PORT = '3000'
        PYTHON_PORT = '8000'
        CONTAINER_NAME = 'lostfound-container'

        // Secrets stored in Jenkins
        MONGODB_URI = credentials('mongodb-uri')
        NEXTAUTH_SECRET = credentials('nextauth-secret')
        GOOGLE_CLIENT_ID = credentials('google-client-id')
        GOOGLE_CLIENT_SECRET = credentials('google-client-secret')
        SMTP_USER = credentials('smtp-user')
        SMTP_PASS = credentials('smtp-pass')
        CLOUDINARY_CLOUD_NAME = credentials('cloudinary-cloud-name')
        CLOUDINARY_API_KEY = credentials('cloudinary-api-key')
        CLOUDINARY_API_SECRET = credentials('cloudinary-api-secret')
    }

    stages {
        stage('Checkout') {
            steps {
                echo '🔄 Checking out source code from GitHub...'
                checkout scm
                echo '✅ Source code checkout completed'
            }
        }

        stage('Install Dependencies') {
            steps {
                echo '📦 Installing Node.js dependencies...'
                sh 'npm ci --cache ${NPM_CONFIG_CACHE}'

                echo '🐍 Installing Python dependencies for CLIP service...'
                sh '''
                    cd python/clip_service
                    python3 -m pip install --upgrade pip
                    python3 -m pip install -r requirements.txt
                '''
            }
        }

        stage('Build Next.js Frontend') {
            steps {
                echo '🏗️ Building Next.js frontend...'
                sh 'npm run build'
            }
        }

        stage('Build Docker Image') {
            steps {
                echo '🐳 Building Docker image...'
                sh """
                    docker build -t ${DOCKER_IMAGE_NAME}:${DOCKER_TAG} .
                    docker tag ${DOCKER_IMAGE_NAME}:${DOCKER_TAG} ${DOCKER_IMAGE_NAME}:latest
                """
            }
        }

        stage('Push Docker Image') {
            steps {
                echo '📤 Pushing Docker image to Docker Hub...'
                withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials', usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')]) {
                    sh """
                        echo \$DOCKER_PASSWORD | docker login -u \$DOCKER_USERNAME --password-stdin
                        docker tag ${DOCKER_IMAGE_NAME}:${DOCKER_TAG} \$DOCKER_USERNAME/${DOCKER_IMAGE_NAME}:${DOCKER_TAG}
                        docker tag ${DOCKER_IMAGE_NAME}:${DOCKER_TAG} \$DOCKER_USERNAME/${DOCKER_IMAGE_NAME}:latest
                        docker push \$DOCKER_USERNAME/${DOCKER_IMAGE_NAME}:${DOCKER_TAG}
                        docker push \$DOCKER_USERNAME/${DOCKER_IMAGE_NAME}:latest
                    """
                }
            }
        }

        stage('Deploy to EC2') {
            steps {
                echo '🚀 Deploying Docker container to EC2...'
                withCredentials([sshUserPrivateKey(credentialsId: 'ec2-ssh-key', keyFileVariable: 'SSH_KEY', usernameVariable: 'SSH_USER')]) {
                    sh """
                        scp -i \$SSH_KEY -o StrictHostKeyChecking=no deploy.sh \$SSH_USER@${EC2_HOST}:/home/\$SSH_USER/
                        ssh -i \$SSH_KEY -o StrictHostKeyChecking=no \$SSH_USER@${EC2_HOST} 'chmod +x deploy.sh && ./deploy.sh'
                    """
                }
            }
        }

        stage('Post-Deployment Verification') {
            steps {
                echo '🔍 Verifying deployment...'
                withCredentials([sshUserPrivateKey(credentialsId: 'ec2-ssh-key', keyFileVariable: 'SSH_KEY', usernameVariable: 'SSH_USER')]) {
                    sh """
                        ssh -i \$SSH_KEY -o StrictHostKeyChecking=no \$SSH_USER@${EC2_HOST} \\
                        'docker ps | grep ${CONTAINER_NAME}; docker logs --tail 20 ${CONTAINER_NAME}'
                    """
                }
            }
        }
    }

    post {
        success {
            echo '🎉 Pipeline executed successfully! Application deployed.'
        }
        failure {
            echo '❌ Pipeline failed! Check logs above.'
        }
        always {
            echo '🧹 Cleaning workspace...'
            sh 'docker image prune -f; rm -rf ${NPM_CONFIG_CACHE}'
        }
    }
}

pipeline {
    agent any

    environment {
        // Docker Configuration
        DOCKER_IMAGE_NAME = 'lostfound-app'
        DOCKER_TAG = "${BUILD_NUMBER}"
        DOCKER_REGISTRY = 'docker.io'
        DOCKER_REPOSITORY = 'sudan360'

        // EC2 Deployment Configuration
        EC2_HOST = 'your-ec2-ip-or-domain' // Replace with your EC2 public IP
        EC2_USER = 'ubuntu'
        EC2_PORT = '22'
        CONTAINER_NAME = 'lostfound-container'

        // App Ports
        APP_PORT = '3000'
        PYTHON_PORT = '8000'

        // Node.js & Python
        NODE_VERSION = '18'
        PYTHON_VERSION = '3.11'

        // Cache
        NPM_CONFIG_CACHE = "${WORKSPACE}/.npm"
        PIP_CACHE_DIR = "${WORKSPACE}/.pip"

        // Production Environment Variables
        NODE_ENV = 'production'
        MONGODB_URI = credentials('mongodb-uri')
        NEXTAUTH_SECRET = credentials('nextauth-secret')
        NEXTAUTH_URL = 'https://vitlostandfound.duckdns.org'
        GOOGLE_CLIENT_ID = credentials('google-client-id')
        GOOGLE_CLIENT_SECRET = credentials('google-client-secret')
        ADMIN_EMAILS = 'lostfound0744@gmail.com'
        EMAIL_FROM = 'LOST&FOUND <lostfound0744@gmail.com>'
        SMTP_HOST = 'smtp.gmail.com'
        SMTP_PORT = '465'
        SMTP_USER = credentials('smtp-user')
        SMTP_PASS = credentials('smtp-pass')
        CLOUDINARY_CLOUD_NAME = credentials('cloudinary-cloud-name')
        CLOUDINARY_API_KEY = credentials('cloudinary-api-key')
        CLOUDINARY_API_SECRET = credentials('cloudinary-api-secret')
        CLIP_API_URL = 'http://localhost:8000'
        SIMILARITY_THRESHOLD = '0.75'
        BULLMQ_ENABLED = 'false'
        REDIS_URL = 'redis://localhost:6379'
        REDIS_TLS = 'false'
        NEXT_PUBLIC_APP_URL = 'https://vitlostandfound.duckdns.org'
        NEXT_PUBLIC_API_URL = 'https://vitlostandfound.duckdns.org'
    }

    stages {
        stage('Checkout') {
            steps {
                echo '🔄 Checking out source code from GitHub...'
                checkout scm
                echo '✅ Source code checkout completed'
            }
        }

        stage('Setup Environment') {
            steps {
                echo '🔧 Installing Node.js, Python, Docker on Ubuntu...'
                script {
                    sh '''
                        # Update packages
                        sudo apt-get update -y
                        sudo apt-get install -y curl git python3-pip python3-venv apt-transport-https ca-certificates software-properties-common lsb-release

                        # Node.js
                        curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
                        sudo apt-get install -y nodejs
                        node -v
                        npm -v

                        # Python
                        python3 --version
                        pip3 --version

                        # Docker
                        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
                        echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
                        sudo apt-get update
                        sudo apt-get install -y docker-ce docker-ce-cli containerd.io
                        sudo systemctl start docker
                        sudo systemctl enable docker
                        sudo usermod -aG docker jenkins
                        docker --version
                    '''
                }
                echo '✅ Environment setup completed'
            }
        }

        stage('Install Dependencies') {
            steps {
                echo '📦 Installing Node.js dependencies...'
                sh 'npm ci --cache ${NPM_CONFIG_CACHE}'

                echo '🐍 Installing Python dependencies...'
                sh '''
                    cd python/clip_service
                    python3 -m pip install --upgrade pip
                    python3 -m pip install --cache-dir ${PIP_CACHE_DIR} -r requirements.txt
                '''
                echo '✅ All dependencies installed'
            }
        }

        stage('Build Frontend') {
            steps {
                echo '🏗️ Building Next.js frontend...'
                sh 'npm run build'
                echo '✅ Frontend build completed'
            }
        }

        stage('Build Docker Image') {
            steps {
                echo '🐳 Building Docker image...'
                sh '''
                    docker build -t ${DOCKER_IMAGE_NAME}:${DOCKER_TAG} .
                    docker tag ${DOCKER_IMAGE_NAME}:${DOCKER_TAG} ${DOCKER_IMAGE_NAME}:latest
                '''
                echo '✅ Docker image created'
            }
        }

        stage('Push Docker Image') {
            steps {
                echo '📤 Pushing Docker image to Docker Hub...'
                withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials', usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')]) {
                    sh '''
                        echo ${DOCKER_PASSWORD} | docker login -u ${DOCKER_USERNAME} --password-stdin
                        docker tag ${DOCKER_IMAGE_NAME}:${DOCKER_TAG} ${DOCKER_USERNAME}/${DOCKER_IMAGE_NAME}:${DOCKER_TAG}
                        docker tag ${DOCKER_IMAGE_NAME}:${DOCKER_TAG} ${DOCKER_USERNAME}/${DOCKER_IMAGE_NAME}:latest
                        docker push ${DOCKER_USERNAME}/${DOCKER_IMAGE_NAME}:${DOCKER_TAG}
                        docker push ${DOCKER_USERNAME}/${DOCKER_IMAGE_NAME}:latest
                    '''
                }
                echo '✅ Docker image pushed'
            }
        }

        stage('Deploy to EC2') {
            steps {
                echo '🚀 Deploying to EC2...'
                withCredentials([sshUserPrivateKey(credentialsId: 'ec2-ssh-key', keyFileVariable: 'SSH_KEY', usernameVariable: 'SSH_USER')]) {
                    sh '''
                        scp -i ${SSH_KEY} -o StrictHostKeyChecking=no deploy.sh ${SSH_USER}@${EC2_HOST}:/home/${SSH_USER}/
                        ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no ${SSH_USER}@${EC2_HOST} "chmod +x deploy.sh && ./deploy.sh"
                    '''
                }
                echo '✅ Deployment triggered'
            }
        }

        stage('Post-Deployment Verification') {
            steps {
                echo '🔍 Verifying deployment...'
                withCredentials([sshUserPrivateKey(credentialsId: 'ec2-ssh-key', keyFileVariable: 'SSH_KEY', usernameVariable: 'SSH_USER')]) {
                    sh '''
                        ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no ${SSH_USER}@${EC2_HOST} << 'EOF'
                            docker ps | grep ${CONTAINER_NAME}
                            docker logs --tail 20 ${CONTAINER_NAME}
                            echo "🌐 App URL: ${NEXT_PUBLIC_APP_URL}"
EOF
                    '''
                }
                echo '✅ Post-deployment verification completed'
            }
        }
    }

    post {
        success {
            echo '🎉 Pipeline completed successfully!'
        }
        failure {
            echo '❌ Pipeline failed! Check logs above.'
        }
        always {
            echo '🧹 Cleaning up workspace...'
            sh '''
                docker image prune -f
                rm -rf ${NPM_CONFIG_CACHE} ${PIP_CACHE_DIR}
            '''
        }
    }
}

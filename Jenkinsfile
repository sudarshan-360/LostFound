pipeline {
    agent any

    environment {
        // 🔐 Credentials
        DOCKERHUB = credentials('dockerhub-credentials')
        GITHUB_PAT = credentials('github-pat')

        // 🌐 App environment variables
        MONGODB_URI = credentials('mongodb-uri')
        NEXTAUTH_SECRET = credentials('nextauth-secret')
        GOOGLE_CLIENT_ID = credentials('google-client-id')
        GOOGLE_CLIENT_SECRET = credentials('google-client-secret')
        SMTP_USER = credentials('smtp-user')
        SMTP_PASS = credentials('smtp-pass')
        CLOUDINARY_CLOUD_NAME = credentials('cloudinary-cloud-name')
        CLOUDINARY_API_KEY = credentials('cloudinary-api-key')
        CLOUDINARY_API_SECRET = credentials('cloudinary-api-secret')
        NEXTAUTH_URL = credentials('nextauth-url')

        // 🐳 Docker Config
        IMAGE_NAME = "sudan360/lostfound-app"
        CONTAINER_NAME = "lostfound"
        FRONTEND_PORT = "3000"
        BACKEND_PORT = "8000"
    }

    stages {

        stage('Checkout Code') {
            steps {
                echo "🔄 Checking out GitHub repository..."
                git branch: 'master', credentialsId: 'github-pat', url: 'https://github.com/sudarshan-360/LostFound.git'
            }
        }

        stage('Build Docker Image') {
            steps {
                echo "🏗️ Building Docker image..."
                sh "docker build -t $IMAGE_NAME:latest ."
            }
        }

        stage('Push to DockerHub') {
            steps {
                echo "📦 Pushing image to DockerHub..."
                sh """
                echo $DOCKERHUB_PSW | docker login -u $DOCKERHUB_USR --password-stdin
                docker push $IMAGE_NAME:latest
                """
            }
        }

        stage('Deploy on EC2') {
            steps {
                echo "🚀 Deploying container on EC2..."
                sh """
                docker rm -f $CONTAINER_NAME || true
                docker run -d -p ${FRONTEND_PORT}:3000 -p ${BACKEND_PORT}:8000 --name ${CONTAINER_NAME} \
                -e MONGODB_URI='${MONGODB_URI}' \
                -e NEXTAUTH_SECRET='${NEXTAUTH_SECRET}' \
                -e GOOGLE_CLIENT_ID='${GOOGLE_CLIENT_ID}' \
                -e GOOGLE_CLIENT_SECRET='${GOOGLE_CLIENT_SECRET}' \
                -e SMTP_USER='${SMTP_USER}' \
                -e SMTP_PASS='${SMTP_PASS}' \
                -e CLOUDINARY_CLOUD_NAME='${CLOUDINARY_CLOUD_NAME}' \
                -e CLOUDINARY_API_KEY='${CLOUDINARY_API_KEY}' \
                -e CLOUDINARY_API_SECRET='${CLOUDINARY_API_SECRET}' \
                -e NEXTAUTH_URL='${NEXTAUTH_URL}' \
                ${IMAGE_NAME}:latest
                """
            }
        }

        stage('Cleanup Old Images') {
            steps {
                echo "🧹 Cleaning up old Docker images..."
                sh "docker image prune -af || true"
            }
        }

        stage('Verify Deployment') {
            steps {
                echo "🔍 Checking app health..."
                sh """
                curl -I http://localhost:${FRONTEND_PORT} || true
                curl -I http://localhost:${BACKEND_PORT} || true
                """
            }
        }
    }

    post {
        success {
            echo "✅ Deployment successful on EC2 (Ports 3000 & 8000 live)"
        }
        failure {
            echo "❌ Pipeline failed — check logs above"
        }
        always {
            cleanWs()
        }
    }
}

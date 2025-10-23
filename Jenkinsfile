pipeline {
    agent any
    
    environment {
        // Node.js Configuration
        NODE_VERSION = '18'
        NPM_CONFIG_CACHE = "${WORKSPACE}/.npm"
        
        // Python Configuration
        PYTHON_VERSION = '3.11'
        PIP_CACHE_DIR = "${WORKSPACE}/.pip"
        
        // Docker Configuration
        DOCKER_IMAGE_NAME = 'lostfound-app'
        DOCKER_TAG = "${BUILD_NUMBER}"
        DOCKER_REGISTRY = 'docker.io'
        DOCKER_REPOSITORY = 'your-dockerhub-username' // Change this to your Docker Hub username
        
        // EC2 Deployment Configuration
        EC2_HOST = 'your-ec2-ip-or-domain' // Change this to your EC2 instance IP or domain
        EC2_USER = 'ubuntu'
        EC2_PORT = '22'
        
        // Application Configuration
        APP_PORT = '3000'
        PYTHON_PORT = '8000'
        CONTAINER_NAME = 'lostfound-container'
        
        // Environment Variables for Production
        NODE_ENV = 'production'
        MONGODB_URI = credentials('mongodb-uri') // Store in Jenkins Credentials
        NEXTAUTH_SECRET = credentials('nextauth-secret') // Store in Jenkins Credentials
        NEXTAUTH_URL = 'https://vitlostandfound.duckdns.org'
        GOOGLE_CLIENT_ID = credentials('google-client-id') // Store in Jenkins Credentials
        GOOGLE_CLIENT_SECRET = credentials('google-client-secret') // Store in Jenkins Credentials
        ADMIN_EMAILS = 'lostfound0744@gmail.com'
        EMAIL_FROM = 'LOST&FOUND <lostfound0744@gmail.com>'
        SMTP_HOST = 'smtp.gmail.com'
        SMTP_PORT = '465'
        SMTP_USER = credentials('smtp-user') // Store in Jenkins Credentials
        SMTP_PASS = credentials('smtp-pass') // Store in Jenkins Credentials
        CLOUDINARY_CLOUD_NAME = credentials('cloudinary-cloud-name') // Store in Jenkins Credentials
        CLOUDINARY_API_KEY = credentials('cloudinary-api-key') // Store in Jenkins Credentials
        CLOUDINARY_API_SECRET = credentials('cloudinary-api-secret') // Store in Jenkins Credentials
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
                echo '🔧 Setting up Node.js and Python environment...'
                
                script {
                    // Install Node.js
                    sh '''
                        echo "📦 Installing Node.js ${NODE_VERSION}..."
                        curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
                        sudo apt-get install -y nodejs
                        node --version
                        npm --version
                    '''
                    
                    // Install Python
                    sh '''
                        echo "🐍 Installing Python ${PYTHON_VERSION}..."
                        sudo apt-get update
                        sudo apt-get install -y python${PYTHON_VERSION} python${PYTHON_VERSION}-pip python${PYTHON_VERSION}-venv
                        python${PYTHON_VERSION} --version
                        pip${PYTHON_VERSION} --version
                    '''
                    
                    // Install Docker
                    sh '''
                        echo "🐳 Installing Docker..."
                        sudo apt-get update
                        sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
                        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
                        sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
                        sudo apt-get update
                        sudo apt-get install -y docker-ce
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
                sh '''
                    npm ci --cache ${NPM_CONFIG_CACHE}
                    echo "✅ Node.js dependencies installed"
                '''
                
                echo '🐍 Installing Python dependencies...'
                sh '''
                    cd python/clip_service
                    python3 -m pip install --cache-dir ${PIP_CACHE_DIR} -r requirements.txt
                    echo "✅ Python dependencies installed"
                '''
                
                echo '✅ All dependencies installed successfully'
            }
        }
        
        stage('Build Next.js Frontend') {
            steps {
                echo '🏗️ Building Next.js frontend...'
                sh '''
                    echo "Building Next.js application..."
                    npm run build
                    echo "✅ Next.js build completed"
                '''
                echo '✅ Frontend build completed'
            }
        }
        
        stage('Create Docker Image') {
            steps {
                echo '🐳 Creating Docker image with embedded Dockerfile...'
                
                script {
                    // Create Dockerfile inline
                    writeFile file: 'Dockerfile', text: '''# ===============================
# Multi-stage Dockerfile
# Next.js + Python CLIP service
# Production-ready container
# ===============================

# Stage 1: Build Next.js app
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build Next.js app
ENV NODE_ENV=production
RUN npm run build

# Stage 2: Production runtime
FROM python:3.11-slim AS runner

WORKDIR /app

# Install system dependencies & Node.js
RUN apt-get update && apt-get install -y curl gcc g++ && \\
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \\
    apt-get install -y nodejs && \\
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd --system --gid 1001 nextjs && \\
    useradd --system --uid 1001 --gid nextjs --home /home/nextjs --create-home nextjs

# Copy Node.js production dependencies
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built Next.js app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/server.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/app ./app
COPY --from=builder /app/components ./components
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/models ./models
COPY --from=builder /app/hooks ./hooks
COPY --from=builder /app/workers ./workers
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/postcss.config.mjs ./
COPY --from=builder /app/tailwind.config.js ./

# Copy Python service and install dependencies
COPY python/clip_service/requirements.txt ./python/clip_service/requirements.txt
RUN pip install --no-cache-dir -r python/clip_service/requirements.txt
COPY python/ ./python/

# Environment variables (set sensitive values at runtime)
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV PYTHON_PORT=8000
ENV HF_HOME=/app/.cache
ENV TRANSFORMERS_CACHE=/app/.cache
ENV HF_DATASETS_CACHE=/app/.cache

# Create cache directory
RUN mkdir -p /app/.cache && chown -R nextjs:nextjs /app /home/nextjs

# Switch to non-root user
USER nextjs

# Expose ports
EXPOSE 3000 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD node --version && python3 --version

# Start both services
CMD ["sh", "-c", "python3 -m uvicorn python.clip_service.main:app --host 0.0.0.0 --port 8000 & node server.js"]
'''
                    
                    // Create production environment file
                    writeFile file: '.env.production', text: """# Database - MongoDB Atlas
MONGODB_URI=${MONGODB_URI}

# NextAuth.js
NEXTAUTH_URL=${NEXTAUTH_URL}
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}

# Google OAuth
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}

# Admin emails
ADMIN_EMAILS=${ADMIN_EMAILS}

# Email configuration
EMAIL_FROM=${EMAIL_FROM}
SMTP_HOST=${SMTP_HOST}
SMTP_PORT=${SMTP_PORT}
SMTP_USER=${SMTP_USER}
SMTP_PASS=${SMTP_PASS}

# Cloudinary
CLOUDINARY_CLOUD_NAME=${CLOUDINARY_CLOUD_NAME}
CLOUDINARY_API_KEY=${CLOUDINARY_API_KEY}
CLOUDINARY_API_SECRET=${CLOUDINARY_API_SECRET}

# CLIP Matching System
CLIP_API_URL=${CLIP_API_URL}
SIMILARITY_THRESHOLD=${SIMILARITY_THRESHOLD}
BULLMQ_ENABLED=${BULLMQ_ENABLED}

# Redis
REDIS_URL=${REDIS_URL}
REDIS_TLS=${REDIS_TLS}

# App URLs
NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
"""
                }
                
                echo '🏗️ Building Docker image...'
                sh '''
                    echo "Building Docker image: ${DOCKER_IMAGE_NAME}:${DOCKER_TAG}"
                    docker build -t ${DOCKER_IMAGE_NAME}:${DOCKER_TAG} .
                    docker tag ${DOCKER_IMAGE_NAME}:${DOCKER_TAG} ${DOCKER_IMAGE_NAME}:latest
                    echo "✅ Docker image built successfully"
                '''
                
                echo '✅ Docker image creation completed'
            }
        }
        
        stage('Push to Docker Hub') {
            steps {
                echo '📤 Pushing Docker image to Docker Hub...'
                script {
                    withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials', usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')]) {
                        sh '''
                            echo "Logging into Docker Hub..."
                            echo ${DOCKER_PASSWORD} | docker login -u ${DOCKER_USERNAME} --password-stdin
                            
                            echo "Tagging image for Docker Hub..."
                            docker tag ${DOCKER_IMAGE_NAME}:${DOCKER_TAG} ${DOCKER_USERNAME}/${DOCKER_IMAGE_NAME}:${DOCKER_TAG}
                            docker tag ${DOCKER_IMAGE_NAME}:${DOCKER_TAG} ${DOCKER_USERNAME}/${DOCKER_IMAGE_NAME}:latest
                            
                            echo "Pushing image to Docker Hub..."
                            docker push ${DOCKER_USERNAME}/${DOCKER_IMAGE_NAME}:${DOCKER_TAG}
                            docker push ${DOCKER_USERNAME}/${DOCKER_IMAGE_NAME}:latest
                            
                            echo "✅ Docker image pushed successfully"
                        '''
                    }
                }
                echo '✅ Docker Hub push completed'
            }
        }
        
        stage('Deploy to EC2') {
            steps {
                echo '🚀 Deploying to EC2 instance...'
                script {
                    withCredentials([sshUserPrivateKey(credentialsId: 'ec2-ssh-key', keyFileVariable: 'SSH_KEY', usernameVariable: 'SSH_USER')]) {
                        sh '''
                            echo "Connecting to EC2 instance: ${EC2_HOST}"
                            
                            # Create deployment script
                            cat > deploy.sh << 'DEPLOYEOF'
#!/bin/bash
set -e

echo "🔄 Starting deployment on EC2..."

# Login to Docker Hub
echo "📤 Logging into Docker Hub..."
echo ${DOCKER_PASSWORD} | docker login -u ${DOCKER_USERNAME} --password-stdin

# Stop and remove existing container
echo "🛑 Stopping existing container..."
docker stop ${CONTAINER_NAME} 2>/dev/null || true
docker rm ${CONTAINER_NAME} 2>/dev/null || true

# Remove old image to save space
echo "🗑️ Cleaning up old images..."
docker image prune -f

# Pull latest image
echo "📥 Pulling latest Docker image..."
docker pull ${DOCKER_USERNAME}/${DOCKER_IMAGE_NAME}:latest

# Create production environment file on EC2
echo "🔧 Creating production environment file..."
cat > .env.production << 'ENVEOF'
# Database - MongoDB Atlas
MONGODB_URI=${MONGODB_URI}

# NextAuth.js
NEXTAUTH_URL=${NEXTAUTH_URL}
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}

# Google OAuth
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}

# Admin emails
ADMIN_EMAILS=${ADMIN_EMAILS}

# Email configuration
EMAIL_FROM=${EMAIL_FROM}
SMTP_HOST=${SMTP_HOST}
SMTP_PORT=${SMTP_PORT}
SMTP_USER=${SMTP_USER}
SMTP_PASS=${SMTP_PASS}

# Cloudinary
CLOUDINARY_CLOUD_NAME=${CLOUDINARY_CLOUD_NAME}
CLOUDINARY_API_KEY=${CLOUDINARY_API_KEY}
CLOUDINARY_API_SECRET=${CLOUDINARY_API_SECRET}

# CLIP Matching System
CLIP_API_URL=${CLIP_API_URL}
SIMILARITY_THRESHOLD=${SIMILARITY_THRESHOLD}
BULLMQ_ENABLED=${BULLMQ_ENABLED}

# Redis
REDIS_URL=${REDIS_URL}
REDIS_TLS=${REDIS_TLS}

# App URLs
NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENVEOF

# Run new container
echo "🚀 Starting new container..."
docker run -d \\
  --name ${CONTAINER_NAME} \\
  --env-file .env.production \\
  -p ${APP_PORT}:3000 \\
  -p ${PYTHON_PORT}:8000 \\
  --restart unless-stopped \\
  ${DOCKER_USERNAME}/${DOCKER_IMAGE_NAME}:latest

# Wait for container to start
echo "⏳ Waiting for container to start..."
sleep 10

# Check container status
echo "📊 Container status:"
docker ps

# Health check
echo "🏥 Performing health check..."
if docker exec ${CONTAINER_NAME} node --version > /dev/null 2>&1; then
    echo "✅ Node.js service is running"
else
    echo "❌ Node.js service failed"
    exit 1
fi

if docker exec ${CONTAINER_NAME} python3 --version > /dev/null 2>&1; then
    echo "✅ Python service is running"
else
    echo "❌ Python service failed"
    exit 1
fi

echo "🎉 Deployment completed successfully!"
echo "🌐 Application is available at: ${NEXT_PUBLIC_APP_URL}"
DEPLOYEOF

                            # Copy deployment script to EC2
                            scp -i ${SSH_KEY} -o StrictHostKeyChecking=no deploy.sh ${SSH_USER}@${EC2_HOST}:/home/${SSH_USER}/
                            
                            # Execute deployment on EC2
                            ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no ${SSH_USER}@${EC2_HOST} << 'SSHEOF'
                                cd /home/ubuntu
                                chmod +x deploy.sh
                                export DOCKER_USERNAME=${DOCKER_USERNAME}
                                export DOCKER_PASSWORD=${DOCKER_PASSWORD}
                                export DOCKER_IMAGE_NAME=${DOCKER_IMAGE_NAME}
                                export CONTAINER_NAME=${CONTAINER_NAME}
                                export APP_PORT=${APP_PORT}
                                export PYTHON_PORT=${PYTHON_PORT}
                                export MONGODB_URI=${MONGODB_URI}
                                export NEXTAUTH_URL=${NEXTAUTH_URL}
                                export NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
                                export GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
                                export GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
                                export ADMIN_EMAILS=${ADMIN_EMAILS}
                                export EMAIL_FROM=${EMAIL_FROM}
                                export SMTP_HOST=${SMTP_HOST}
                                export SMTP_PORT=${SMTP_PORT}
                                export SMTP_USER=${SMTP_USER}
                                export SMTP_PASS=${SMTP_PASS}
                                export CLOUDINARY_CLOUD_NAME=${CLOUDINARY_CLOUD_NAME}
                                export CLOUDINARY_API_KEY=${CLOUDINARY_API_KEY}
                                export CLOUDINARY_API_SECRET=${CLOUDINARY_API_SECRET}
                                export CLIP_API_URL=${CLIP_API_URL}
                                export SIMILARITY_THRESHOLD=${SIMILARITY_THRESHOLD}
                                export BULLMQ_ENABLED=${BULLMQ_ENABLED}
                                export REDIS_URL=${REDIS_URL}
                                export REDIS_TLS=${REDIS_TLS}
                                export NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
                                export NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
                                ./deploy.sh
SSHEOF
                        '''
                    }
                }
                echo '✅ EC2 deployment completed'
            }
        }
        
        stage('Post-Deployment Verification') {
            steps {
                echo '🔍 Verifying deployment...'
                script {
                    withCredentials([sshUserPrivateKey(credentialsId: 'ec2-ssh-key', keyFileVariable: 'SSH_KEY', usernameVariable: 'SSH_USER')]) {
                        sh '''
                            echo "🔍 Performing post-deployment verification..."
                            
                            # Check if container is running
                            ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no ${SSH_USER}@${EC2_HOST} << 'SSHEOF'
                                echo "📊 Container status:"
                                docker ps | grep ${CONTAINER_NAME}
                                
                                echo "📋 Container logs (last 20 lines):"
                                docker logs --tail 20 ${CONTAINER_NAME}
                                
                                echo "🏥 Health check:"
                                if docker exec ${CONTAINER_NAME} node --version > /dev/null 2>&1; then
                                    echo "✅ Node.js service: OK"
                                else
                                    echo "❌ Node.js service: FAILED"
                                fi
                                
                                if docker exec ${CONTAINER_NAME} python3 --version > /dev/null 2>&1; then
                                    echo "✅ Python service: OK"
                                else
                                    echo "❌ Python service: FAILED"
                                fi
                                
                                echo "🌐 Application URL: ${NEXT_PUBLIC_APP_URL}"
SSHEOF
                        '''
                    }
                }
                echo '✅ Post-deployment verification completed'
            }
        }
    }
    
    post {
        success {
            echo '🎉 Pipeline executed successfully!'
            echo '✅ Application deployed to EC2'
            echo '🌐 Application URL: https://vitlostandfound.duckdns.org'
            echo '📊 Docker Image: ${DOCKER_REGISTRY}/${DOCKER_REPOSITORY}/${DOCKER_IMAGE_NAME}:${DOCKER_TAG}'
        }
        
        failure {
            echo '❌ Pipeline failed!'
            echo '🔍 Check the logs above for error details'
            echo '🛠️ Common issues:'
            echo '  - Docker Hub authentication'
            echo '  - EC2 SSH connection'
            echo '  - MongoDB Atlas network access'
            echo '  - Google OAuth redirect URIs'
        }
        
        always {
            echo '🧹 Cleaning up workspace...'
            sh '''
                echo "Cleaning up Docker images..."
                docker image prune -f
                echo "Cleaning up npm cache..."
                rm -rf ${NPM_CONFIG_CACHE}
                echo "Cleaning up pip cache..."
                rm -rf ${PIP_CACHE_DIR}
                echo "✅ Cleanup completed"
            '''
        }
    }
}

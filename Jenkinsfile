pipeline {
    agent any

    environment {
        NODE_IMAGE = 'node:18-bullseye'
    }

    stages {
        stage('Checkout') {
            steps {
                echo "🔄 Checking out source code from GitHub..."
                checkout([$class: 'GitSCM',
                          branches: [[name: '*/master']],
                          userRemoteConfigs: [[url: 'https://github.com/sudarshan-360/LostFound.git']]])
                echo "✅ Source code checkout completed"
            }
        }

        stage('Install Dependencies') {
            steps {
                echo "📦 Installing Node.js dependencies..."
                sh '''
                    docker run --rm -v $PWD:/app -w /app $NODE_IMAGE \
                    sh -c "npm ci --cache /app/.npm"
                '''
            }
        }

        stage('Build Next.js Frontend') {
            steps {
                echo "🏗️ Building Next.js frontend..."
                withCredentials([
                    string(credentialsId: 'mongodb-uri', variable: 'MONGODB_URI'),
                    string(credentialsId: 'nextauth-url', variable: 'NEXTAUTH_URL'),
                    string(credentialsId: 'nextauth-secret', variable: 'NEXTAUTH_SECRET'),
                    string(credentialsId: 'cloudinary-cloud-name', variable: 'CLOUDINARY_CLOUD_NAME'),
                    string(credentialsId: 'cloudinary-api-key', variable: 'CLOUDINARY_API_KEY'),
                    string(credentialsId: 'cloudinary-api-secret', variable: 'CLOUDINARY_API_SECRET')
                ]) {
                    sh '''
                        docker run --rm -v $PWD:/app -w /app $NODE_IMAGE \
                        sh -c "npm run build"
                    '''
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                echo "🐳 Building Docker image..."
                withCredentials([
                    string(credentialsId: 'mongodb-uri', variable: 'MONGODB_URI'),
                    string(credentialsId: 'nextauth-url', variable: 'NEXTAUTH_URL'),
                    string(credentialsId: 'nextauth-secret', variable: 'NEXTAUTH_SECRET'),
                    string(credentialsId: 'google-client-id', variable: 'GOOGLE_CLIENT_ID'),
                    string(credentialsId: 'google-client-secret', variable: 'GOOGLE_CLIENT_SECRET'),
                    string(credentialsId: 'smtp-user', variable: 'SMTP_USER'),
                    string(credentialsId: 'smtp-pass', variable: 'SMTP_PASS'),
                    string(credentialsId: 'cloudinary-cloud-name', variable: 'CLOUDINARY_CLOUD_NAME'),
                    string(credentialsId: 'cloudinary-api-key', variable: 'CLOUDINARY_API_KEY'),
                    string(credentialsId: 'cloudinary-api-secret', variable: 'CLOUDINARY_API_SECRET')
                ]) {
                    sh '''
                        docker build --build-arg MONGODB_URI=$MONGODB_URI \
                                     --build-arg NEXTAUTH_URL=$NEXTAUTH_URL \
                                     --build-arg NEXTAUTH_SECRET=$NEXTAUTH_SECRET \
                                     --build-arg GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID \
                                     --build-arg GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET \
                                     --build-arg SMTP_USER=$SMTP_USER \
                                     --build-arg SMTP_PASS=$SMTP_PASS \
                                     --build-arg CLOUDINARY_CLOUD_NAME=$CLOUDINARY_CLOUD_NAME \
                                     --build-arg CLOUDINARY_API_KEY=$CLOUDINARY_API_KEY \
                                     --build-arg CLOUDINARY_API_SECRET=$CLOUDINARY_API_SECRET \
                                     -t lostfound-app .
                    '''
                }
            }
        }

        stage('Push Docker Image') {
            steps {
                echo "📤 Pushing Docker image to Docker Hub..."
                withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh '''
                        docker tag lostfound-app sudan360/lostfound-app:latest
                        echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin
                        docker push sudan360/lostfound-app:latest
                    '''
                }
            }
        }

        stage('Deploy to EC2') {
            steps {
                echo "🚀 Deploying Docker container to EC2..."
                withCredentials([sshUserPrivateKey(credentialsId: 'ec2-ssh-key', keyFileVariable: 'EC2_KEY', usernameVariable: 'EC2_USER')]) {
                    sh """
                        ssh -i $EC2_KEY $EC2_USER@3.110.45.140 \\
                        "docker pull sudan360/lostfound-app:latest && \\
                         docker stop lostfound || true && \\
                         docker rm lostfound || true && \\
                         docker run -d -p 3000:3000 --name lostfound \\
                         -e MONGODB_URI='$MONGODB_URI' \\
                         -e NEXTAUTH_URL='$NEXTAUTH_URL' \\
                         -e NEXTAUTH_SECRET='$NEXTAUTH_SECRET' \\
                         -e GOOGLE_CLIENT_ID='$GOOGLE_CLIENT_ID' \\
                         -e GOOGLE_CLIENT_SECRET='$GOOGLE_CLIENT_SECRET' \\
                         -e SMTP_USER='$SMTP_USER' \\
                         -e SMTP_PASS='$SMTP_PASS' \\
                         -e CLOUDINARY_CLOUD_NAME='$CLOUDINARY_CLOUD_NAME' \\
                         -e CLOUDINARY_API_KEY='$CLOUDINARY_API_KEY' \\
                         -e CLOUDINARY_API_SECRET='$CLOUDINARY_API_SECRET' \\
                         lostfound-app:latest"
                    """
                }
            }
        }

        stage('Post-Deployment Verification') {
            steps {
                echo "🔍 Verifying deployment..."
                sh 'curl -I http://3.110.45.140:3000'
            }
        }
    }

    post {
        always {
            echo "🧹 Cleaning workspace..."
            sh 'docker image prune -f'
            cleanWs()
        }

        success {
            echo "✅ Pipeline completed successfully!"
        }

        failure {
            echo "❌ Pipeline failed! Check logs above."
        }
    }
}

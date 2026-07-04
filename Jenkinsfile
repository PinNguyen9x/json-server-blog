pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
    timeout(time: 20, unit: 'MINUTES')
  }

  environment {
    // Jenkins (launchd) có PATH tối giản, không thấy /usr/local/bin nơi có docker
    PATH        = "/usr/local/bin:/opt/homebrew/bin:$PATH"
    IMAGE_NAME  = 'json-server-blog'
    IMAGE_TAG   = "${env.BUILD_NUMBER}"
    VPS_HOST    = 'pin@149.28.18.204'
    DEPLOY_DIR  = '/opt/json-server-blog'
  }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Build image (amd64)') {
      steps {
        // Mac arm64 -> VPS amd64: BẮT BUỘC --platform linux/amd64
        sh '''
          docker build \
            --platform linux/amd64 \
            -t $IMAGE_NAME:$IMAGE_TAG \
            -t $IMAGE_NAME:latest .
        '''
      }
    }

    stage('Ship image to VPS') {
      steps {
        sshagent(credentials: ['vps-ssh']) {
          sh '''
            docker save $IMAGE_NAME:$IMAGE_TAG | gzip | \
              ssh -o StrictHostKeyChecking=no $VPS_HOST "gunzip | docker load"
          '''
        }
      }
    }

    stage('Deploy') {
      steps {
        sshagent(credentials: ['vps-ssh']) {
          sh '''
            ssh -o StrictHostKeyChecking=no $VPS_HOST "mkdir -p $DEPLOY_DIR"
            scp -o StrictHostKeyChecking=no docker-compose.yml $VPS_HOST:$DEPLOY_DIR/docker-compose.yml
            # Chỉ copy db.json nếu VPS chưa có (tránh đè mất dữ liệu runtime)
            ssh -o StrictHostKeyChecking=no $VPS_HOST "test -f $DEPLOY_DIR/db.json" || \
              scp -o StrictHostKeyChecking=no db.json $VPS_HOST:$DEPLOY_DIR/db.json

            ssh -o StrictHostKeyChecking=no $VPS_HOST "\
              cd $DEPLOY_DIR && \
              IMAGE=$IMAGE_NAME:$IMAGE_TAG \
              docker compose up -d --remove-orphans && \
              docker image prune -f"
          '''
        }
      }
    }
  }

  post {
    success { echo "✅ Backend deploy thành công #${IMAGE_TAG} -> http://149.28.18.204:4000" }
    failure { echo "❌ Backend build/deploy thất bại — xem log stage lỗi" }
  }
}

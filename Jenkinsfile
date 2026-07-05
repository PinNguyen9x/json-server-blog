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
    // Image trên GitHub Container Registry — path BẮT BUỘC lowercase
    IMAGE       = 'ghcr.io/pinnguyen9x/json-server-blog'
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
            --provenance=false \
            -t $IMAGE:$IMAGE_TAG .
        '''
      }
    }

    stage('Push to ghcr') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'ghcr-creds', usernameVariable: 'GHCR_USER', passwordVariable: 'GHCR_PAT')]) {
          sh '''
            # DOCKER_CONFIG riêng, không dùng osxkeychain -> login ghi token thẳng vào file
            # (tránh 401 anonymous token của Docker Desktop macOS khi push lên ghcr)
            export DOCKER_CONFIG="$WORKSPACE/.docker-ci"
            mkdir -p "$DOCKER_CONFIG"
            printf '{}' > "$DOCKER_CONFIG/config.json"
            echo "$GHCR_PAT" | docker login ghcr.io -u "$GHCR_USER" --password-stdin
            n=0; until docker push $IMAGE:$IMAGE_TAG; do n=$((n+1)); [ $n -ge 3 ] && exit 1; echo "push fail, retry $n..."; sleep 5; done
            docker logout ghcr.io
          '''
        }
        sh '''
          docker images $IMAGE --format '{{.Repository}}:{{.Tag}}' \
            | xargs -r docker rmi -f || true
        '''
      }
    }

    stage('Approve deploy to PROD') {
      steps {
        timeout(time: 30, unit: 'MINUTES') {
          input message: "Đã build & push ghcr #${env.BUILD_NUMBER}. Deploy backend lên PROD?", ok: 'Deploy ngay'
        }
      }
    }

    stage('Deploy') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'ghcr-creds', usernameVariable: 'GHCR_USER', passwordVariable: 'GHCR_PAT')]) {
          sshagent(credentials: ['vps-ssh']) {
            sh '''
              ssh -o StrictHostKeyChecking=no $VPS_HOST "mkdir -p $DEPLOY_DIR"
              scp -o StrictHostKeyChecking=no docker-compose.yml $VPS_HOST:$DEPLOY_DIR/docker-compose.yml
              # Chỉ copy db.json nếu VPS chưa có (tránh đè mất dữ liệu runtime)
              ssh -o StrictHostKeyChecking=no $VPS_HOST "test -f $DEPLOY_DIR/db.json" || \
                scp -o StrictHostKeyChecking=no db.json $VPS_HOST:$DEPLOY_DIR/db.json

              ssh -o StrictHostKeyChecking=no $VPS_HOST "\
                echo '$GHCR_PAT' | docker login ghcr.io -u '$GHCR_USER' --password-stdin; \
                docker network create webnet 2>/dev/null || true; \
                export IMAGE=$IMAGE:$IMAGE_TAG; \
                cd $DEPLOY_DIR && \
                docker compose pull && \
                docker compose up -d --remove-orphans && \
                docker image prune -af"
            '''
          }
        }
      }
    }
  }

  post {
    success { echo "✅ Backend deploy thành công #${IMAGE_TAG}" }
    failure { echo "❌ Backend build/deploy thất bại — xem log stage lỗi" }
  }
}

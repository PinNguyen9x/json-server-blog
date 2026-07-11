pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
    timeout(time: 20, unit: 'MINUTES')
  }

  environment {
    PATH     = "/usr/local/bin:/opt/homebrew/bin:$PATH"
    IMAGE    = 'ghcr.io/pinnguyen9x/json-server-blog'
    VPS_HOST = 'pin@149.28.18.204'
  }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Init env') {
      steps {
        script {
          def br = (env.GIT_BRANCH ?: '').replaceAll('^origin/', '')
          if (br == 'develop') {
            env.DEPLOY_ENV = 'staging'
            env.DEPLOY_DIR = '/opt/json-server-blog-staging'
            env.CONTAINER  = 'json-server-blog-staging'
          } else {
            env.DEPLOY_ENV = 'prod'
            env.DEPLOY_DIR = '/opt/json-server-blog'
            env.CONTAINER  = 'json-server-blog'
          }
          env.IMAGE_TAG = "${env.DEPLOY_ENV}-${env.BUILD_NUMBER}"
          echo "🌱 Môi trường=${env.DEPLOY_ENV} | branch=${br} | tag=${env.IMAGE_TAG}"
        }
      }
    }

    stage('Build & push (amd64) to ghcr') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'ghcr-creds', usernameVariable: 'GHCR_USER', passwordVariable: 'GHCR_PAT')]) {
          sh '''
            # Build TRƯỚC (dùng buildx mặc định qua DOCKER_CONFIG gốc -> hỗ trợ --provenance)
            docker build \
              --platform linux/amd64 \
              --provenance=false \
              -t $IMAGE:$IMAGE_TAG .
            # Login + push với DOCKER_CONFIG riêng (không osxkeychain) -> tránh 401 khi push ghcr
            export DOCKER_CONFIG="$WORKSPACE/.docker-ci"
            mkdir -p "$DOCKER_CONFIG"; printf '{}' > "$DOCKER_CONFIG/config.json"
            echo "$GHCR_PAT" | docker login ghcr.io -u "$GHCR_USER" --password-stdin
            n=0; until docker push $IMAGE:$IMAGE_TAG; do n=$((n+1)); [ $n -ge 3 ] && exit 1; echo "push fail, retry $n..."; sleep 5; done
            docker logout ghcr.io
          '''
        }
        sh 'docker images $IMAGE --format "{{.Repository}}:{{.Tag}}" | grep ":$IMAGE_TAG$" | xargs -r docker rmi -f || true'
      }
    }

    stage('Approve deploy to PROD') {
      when { environment name: 'DEPLOY_ENV', value: 'prod' }
      steps {
        timeout(time: 30, unit: 'MINUTES') {
          input message: "Đã build & push ${env.IMAGE_TAG}. Deploy backend lên PROD?", ok: 'Deploy ngay'
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
              # Chỉ copy db.json nếu môi trường đó chưa có (tránh đè dữ liệu runtime)
              ssh -o StrictHostKeyChecking=no $VPS_HOST "test -f $DEPLOY_DIR/db.json" || \
                scp -o StrictHostKeyChecking=no db.json $VPS_HOST:$DEPLOY_DIR/db.json

              ssh -o StrictHostKeyChecking=no $VPS_HOST "\
                echo '$GHCR_PAT' | docker login ghcr.io -u '$GHCR_USER' --password-stdin; \
                docker network create webnet 2>/dev/null || true; \
                export IMAGE=$IMAGE:$IMAGE_TAG CONTAINER=$CONTAINER; \
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
    success { echo "✅ [${env.DEPLOY_ENV}] backend deploy ${env.IMAGE_TAG} OK" }
    failure { echo "❌ [${env.DEPLOY_ENV}] backend build/deploy thất bại" }
  }
}

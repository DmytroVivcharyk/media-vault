pipeline {
    // Run on any available agent (your Jenkins server)
    agent any

    // Tools section — equivalent to setting up the runner environment
    // This makes `node` and `npm` available in all stages
    tools {
        nodejs 'Node-22'  // Must match the name you set in Step 2
    }

    // Optional: set build timeout and other options
    options {
        timeout(time: 15, unit: 'MINUTES')  // Kill build if it takes too long
        timestamps()                         // Add timestamps to console output
    }

    environment {
        // Non-sensitive: plain values inlined here
        AWS_REGION      = 'us-east-1'
        AWS_S3_BUCKET   = 'media-vault'
        AWS_S3_ENDPOINT = 'http://localhost:9000'

        AWS_REGION_JENKINS    = 'us-east-1'
        AWS_S3_BUCKET_JENKINS = 'media-vault-artifacts'


        // Add these via: Manage Jenkins → Credentials → (global) → Add Credentials → Secret text
        AWS_ACCESS_KEY_ID     = credentials('AWS_ACCESS_KEY_ID')
        AWS_SECRET_ACCESS_KEY = credentials('AWS_SECRET_ACCESS_KEY')
    }

    stages {
        // ─── STAGE 1: CHECKOUT ─────────────────────────────────────
        // Equivalent to: actions/checkout@v5
        // Jenkins does this automatically when configured with SCM,
        // but we add it explicitly for clarity
        stage('Checkout') {
            steps {
                // Cleans workspace before checkout (prevents stale files)
                cleanWs()
                checkout scm
            }
        }

        // ─── STAGE 2: INSTALL DEPENDENCIES ─────────────────────────
        // Equivalent to: npm install
        stage('Install Dependencies') {
            steps {
                echo 'Installing npm dependencies...'
                sh 'node --version'   // Log versions for debugging
                sh 'npm --version'
                sh 'npm install'
            }
        }

        // ─── STAGE 3: TEST (Prettier + ESLint + TypeScript) ────────
        // Equivalent to: the "test" job in GitHub Actions
        // All checks run in parallel within this stage for speed
        stage('Test') {
            parallel {
                stage('Prettier') {
                    steps {
                        echo 'Checking code formatting with Prettier...'
                        sh 'npm run format'
                    }
                }
                stage('ESLint') {
                    steps {
                        echo 'Checking for ESLint errors...'
                        sh 'npm run es-lint-check'
                    }
                }
                stage('TypeScript') {
                    steps {
                        echo 'Checking for TypeScript errors...'
                        sh 'npm run type-check'
                    }
                }
            }
        }

        // ─── STAGE 4: BUILD ────────────────────────────────────────
        // Equivalent to: the "build" job in GitHub Actions
        // Only runs if the Test stage passes (Jenkins handles this
        // automatically — stages are sequential by default)
        stage('Build') {
            steps {
                echo 'Building the application...'
                sh 'npm run build'
            }
        }

        // ─── NEW STAGE: Upload Artifact to S3 ────────────────────────
        stage('Upload Artifact to S3') {
            steps {
                echo 'Archiving build output...'
                sh 'tar -czf build-artifact.tar.gz .next'

                echo 'Uploading artifact to S3...'
                sh """
                    aws s3 cp build-artifact.tar.gz \
                        s3://${AWS_S3_BUCKET_JENKINS}/artifacts/build-${BUILD_NUMBER}.tar.gz \
                        --region ${AWS_REGION_JENKINS}
                """

                echo "Artifact uploaded: s3://${AWS_S3_BUCKET}/artifacts/build-${BUILD_NUMBER}.tar.gz"
            }
        }
    }

    // ─── POST-BUILD ACTIONS ────────────────────────────────────────
    // Runs after all stages, regardless of success/failure
    post {
        success {
            echo '✅ Pipeline completed successfully!'
        }
        failure {
            echo '❌ Pipeline failed. Check the stage logs above.'
        }
        always {
            // Clean workspace after build to free disk space
            cleanWs()
        }
    }
}
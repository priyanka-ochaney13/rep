// src/aws-config.js
export default {
  aws_project_region: import.meta.env.VITE_AWS_REGION ,
  aws_cognito_region: import.meta.env.VITE_AWS_REGION ,
  aws_user_pools_id: import.meta.env.VITE_USER_POOL_ID ,
  aws_user_pools_web_client_id: import.meta.env.VITE_USER_POOL_CLIENT_ID
}


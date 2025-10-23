"""
Quick script to test AWS credentials and DynamoDB connectivity.
Run this to verify your AWS setup is working correctly.
"""

import boto3
from botocore.exceptions import ClientError, NoCredentialsError, PartialCredentialsError
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_aws_credentials():
    """Test if AWS credentials are configured correctly"""
    print("=" * 60)
    print("🔐 Testing AWS Credentials")
    print("=" * 60)
    
    # Check if credentials are in environment
    print("\n1. Checking environment variables...")
    aws_access_key = os.environ.get('AWS_ACCESS_KEY_ID')
    aws_secret_key = os.environ.get('AWS_SECRET_ACCESS_KEY')
    aws_region = os.environ.get('AWS_DEFAULT_REGION', 'us-east-1')
    
    if aws_access_key:
        print(f"   ✓ AWS_ACCESS_KEY_ID: {aws_access_key[:8]}...")
    else:
        print("   ✗ AWS_ACCESS_KEY_ID: Not found")
    
    if aws_secret_key:
        print(f"   ✓ AWS_SECRET_ACCESS_KEY: {aws_secret_key[:8]}...")
    else:
        print("   ✗ AWS_SECRET_ACCESS_KEY: Not found")
    
    print(f"   ✓ AWS_DEFAULT_REGION: {aws_region}")
    
    # Test STS (Security Token Service) - verifies credentials
    print("\n2. Testing credentials with AWS STS...")
    try:
        sts = boto3.client('sts', region_name=aws_region)
        identity = sts.get_caller_identity()
        
        print("   ✅ Credentials are VALID!")
        print(f"   Account ID: {identity['Account']}")
        print(f"   User ARN: {identity['Arn']}")
        print(f"   User ID: {identity['UserId']}")
        
    except NoCredentialsError:
        print("   ❌ No credentials found!")
        print("   Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY")
        return False
    except PartialCredentialsError:
        print("   ❌ Incomplete credentials!")
        print("   Both AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are required")
        return False
    except ClientError as e:
        print(f"   ❌ AWS Error: {e}")
        return False
    except Exception as e:
        print(f"   ❌ Unexpected error: {e}")
        return False
    
    # Test DynamoDB access
    print("\n3. Testing DynamoDB access...")
    try:
        dynamodb = boto3.resource('dynamodb', region_name=aws_region)
        
        # List tables
        tables = list(dynamodb.tables.all())
        print(f"   ✓ Can access DynamoDB")
        print(f"   Found {len(tables)} tables:")
        
        for table in tables:
            print(f"      - {table.name}")
            
        # Check for specific table
        table_name = 'Documentation'
        try:
            table = dynamodb.Table(table_name)
            table.load()
            print(f"\n   ✅ Table '{table_name}' exists!")
            print(f"   Status: {table.table_status}")
            print(f"   Item count: {table.item_count}")
        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceNotFoundException':
                print(f"\n   ⚠️  Table '{table_name}' not found")
                print("   You may need to create it first")
            else:
                raise
                
    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == 'UnrecognizedClientException':
            print("   ❌ Invalid AWS credentials!")
        elif error_code == 'AccessDeniedException':
            print("   ❌ Access denied to DynamoDB!")
            print("   Check IAM permissions for your user")
        else:
            print(f"   ❌ DynamoDB Error: {e}")
        return False
    except Exception as e:
        print(f"   ❌ Unexpected error: {e}")
        return False
    
    # Test Cognito access
    print("\n4. Testing Cognito access...")
    try:
        cognito = boto3.client('cognito-idp', region_name=aws_region)
        
        # Try to list user pools (this will fail if no permissions)
        response = cognito.list_user_pools(MaxResults=10)
        user_pools = response.get('UserPools', [])
        
        print(f"   ✓ Can access Cognito")
        print(f"   Found {len(user_pools)} user pools")
        
        for pool in user_pools:
            print(f"      - {pool['Name']} ({pool['Id']})")
            
    except ClientError as e:
        error_code = e.response['Error']['Code']
        if error_code == 'AccessDeniedException':
            print("   ⚠️  No Cognito access (may not be needed)")
        else:
            print(f"   ⚠️  Cognito Error: {e}")
    except Exception as e:
        print(f"   ⚠️  Unexpected error: {e}")
    
    print("\n" + "=" * 60)
    print("✅ AWS Credentials Test Complete!")
    print("=" * 60)
    return True


def test_dynamodb_operations():
    """Test basic DynamoDB operations"""
    print("\n" + "=" * 60)
    print("🗄️  Testing DynamoDB Operations")
    print("=" * 60)
    
    try:
        from app.utils.dynamodb import test_connection
        
        print("\n1. Testing DynamoDB connection...")
        result = test_connection()
        
        if result:
            print("   ✅ DynamoDB connection successful!")
            print(f"   Response: {result}")
        else:
            print("   ❌ DynamoDB connection failed")
            
    except ImportError:
        print("   ⚠️  Could not import dynamodb module")
        print("   Make sure you're running from backend directory")
    except Exception as e:
        print(f"   ❌ Error: {e}")


if __name__ == "__main__":
    print("\n")
    print("╔════════════════════════════════════════════════════════╗")
    print("║       AWS Credentials & Configuration Test             ║")
    print("╚════════════════════════════════════════════════════════╝")
    print("\n")
    
    # Test credentials
    creds_ok = test_aws_credentials()
    
    # Test DynamoDB operations if credentials are OK
    if creds_ok:
        test_dynamodb_operations()
    
    print("\n")
    print("💡 Tips:")
    print("   - If credentials are missing, add them to .env file")
    print("   - If access denied, check IAM permissions")
    print("   - Region should match where your resources are")
    print("\n")

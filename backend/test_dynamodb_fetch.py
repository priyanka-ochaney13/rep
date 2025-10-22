"""
Quick test to check what's actually in DynamoDB for a user
"""
import os
from dotenv import load_dotenv
from app.utils.dynamodb import get_user_documentation_history

load_dotenv()

# Replace with your actual Cognito user ID (sub claim)
# You can get this from the /user/profile endpoint response
TEST_USER_ID = input("Enter your Cognito User ID (sub): ").strip()

print(f"\n🔍 Checking DynamoDB for user: {TEST_USER_ID}\n")

try:
    history = get_user_documentation_history(TEST_USER_ID, limit=100)
    
    print(f"✅ Found {len(history)} documentation records\n")
    
    if history:
        for i, record in enumerate(history, 1):
            print(f"{i}. Record ID: {record.get('recordId')}")
            print(f"   Repo URL: {record.get('repoUrl')}")
            print(f"   Created: {record.get('createdAt')}")
            print(f"   Has README: {bool(record.get('readmeContent'))}")
            print(f"   Summary Count: {len(record.get('summaries', {}))}")
            print()
    else:
        print("📭 No records found in DynamoDB")
        print("\nPossible reasons:")
        print("1. You haven't generated any documentation yet")
        print("2. Wrong user ID")
        print("3. AWS credentials expired (check Learners Lab)")
        
except Exception as e:
    print(f"❌ Error: {str(e)}")
    print("\nTroubleshooting:")
    print("1. Is AWS Learners Lab session active?")
    print("2. Are credentials in .env file current?")
    print("3. Is DynamoDB table created?")

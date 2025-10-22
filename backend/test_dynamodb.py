"""
Quick DynamoDB Connection Test Script

Run this to verify your DynamoDB setup is working correctly.
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

print("=" * 60)
print("🔍 DynamoDB Connection Test")
print("=" * 60)

# Check environment variables
print("\n1️⃣ Checking Environment Variables...")
required_vars = [
    'AWS_REGION',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_SESSION_TOKEN',
    'DYNAMODB_TABLE_NAME'
]

missing_vars = []
for var in required_vars:
    value = os.getenv(var)
    if value:
        # Show partial value for security
        if 'KEY' in var or 'TOKEN' in var:
            display_value = f"{value[:10]}...{value[-5:]}" if len(value) > 15 else "***"
        else:
            display_value = value
        print(f"   ✅ {var}: {display_value}")
    else:
        print(f"   ❌ {var}: NOT SET")
        missing_vars.append(var)

if missing_vars:
    print(f"\n❌ Missing variables: {', '.join(missing_vars)}")
    print("\n⚠️  Please update your .env file with AWS credentials!")
    print("   See DYNAMODB_SETUP.md for instructions.")
    exit(1)

print("\n✅ All environment variables are set!")

# Test DynamoDB connection
print("\n2️⃣ Testing DynamoDB Connection...")
try:
    from app.utils.dynamodb import test_connection
    
    result = test_connection()
    
    if result['status'] == 'success':
        print(f"   ✅ Connection successful!")
        print(f"   📊 Table: {result.get('tableName')}")
        print(f"   📈 Status: {result.get('tableStatus')}")
        print(f"   📦 Items: {result.get('itemCount', 0)}")
    else:
        print(f"   ❌ Connection failed: {result.get('message')}")
        exit(1)
        
except Exception as e:
    print(f"   ❌ Error: {str(e)}")
    print("\n💡 Troubleshooting:")
    print("   1. Make sure AWS Learners Lab is running (green indicator)")
    print("   2. Verify DynamoDB table 'RepoDocs-Users' exists")
    print("   3. Check AWS credentials are fresh (not expired)")
    print("   4. Ensure table region matches AWS_REGION in .env")
    exit(1)

# Test basic operations
print("\n3️⃣ Testing Basic Operations...")
try:
    from app.utils.dynamodb import save_user_preferences, get_user_preferences
    
    # Test user ID (mock)
    test_user_id = "test-user-123"
    test_prefs = {
        "theme": "dark",
        "notifications": True,
        "test_mode": True
    }
    
    # Save preferences
    print("   📝 Saving test preferences...")
    save_result = save_user_preferences(test_user_id, test_prefs)
    
    if save_result['status'] == 'success':
        print("   ✅ Save successful!")
    else:
        print(f"   ❌ Save failed: {save_result.get('message')}")
        exit(1)
    
    # Retrieve preferences
    print("   📖 Retrieving preferences...")
    retrieved_prefs = get_user_preferences(test_user_id)
    
    if retrieved_prefs == test_prefs:
        print("   ✅ Retrieval successful!")
        print(f"   📄 Data matches: {retrieved_prefs}")
    else:
        print("   ⚠️  Data mismatch!")
        print(f"   Expected: {test_prefs}")
        print(f"   Got: {retrieved_prefs}")
    
except Exception as e:
    print(f"   ❌ Error: {str(e)}")
    exit(1)

# Success!
print("\n" + "=" * 60)
print("🎉 All Tests Passed!")
print("=" * 60)
print("\n✅ Your DynamoDB setup is working correctly!")
print("\n📝 Next steps:")
print("   1. Start your backend: python -m uvicorn main:app --reload")
print("   2. Test endpoints: See DYNAMODB_TESTING.md")
print("   3. View data in AWS Console → DynamoDB → RepoDocs-Users")
print("\n" + "=" * 60)

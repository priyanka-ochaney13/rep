import requests

# Signup
signup_response = requests.post(
    "http://127.0.0.1:8000/auth/signup",
    data={
        "email": "pri.och05@gmail.com",
        "password": "Pri@2005"
    }
)

print("Signup Response:")
print(signup_response.json())
print("\nStatus Code:", signup_response.status_code)

if signup_response.status_code == 200:
    print("\n✅ Signup successful! Check your email for verification code.")
    
    # Now confirm with code from email
    confirmation_code = input("\nEnter the verification code from your email: ")
    
    confirm_response = requests.post(
        "http://127.0.0.1:8000/auth/confirm-signup",
        data={
            "username": "pri.och05@gmail.com",
            "confirmation_code": confirmation_code
        }
    )
    
    print("\nConfirmation Response:")
    print(confirm_response.json())
    
    if confirm_response.status_code == 200:
        print("\n✅ Account confirmed! Now trying to sign in...")
        
        # Sign in
        signin_response = requests.post(
            "http://127.0.0.1:8000/auth/signin",
            data={
                "username": "pri.och05@gmail.com",
                "password": "Pri@2005"
            }
        )
        
        print("\nSignin Response:")
        print(signin_response.json())
        
        if signin_response.status_code == 200:
            access_token = signin_response.json().get("access_token")
            print(f"\n✅ Signed in successfully!")
            print(f"Access Token: {access_token[:50]}...")
            
            # Test protected route
            protected_response = requests.get(
                "http://127.0.0.1:8000/protected",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            print("\nProtected Route Response:")
            print(protected_response.json())
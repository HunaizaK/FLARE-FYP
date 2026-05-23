import requests
import time

BASE_URL = "http://127.0.0.1:8000"

timestamp = int(time.time())

admin_login = {
    "username": "admin",
    "password": "admin123"
}

citizen_signup = {
    "email": f"citizen{timestamp}@test.com",
    "contact_no": "03000000000",
    "username": f"citizen{timestamp}",
    "password": "citizen123",
    "role": "citizen"
}

citizen2_signup = {
    "email": f"citizen2_{timestamp}@test.com",
    "contact_no": "03000000001",
    "username": f"citizen2_{timestamp}",
    "password": "citizen123",
    "role": "citizen"
}

org_signup = {
    "email": f"org{timestamp}@test.com",
    "contact_no": "03111111111",
    "username": f"org{timestamp}",
    "password": "org123",
    "role": "organization"
}


def print_result(title, response):
    print("\n" + "=" * 80)
    print(title)
    print("Status:", response.status_code)
    try:
        print("Response:", response.json())
    except Exception:
        print("Response:", response.text)


def login(username, password):
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={
            "username": username,
            "password": password
        }
    )
    print_result(f"LOGIN: {username}", response)

    if response.status_code == 200:
        return response.json()["access_token"]

    return None


def auth_header(token):
    return {"Authorization": f"Bearer {token}"}


# -----------------------------------------------------
# 1. Login admin
# -----------------------------------------------------
admin_token = login(admin_login["username"], admin_login["password"])

if not admin_token:
    raise Exception("Admin login failed. Stop testing.")


# -----------------------------------------------------
# 2. Signup citizen, second citizen, and organization
# -----------------------------------------------------
r = requests.post(f"{BASE_URL}/auth/signup", json=citizen_signup)
print_result("SIGNUP citizen", r)

r = requests.post(f"{BASE_URL}/auth/signup", json=citizen2_signup)
print_result("SIGNUP citizen 2", r)

r = requests.post(f"{BASE_URL}/auth/signup", json=org_signup)
print_result("SIGNUP organization", r)


# -----------------------------------------------------
# 3. Organization login should fail before approval
# -----------------------------------------------------
org_token_before = login(org_signup["username"], org_signup["password"])

if org_token_before:
    print("ERROR: Organization logged in before approval. Logic is wrong.")
else:
    print("Correct: Organization login blocked before approval.")


# -----------------------------------------------------
# 4. Admin gets pending organizations
# -----------------------------------------------------
r = requests.get(
    f"{BASE_URL}/organizations/pending",
    headers=auth_header(admin_token)
)
print_result("GET pending organizations", r)

pending_orgs = r.json()

if not pending_orgs:
    raise Exception("No pending organizations found. Org signup may not be creating organization row.")

org_id = pending_orgs[0]["id"]


# -----------------------------------------------------
# 5. Admin approves organization
# -----------------------------------------------------
r = requests.put(
    f"{BASE_URL}/organizations/{org_id}/approve",
    headers=auth_header(admin_token)
)
print_result("APPROVE organization", r)


# -----------------------------------------------------
# 6. Organization login should now work
# -----------------------------------------------------
org_token = login(org_signup["username"], org_signup["password"])

if not org_token:
    raise Exception("Organization login failed after approval.")


# -----------------------------------------------------
# 7. Citizen login
# -----------------------------------------------------
citizen_token = login(citizen_signup["username"], citizen_signup["password"])

if not citizen_token:
    raise Exception("Citizen login failed.")


citizen2_token = login(citizen2_signup["username"], citizen2_signup["password"])

if not citizen2_token:
    raise Exception("Citizen 2 login failed.")


# -----------------------------------------------------
# 8. Citizen creates shelter -> should be pending
# -----------------------------------------------------
citizen_shelter = {
    "shelter_name": "Citizen Temporary Shelter",
    "location": "Karachi Block 7",
    "capacity": 50,
    "latitude": 24.8607,
    "longitude": 67.0011
}

r = requests.post(
    f"{BASE_URL}/shelters",
    json=citizen_shelter,
    headers=auth_header(citizen_token)
)
print_result("Citizen creates shelter - should be pending", r)

citizen_shelter_id = r.json()["shelter"]["id"]


# -----------------------------------------------------
# 9. Organization creates shelter -> should be approved
# -----------------------------------------------------
org_shelter = {
    "shelter_name": "Organization Relief Camp",
    "location": "Lahore Main Road",
    "capacity": 200,
    "latitude": 31.5204,
    "longitude": 74.3587
}

r = requests.post(
    f"{BASE_URL}/shelters",
    json=org_shelter,
    headers=auth_header(org_token)
)
print_result("Organization creates shelter - should be approved", r)

org_shelter_id = r.json()["shelter"]["id"]


# -----------------------------------------------------
# 10. Citizen cannot approve shelter
# -----------------------------------------------------
r = requests.put(
    f"{BASE_URL}/shelters/{citizen_shelter_id}/approve",
    headers=auth_header(citizen_token)
)
print_result("Citizen tries to approve shelter - should fail", r)


# -----------------------------------------------------
# 11. Approved organization gets pending shelters
# -----------------------------------------------------
r = requests.get(
    f"{BASE_URL}/shelters/pending",
    headers=auth_header(org_token)
)
print_result("Organization gets pending citizen shelters", r)


# -----------------------------------------------------
# 12. Approved organization approves citizen shelter
# -----------------------------------------------------
r = requests.put(
    f"{BASE_URL}/shelters/{citizen_shelter_id}/approve",
    headers=auth_header(org_token)
)
print_result("Organization approves citizen shelter", r)


# -----------------------------------------------------
# 13. Citizen views shelters -> should see approved shelters
# -----------------------------------------------------
r = requests.get(
    f"{BASE_URL}/shelters",
    headers=auth_header(citizen_token)
)
print_result("Citizen views approved shelters", r)


# -----------------------------------------------------
# 14. Map shelters -> should show only approved shelters with coordinates
# -----------------------------------------------------
r = requests.get(f"{BASE_URL}/shelters/map")
print_result("Map shelters only approved with lat/lng", r)


# -----------------------------------------------------
# 15. Citizen 2 tries to edit org shelter -> should fail
# -----------------------------------------------------
r = requests.put(
    f"{BASE_URL}/shelters/{org_shelter_id}",
    json={
        "capacity": 999
    },
    headers=auth_header(citizen2_token)
)
print_result("Citizen 2 tries to edit organization shelter - should fail", r)


# -----------------------------------------------------
# 16. Organization edits shelter -> should work
# -----------------------------------------------------
r = requests.put(
    f"{BASE_URL}/shelters/{org_shelter_id}",
    json={
        "capacity": 250
    },
    headers=auth_header(org_token)
)
print_result("Organization edits shelter - should work", r)


# -----------------------------------------------------
# 17. Admin views all shelters
# -----------------------------------------------------
r = requests.get(
    f"{BASE_URL}/shelters",
    headers=auth_header(admin_token)
)
print_result("Admin views all shelters", r)


print("\nALL SHELTER TESTS COMPLETED")

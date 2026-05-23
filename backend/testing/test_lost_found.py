import requests
import time

BASE = "http://127.0.0.1:8000"

def login(u,p):
    r = requests.post(f"{BASE}/auth/login",json={"username":u,"password":p})
    return r.json()["access_token"]

def h(t): return {"Authorization":f"Bearer {t}"}

def print_case(title, r):
    print("\n====", title)
    print("Status:", r.status_code)
    try: print("Response:", r.json())
    except: print(r.text)

ts = int(time.time())

# ---------------- ADMIN ----------------
admin = login("admin","admin123")

# ---------------- CREATE USERS ----------------
citizen1 = f"c1_{ts}"
citizen2 = f"c2_{ts}"
orguser = f"org_{ts}"

requests.post(f"{BASE}/auth/signup",json={
    "email":f"{citizen1}@t.com","contact_no":"1",
    "username":citizen1,"password":"123","role":"citizen"
})

requests.post(f"{BASE}/auth/signup",json={
    "email":f"{citizen2}@t.com","contact_no":"1",
    "username":citizen2,"password":"123","role":"citizen"
})

requests.post(f"{BASE}/auth/signup",json={
    "email":f"{orguser}@t.com","contact_no":"1",
    "username":orguser,"password":"123","role":"organization"
})

# ---------------- LOGIN TEST ----------------
r = requests.post(f"{BASE}/auth/login",json={"username":orguser,"password":"123"})
print_case("ORG LOGIN BEFORE APPROVAL (should fail)", r)

# ---------------- APPROVE ORG ----------------
pending = requests.get(f"{BASE}/organizations/pending",headers=h(admin)).json()
org_id = pending[0]["id"]

requests.put(f"{BASE}/organizations/{org_id}/approve",headers=h(admin))

org = login(orguser,"123")
cit1 = login(citizen1,"123")
cit2 = login(citizen2,"123")

# ---------------- CREATE POSTS ----------------
r = requests.post(f"{BASE}/lost-found",json={
    "category":"person","location":"khi","contact":"1",
    "name":"ali","post_type":"lost"
},headers=h(cit1))
print_case("Citizen create → pending", r)
cid_post = r.json()["post"]["id"]

r = requests.post(f"{BASE}/lost-found",json={
    "category":"item","location":"lhr","contact":"2",
    "name":"bag","post_type":"found"
},headers=h(org))
print_case("Org create → approved", r)
org_post = r.json()["post"]["id"]

# ---------------- VIEW TEST ----------------
print_case("Citizen view (only approved)",
    requests.get(f"{BASE}/lost-found",headers=h(cit1)))

print_case("Org view (all)",
    requests.get(f"{BASE}/lost-found",headers=h(org)))

print_case("Admin view (all)",
    requests.get(f"{BASE}/lost-found",headers=h(admin)))

# ---------------- PENDING ----------------
print_case("Citizen pending (should fail)",
    requests.get(f"{BASE}/lost-found/pending",headers=h(cit1)))

print_case("Org pending (citizen only)",
    requests.get(f"{BASE}/lost-found/pending",headers=h(org)))

print_case("Admin pending",
    requests.get(f"{BASE}/lost-found/pending",headers=h(admin)))

# ---------------- APPROVAL ----------------
print_case("Citizen approve (fail)",
    requests.put(f"{BASE}/lost-found/{cid_post}/approve",headers=h(cit1)))

print_case("Org approve citizen post",
    requests.put(f"{BASE}/lost-found/{cid_post}/approve",headers=h(org)))

# ---------------- UPDATE ----------------
print_case("Citizen2 update other's post (fail)",
    requests.put(f"{BASE}/lost-found/{org_post}",
    json={"name":"hack"},headers=h(cit2)))

print_case("Owner update own",
    requests.put(f"{BASE}/lost-found/{cid_post}",
    json={"name":"updated"},headers=h(cit1)))

print_case("Org update any",
    requests.put(f"{BASE}/lost-found/{cid_post}",
    json={"name":"org edit"},headers=h(org)))

# ---------------- DELETE ----------------
print_case("Citizen2 delete other's post (fail)",
    requests.delete(f"{BASE}/lost-found/{cid_post}",headers=h(cit2)))

print_case("Owner delete own",
    requests.delete(f"{BASE}/lost-found/{cid_post}",headers=h(cit1)))

print_case("Admin delete any",
    requests.delete(f"{BASE}/lost-found/{org_post}",headers=h(admin)))

print("\nALL  Lost & Found TESTS DONE")
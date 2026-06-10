# FLARE API — curl Reference

Base URL: `http://localhost:8000`

Replace `{...}` placeholders with real UUIDs. Get a token by calling `/auth/login` first.

```bash
BASE="http://localhost:8000"
TOKEN="<paste your JWT here>"
```

---

## Auth

### POST /auth/signup
Register a new citizen or organization account.
```bash
curl -X POST $BASE/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "contact_no": "03001234567",
    "username": "myuser",
    "password": "pass123",
    "role": "citizen"
  }'
```
> `role` must be `"citizen"` or `"organization"`. Citizens are auto-approved; organizations require admin approval before they can log in.

**Response 201:**
```json
{ "message": "Signup successful", "user_id": "uuid", "role": "citizen", "is_approved": true }
```

---

### POST /auth/login
```bash
curl -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```
**Response 200:**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user_id": "uuid",
  "username": "admin",
  "role": "admin",
  "is_approved": true
}
```

---

### GET /auth/me
Returns the decoded user info from the token.
```bash
curl $BASE/auth/me \
  -H "Authorization: Bearer $TOKEN"
```
**Response 200:**
```json
{ "user_id": "uuid", "role": "admin" }
```

---

## Organizations

### GET /organizations/pending — admin only
List all organization accounts awaiting approval.
```bash
curl $BASE/organizations/pending \
  -H "Authorization: Bearer $TOKEN"
```
**Response 200:**
```json
[
  { "id": "uuid", "organization_name": "Relief Org", "address": "...", "contact_person": "...", "email": "org@example.com" }
]
```

---

### PUT /organizations/{org_id}/approve — admin only
```bash
curl -X PUT $BASE/organizations/{org_id}/approve \
  -H "Authorization: Bearer $TOKEN"
```
**Response 200:**
```json
{ "message": "Organization approved" }
```

---

### DELETE /organizations/{org_id}/reject — admin only
Rejects and deletes the organization account.
```bash
curl -X DELETE $BASE/organizations/{org_id}/reject \
  -H "Authorization: Bearer $TOKEN"
```
**Response 200:**
```json
{ "message": "Organization rejected and deleted" }
```

---

## Lost & Found

### GET /lost-found — any approved user
```bash
curl $BASE/lost-found \
  -H "Authorization: Bearer $TOKEN"
```
> Admin sees all posts. Citizens/organizations see only `approval_status = approved` posts.

**Response 200:**
```json
{
  "success": true,
  "message": "Posts retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "category": "Pets",
      "location": "Karachi Clifton",
      "contact": "03219876543",
      "name": "Golden Retriever",
      "post_type": "lost",
      "additional_info": "Red collar",
      "approval_status": "approved",
      "created_at": "2024-01-01T00:00:00"
    }
  ]
}
```

---

### POST /lost-found/request — any approved user
Submit a request to add a new lost/found post.
```bash
curl -X POST $BASE/lost-found/request \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Pets",
    "location": "Karachi Clifton",
    "contact": "03219876543",
    "name": "Golden Retriever",
    "post_type": "lost",
    "additional_info": "Red collar"
  }'
```
> `post_type`: `"lost"` or `"found"`. `additional_info` is optional.

**Response 201:**
```json
{ "success": true, "message": "Add request submitted successfully. Pending admin approval.", "data": { "request_id": "uuid" } }
```

---

### PUT /lost-found/request/{post_id} — approved user (own post only)
Submit a request to edit an existing post. Full payload required.
```bash
curl -X PUT $BASE/lost-found/request/{post_id} \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Pets",
    "location": "Karachi Clifton",
    "contact": "03219876543",
    "name": "Golden Retriever Updated",
    "post_type": "lost",
    "additional_info": "Blue collar now"
  }'
```
**Response 201:**
```json
{ "success": true, "message": "Edit request submitted successfully. Pending admin approval.", "data": { "request_id": "uuid" } }
```
> Returns `409` if a pending request already exists for this post.

---

### DELETE /lost-found/request/{post_id} — approved user (own post only)
Submit a request to delete a post.
```bash
curl -X DELETE $BASE/lost-found/request/{post_id} \
  -H "Authorization: Bearer $TOKEN"
```
**Response 201:**
```json
{ "success": true, "message": "Delete request submitted successfully. Pending admin approval.", "data": { "request_id": "uuid" } }
```

---

## Shelters

### GET /shelters — any approved user
```bash
curl $BASE/shelters \
  -H "Authorization: Bearer $TOKEN"
```
**Response 200:**
```json
{
  "success": true,
  "message": "Shelters retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "added_by": "uuid",
      "shelter_name": "Al-Noor Shelter",
      "location": "Rawalpindi Saddar",
      "capacity": 80,
      "latitude": 33.5651,
      "longitude": 73.0169,
      "approval_status": "approved",
      "created_at": "2024-01-01T00:00:00"
    }
  ]
}
```

---

### POST /shelters/request — approved org only
```bash
curl -X POST $BASE/shelters/request \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shelter_name": "Al-Noor Shelter",
    "location": "Rawalpindi Saddar",
    "capacity": 80,
    "latitude": 33.5651,
    "longitude": 73.0169
  }'
```
> `latitude` and `longitude` are optional.

**Response 201:**
```json
{ "success": true, "message": "Add request submitted successfully. Pending admin approval.", "data": { "request_id": "uuid" } }
```

---

### PUT /shelters/request/{shelter_id} — approved org (own shelter only)
Full payload required.
```bash
curl -X PUT $BASE/shelters/request/{shelter_id} \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shelter_name": "Al-Noor Shelter Updated",
    "location": "Rawalpindi Saddar",
    "capacity": 100,
    "latitude": 33.5651,
    "longitude": 73.0169
  }'
```
**Response 201:**
```json
{ "success": true, "message": "Edit request submitted successfully. Pending admin approval.", "data": { "request_id": "uuid" } }
```

---

### DELETE /shelters/request/{shelter_id} — approved org (own shelter only)
```bash
curl -X DELETE $BASE/shelters/request/{shelter_id} \
  -H "Authorization: Bearer $TOKEN"
```
**Response 201:**
```json
{ "success": true, "message": "Delete request submitted successfully. Pending admin approval.", "data": { "request_id": "uuid" } }
```

---

## Donation Accounts

### GET /donation-accounts — any approved user
```bash
curl $BASE/donation-accounts \
  -H "Authorization: Bearer $TOKEN"
```
**Response 200:**
```json
{
  "success": true,
  "message": "Donation accounts retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "added_by": "uuid",
      "account_title": "FLARE Relief Fund",
      "account_no": "1234567890",
      "bank_name": "HBL",
      "iban": "PK36SCBL0000001123456702",
      "created_at": "2024-01-01T00:00:00"
    }
  ]
}
```

---

### POST /donation-accounts/request — approved org only
```bash
curl -X POST $BASE/donation-accounts/request \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "account_title": "FLARE Relief Fund",
    "account_no": "1234567890",
    "bank_name": "HBL",
    "iban": "PK36SCBL0000001123456702"
  }'
```
**Response 201:**
```json
{ "success": true, "message": "Add request submitted successfully. Pending admin approval.", "data": { "request_id": "uuid" } }
```

---

### PUT /donation-accounts/request/{account_id} — approved org (own account only)
Full payload required.
```bash
curl -X PUT $BASE/donation-accounts/request/{account_id} \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "account_title": "Updated Relief Fund",
    "account_no": "1234567890",
    "bank_name": "HBL",
    "iban": "PK36SCBL0000001123456702"
  }'
```
**Response 201:**
```json
{ "success": true, "message": "Edit request submitted successfully. Pending admin approval.", "data": { "request_id": "uuid" } }
```

---

### DELETE /donation-accounts/request/{account_id} — approved org (own account only)
```bash
curl -X DELETE $BASE/donation-accounts/request/{account_id} \
  -H "Authorization: Bearer $TOKEN"
```
**Response 201:**
```json
{ "success": true, "message": "Delete request submitted successfully. Pending admin approval.", "data": { "request_id": "uuid" } }
```

---

## Change Requests

### GET /change-requests — admin only
List all change requests. Optional `?status=` filter.
```bash
# All requests
curl $BASE/change-requests \
  -H "Authorization: Bearer $TOKEN"

# Filter by status: pending | approved | rejected
curl "$BASE/change-requests?status=pending" \
  -H "Authorization: Bearer $TOKEN"
```
**Response 200:**
```json
{
  "success": true,
  "message": "Change requests retrieved",
  "data": [
    {
      "id": "uuid",
      "table_name": "lost_found_posts",
      "record_id": "uuid or null",
      "requested_by": "uuid",
      "request_type": "add",
      "payload": { "category": "Pets", "..." : "..." },
      "status": "pending",
      "created_at": "2024-01-01T00:00:00",
      "reviewed_by": null,
      "reviewed_at": null
    }
  ]
}
```

---

### GET /change-requests/my — any approved user
Returns only the requests submitted by the current user.
```bash
curl $BASE/change-requests/my \
  -H "Authorization: Bearer $TOKEN"
```
**Response 200:** Same shape as above, filtered to current user.

---

### PUT /change-requests/{request_id}/approve — admin only
Approves the request and executes the change in the target table.
```bash
curl -X PUT $BASE/change-requests/{request_id}/approve \
  -H "Authorization: Bearer $TOKEN"
```
> - `add` → inserts a row into `lost_found_posts`, `shelters`, or `donation_accounts`
> - `edit` → updates the existing row with the stored payload
> - `delete` → deletes the row

**Response 200:**
```json
{ "success": true, "message": "Change request approved and executed", "data": null }
```

---

### PUT /change-requests/{request_id}/reject — admin only
Rejects the request. The target table is not touched.
```bash
curl -X PUT $BASE/change-requests/{request_id}/reject \
  -H "Authorization: Bearer $TOKEN"
```
**Response 200:**
```json
{ "success": true, "message": "Change request rejected", "data": null }
```

---

## Error Responses

| Code | Meaning |
|---|---|
| 400 | Bad request (e.g. request already approved/rejected, invalid status filter) |
| 401 | Invalid or expired token |
| 403 | Not authenticated / insufficient role / account not approved |
| 404 | Resource not found |
| 409 | Conflict — a pending request already exists for this record |
| 422 | Validation error — missing or invalid request body fields |
| 500 | Server error |

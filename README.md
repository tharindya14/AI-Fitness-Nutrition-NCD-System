## FITSHIELD Backend Microservice Architecture

### Services
- API Gateway: http://localhost:5000
- Auth Service: http://localhost:5001
- Diet Safety Service: http://localhost:5002
- Exercise Service: http://localhost:5003
- Supplement Service: http://localhost:5004
- Habit Service: http://localhost:5005

### Auth APIs
POST /api/auth/register  
POST /api/auth/login  

### Diet Safety APIs
POST /api/diet/check-safety  
GET /api/diet/history  

### Diet Safety Request Example
{
  "drug_name": "Andol 0.5mg Tablet",
  "food_name": "Beer",
  "allergies": ["milk", "wheat"]
}

### Output
The system returns model risk, rule warnings, allergy risks, final risk score, safety explanation, and safer alternatives.
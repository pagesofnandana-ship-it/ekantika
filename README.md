# Ekantika Saree Catalogue

React + Bootstrap frontend, Flask API, and MySQL database. Customers can browse sarees and open WhatsApp with a pre-filled enquiry. The owner can log in to add, edit, and delete products.

## Backend
1. Install Python 3.10+ and MySQL 8+.
2. Create database: `CREATE DATABASE ekantika_db CHARACTER SET utf8mb4;`
3. In `backend`, create a virtual environment and install dependencies:
   `pip install -r requirements.txt`
4. Copy `.env.example` to `.env` and set your MySQL password and secret keys. WhatsApp number is optional; use country code and digits only (India: 91XXXXXXXXXX).
5. Create owner login: `flask --app app create-admin`
6. Start API: `flask --app app run --debug`

## Frontend
In another terminal: `cd frontend`, then `npm install`, then `npm run dev`. Open the Vite URL shown (usually http://localhost:5173).

Product images are saved in `backend/uploads`. For production, disable debug mode, use HTTPS, restrict CORS, and configure persistent image storage. WhatsApp opens a prepared message; the customer must press Send.

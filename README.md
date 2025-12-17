# 📁 file-sharing-app

A secure full-stack file sharing application similar to Google Drive.  
Users can upload files, manage access, share with other registered users, and generate **public share links with expiry**. Files are stored securely on Cloudinary.

---

## Live link for demo - https://file-sharing-app-snowy-chi.vercel.app/login

---

## Features

- User authentication (JWT)
- Upload files (PDFs, images, CSVs)
- Cloudinary file storage using Multer (memory storage)
- View “My Files”
- Share files with registered users via email
- “Shared With Me” access
- Public share links with optional expiry
- Secure downloads with original file type preserved
- Fully responsive UI (mobile & desktop)

---

## Tech Stack

### Backend

- Node.js
- Express.js
- MongoDB + Mongoose
- JWT Authentication
- Multer
- Cloudinary

### Frontend

- React (Vite)
- Tailwind CSS
- React Router
- Axios

---

## 📂 Project Structure

file-sharing-app/
├── backend/
│ ├── src/
│ ├── .env (ignored)
│ └── .gitignore
│
├── frontend/
│ ├── src/
│ ├── .env (ignored)
│ └── .gitignore
│
└── README.md

---

## ▶ How to Run the App Locally

### Prerequisites

- Node.js (v18+ recommended)
- MongoDB (local or Atlas)
- Cloudinary account

---

### Clone the repository

```bash
git clone https://github.com/Pagaryash/file-sharing-app.git
cd file-sharing-app


### Backend Setup
cd backend
npm install

Create a .env file inside the backend folder:
PORT=3000
MONGO_URI=YOUR_MONGODB_CONNECTION_STRING
JWT_SECRET=YOUR_SECRET_KEY

CLOUDINARY_CLOUD_NAME=YOUR_CLOUD_NAME
CLOUDINARY_API_KEY=YOUR_API_KEY
CLOUDINARY_API_SECRET=YOUR_API_SECRET

Run the backend server: npm run dev
Backend will run at: http://localhost:3000

### Frontend Setup
cd b
cd frontend
npm install
npm run dev

Run the frontend server: npm run dev
Frontend will run at: http://localhost:5173
```

Demo / Testing Flow

Register and login

Upload a PDF or image

View file in My Files

Share file with another registered user

Login as the second user → view Shared With Me

Create a public share link with expiry

Open link for download

After expiry → link won't work

Security Notes

JWT authentication for protected routes

Public share links use random tokens + expiry

Files are downloaded via Cloudinary attachment URLs

.env files are excluded from Git using .gitignore

Author

Yash Pagar

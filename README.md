# 🎓 PassNow Marketplace

<div align="center">
  <h3>The modern, student-focused marketplace for campus communities.</h3>
  <p>Buy, sell, and pass down textbooks, dorm essentials, and more within your university ecosystem.</p>
</div>

---

## 🚀 Live Demo
**Access the live application here:** [https://passnow.vercel.app](https://passnow.vercel.app) *(Update link if necessary)*

## ✨ Key Features

- 🏫 **Campus-Centric Feed**: Intelligently matches students with items available at their specific university or district. Includes a dynamic **University Browser** with alias searching (e.g., "FPT", "RMIT").
- 🤝 **Transactions & Trust**: Seamlessly track buying and selling progress. Features a **Public Review System** with receipt status tracking ("Item Received" vs "Not Received").
- 💬 **Real-time Messaging**: Built-in chat system for buyers and sellers to negotiate and arrange meetups securely without sharing personal contact info.
- 💸 **Flexible Pricing**: Supports both priced items and "Free/Giveaway" items, fostering a circular campus economy.
- 🎨 **Modern Aesthetics**: Built with a sleek, responsive design featuring glassmorphism, dynamic animations, and Google Material Design principles.

## 🛠 Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS v4, Custom UI Components
- **State Management:** Zustand, React Hook Form
- **Backend/BaaS:** Firebase (Authentication, Firestore Database, Storage)
- **Quality Assurance:** Vitest, React Testing Library, ESLint, Playwright

---

## 👨‍🏫 Guide for Teachers & Evaluators: How to Run Locally

Follow these steps to run the complete PassNow application on your local machine for evaluation.

### 1. Prerequisites
Ensure you have the following installed on your machine:
- **Node.js** (v18.0.0 or higher) - [Download here](https://nodejs.org/)
- **Git** - [Download here](https://git-scm.com/)

### 2. Clone the Repository
Open your terminal/command prompt and run:
```bash
git clone https://github.com/minhbackend0611/PassNow.git
cd PassNow
```

### 3. Install Dependencies
Install all required NPM packages:
```bash
npm install
```

### 4. Environment Configuration
The application requires Firebase to function. We have provided a template for the environment variables.
1. In the root directory, locate the `.env.example` file.
2. Create a new file named `.env` in the exact same directory.
3. Copy the contents of `.env.example` into `.env` and fill in the Firebase credentials. *(If you are an evaluator, please request the `.env` file from the student directly to access the active testing database).*

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 5. Start the Application
Run the local development server:
```bash
npm run dev
```
The terminal will display a local URL (usually `http://localhost:5173`). Ctrl+Click the link to open the application in your browser.

---

## 🧪 Running Tests

PassNow maintains a suite of automated tests. To run them locally:

**Unit & Integration Tests (Vitest):**
```bash
npm run test
```

**Firebase Security Rules Tests:**
```bash
npm run test:rules
```

---

## 📂 Project Structure Overview

```text
src/
├── components/       # Reusable global UI components (Buttons, Modals, Navbars)
├── features/         # Domain-driven feature modules (auth, feed, profile, chat)
├── lib/              # Third-party library initializations (Firebase)
├── services/         # Firebase data access and business logic layers
├── store/            # Global Zustand state stores
├── types/            # TypeScript interface definitions
└── utils/            # Helper functions and constants
```

## 📝 License
This project is created for academic purposes. All rights reserved by the development team.

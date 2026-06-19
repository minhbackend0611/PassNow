# PassNow Marketplace

PassNow is a modern, student-focused marketplace application designed to facilitate the passing down of textbooks, dorm essentials, and other items within campus communities.

## Features

- **Campus Feed**: Browse items available in your specific university/district.
- **Free vs Priced Items**: Easily filter for items that are being given away for free.
- **Secure Authentication**: User registration and login powered by Firebase Auth.
- **Modern UI**: Built with a sleek, responsive design using Tailwind CSS v4 and Google Material Symbols.
- **Profile Management**: Maintain your campus and district information for localized filtering.

## Tech Stack

- **Frontend Framework**: React 19 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand
- **Database & Auth**: Firebase (Firestore + Authentication)
- **Validation**: Zod & React Hook Form
- **Testing**: Vitest & React Testing Library

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/minhbackend0611/PassNow.git
   cd PassNow
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Firebase:
   Create a `.env` file in the root directory and add your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Testing

To run the automated tests:
```bash
npm run test
```

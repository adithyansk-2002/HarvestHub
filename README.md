# 🌾 HarvestHub - Agricultural Bidding Platform

<div align="center">

<img src="img/icon-512x512.png" alt="HarvestHub Logo" width="200"/>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/adithyansk-2002/HarvestHub/pulls)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/adithyansk-2002/HarvestHub/graphs/commit-activity)

[Demo](https://adithyansk-2002.github.io/HarvestHub/) • [Report Bug](https://github.com/adithyansk-2002/HarvestHub/issues) • [Request Feature](https://github.com/adithyansk-2002/HarvestHub/issues)

</div>

## 📋 Table of Contents
- [About The Project](#about-the-project)
  - [Problem Statement](#problem-statement)
  - [Solution](#solution)
  - [Built With](#built-with)
- [Features](#features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Firebase Setup](#firebase-setup)
- [Project Structure](#project-structure)
- [Usage](#usage)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)
- [Acknowledgments](#acknowledgments)

## 🎯 About The Project

### Problem Statement
Small-scale farmers often face challenges in getting fair prices for their produce due to:
- Multiple middlemen in the supply chain
- Limited access to broader markets
- Physical constraints in participating in traditional auctions
- Lack of price transparency
- Geographic limitations

### Solution
HarvestHub provides a digital platform that:
- Connects farmers directly with buyers
- Enables online bidding for agricultural produce
- Implements AI-based price predictions
- Ensures quality control through professional verification
- Facilitates secure transactions
- Provides logistics support

### Built With
- Frontend:
  - ![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
  - ![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)
  - ![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
  - ![Bootstrap](https://img.shields.io/badge/bootstrap-%23563D7C.svg?style=for-the-badge&logo=bootstrap&logoColor=white)

- Backend:
  - ![Firebase](https://img.shields.io/badge/firebase-%23039BE5.svg?style=for-the-badge&logo=firebase)
  - ![Node.js](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)

- Additional Technologies:
  - Web3.js for blockchain integration
  - Machine Learning for price prediction
  - PWA capabilities for offline access

HarvestHub is a web-based platform that connects farmers and buyers through an efficient bidding system. The platform allows farmers to list their produce and buyers to place bids, creating a transparent and competitive marketplace for agricultural products.

## Features

- Separate interfaces for farmers (sellers) and buyers
- Real-time bidding system
- User authentication and authorization
- Dashboard for managing listings and bids
- Progressive Web App (PWA) support
- Responsive design for all devices
- Machine learning-based price suggestions

## ✨ Features

### For Farmers (Sellers)
- 📱 User-friendly dashboard
- 📦 Easy product listing
- 🔔 Real-time bid notifications
- 📊 Analytics and insights
- 💰 Secure payment processing
- 📈 Historical price data

### For Buyers
- 🔍 Advanced search filters
- 🏷️ Real-time bidding
- 📍 Location-based recommendations
- 💳 Multiple payment options
- 📱 Mobile-responsive interface
- 🔔 Bid status notifications

### Platform Features
- 🔒 Secure authentication
- 📱 Progressive Web App (PWA)
- 🌐 Cross-platform compatibility
- 📊 Real-time analytics
- 🤖 AI-powered price suggestions
- 🔄 Automatic market updates

## 🚀 Getting Started

### Prerequisites

1. **Node.js & npm**
   ```bash
   # Check Node.js version (should be ≥ 14)
   node --version
   
   # Check npm version
   npm --version
   ```

2. **Python (for AI Price Prediction)**
   ```bash
   # Check Python version (should be ≥ 3.8)
   python --version
   
   # Required Python packages
   pip install flask
   pip install pandas
   pip install scikit-learn
   pip install numpy
   pip install flask-cors
   ```

3. **Firebase Tools**
   ```bash
   # Install Firebase CLI globally
   npm install -g firebase-tools
   
   # Login to Firebase
   firebase login
   ```

4. **Required npm packages**
   ```bash
   # Install all required npm packages
   npm install firebase
   npm install bootstrap
   npm install chart.js
   npm install @firebase/firestore
   npm install @firebase/auth
   npm install @firebase/storage
   ```

5. **Web Browser**
   - Chrome (recommended)
   - Firefox
   - Safari
   - Edge

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/HarvestHub.git
   cd HarvestHub
   ```

2. **Install Dependencies**
   ```bash
   # Install project dependencies
   npm install

   # Install development dependencies
   npm install --save-dev @babel/core @babel/preset-env
   ```

3. **Environment Setup**
   ```bash
   # Create .env file
   cp .env.example .env
   
   # Edit .env with your configurations
   nano .env
   ```

4. **Start the Flask Server (for AI Price Prediction)**
   ```bash
   # Navigate to the Flask server directory
   cd bidding_interface/bidding
   
   # Start the Flask server
   python app.py
   ```

5. **Start the Application**
   ```bash
   # In a new terminal, start the application
   # If using VS Code's Live Server:
   # Right-click on index.html and select "Open with Live Server"
   # 
   # Or use Python's built-in server:
   python -m http.server 5500
   ```

### Firebase Setup

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add Project"
   - Follow the setup wizard

2. **Enable Required Services**
   - Authentication (Email/Password)
   - Firestore Database
   - Storage
   - Realtime Database (for presence system)

3. **Configure Firebase**
   ```javascript
   // Add to .env file:
   FIREBASE_API_KEY=your_api_key
   FIREBASE_AUTH_DOMAIN=your_auth_domain
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_STORAGE_BUCKET=your_storage_bucket
   FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   FIREBASE_APP_ID=your_app_id
   ```

4. **Set up Firestore Security Rules**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Rules for buyers collection
       match /buyers/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       
       // Rules for sellers collection
       match /sellers/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }

       // Rules for bidding rooms and presence tracking
       match /biddingRooms/{roomId} {
         // For development and presence tracking
         allow read, write: if true;
         
         // Subcollection rules
         match /presence/{userId} {
           allow read, write: if true;
         }
         
         match /bids/{bidId} {
           allow read: if request.auth != null;
           allow write: if request.auth != null;
         }
       }
     }
   }
   ```

### Port Configuration
- Flask server runs on port 5000
- Web application should run on port 5500
- Make sure these ports are available and not blocked by firewall

### System Requirements
- Minimum 4GB RAM
- Modern web browser with JavaScript enabled
- Internet connection for Firebase services
- Port 5000 and 5500 available

## Project Structure

```
HarvestHub/
├── bidding_interface/     # Bidding system implementation
├── css/                   # Stylesheets
├── img/                   # Image assets
├── js/                    # JavaScript files
│   ├── firebase.js       # Firebase configuration
│   ├── main.js           # Main application logic
│   ├── dashboardB.js     # Buyer dashboard
│   ├── dashboardS.js     # Seller dashboard
│   └── service-worker.js # PWA service worker
├── lib/                   # Third-party libraries
├── scss/                  # SCSS source files
└── index.html            # Main entry point
```

## Key Dependencies

- Firebase (Authentication, Database)
- Bootstrap 5
- jQuery
- Owl Carousel
- Font Awesome
- Web3.js
- Truffle HDWallet Provider

## Usage

1. **For Farmers (Sellers)**
   - Sign up as a seller
   - Create listings for your produce
   - Manage bids and accept offers
   - Track transactions

2. **For Buyers**
   - Sign up as a buyer
   - Browse available produce
   - Place bids on listings
   - Track your bids and purchases

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, open an issue in the GitHub repository.

## Acknowledgments

- Bootstrap for the UI framework
- Firebase for backend services
- All contributors who have helped shape this project

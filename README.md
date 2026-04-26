# MangoTree

**Interactive Web Platform for Sharing Culinary Experiences and Building an Online Community**

---

## Project Overview

Over the centuries, culinary knowledge has been passed down through generations - verbally, in handwritten recipes, or through shared cooking experiences. In the digital age, traditional methods of sharing gradually give way to technology-driven solutions. Access to quality, reliable culinary content has become increasingly limited, while online spaces are often diverse but unstructured.

In response to this need, the **MangoTree** project aims to develop a web platform that facilitates and encourages the exchange of culinary experiences by sharing recipes, tips, and inspiration. The platform seeks to create a virtual community of cooking enthusiasts, providing an accessible and interactive environment for communication, creativity, and mutual support.

---

## Functional Features

The platform provides the following key features:

- **Post Creation**: Users can publish posts with images. Each post can be categorized and tagged using predefined tag lists.
- **Content Moderation**: Posts are analyzed by an algorithm to ensure safety and appropriateness for all age groups. Users receive notifications if their content violates rules.
- **Interactions**: Users can like, comment, share, and report posts.
- **Notifications**: Users receive alerts for interactions on their posts and updates relevant to their account.
- **User Engagement**: Designed to foster a positive, active online community centered on cooking and knowledge sharing.

---

## Structure and Navigation

The website features clear, user-friendly navigation with the following main sections:

- **Home**: Displays selected posts tailored to user interests through a recommendation algorithm based on likes and preferred tags. Includes a search functionality for discovering content.
- **Notifications**: Displays activity notifications related to the user account.
- **Upload**: Interface for publishing new content.
- **Account**: Shows personal user profile information.
- **Settings**: Section for personalizing the interface and user profile.

The admin sidebar offers full control of the posts and users and include the following main sections:

- **To preview**: Displays a page of content that is flagged as 'to preview' in case of incorrect AI setup or no more tokens left to use the AI API.
- **Reports**: Displays a similarly styled page with reports submitted by users regarding inappropriate comments or content, or irrelevant posts.
- **Activity Log**: A table showing details about every log by an admin and user.
- **Users**: A table that displays user information and allows the admin to preview their account, ban or delete it.
- **Admins**: A table that displays brief overview of admin accounts' information and an option to add an admin.
- **Banned users**: A table that contains information about banned users, with the option to unban them.
- **Tags**: A table that displays all tags, with the option to edit, delete or create a new tag.
- **Categories**: A table that displays all categories, with the option to edit, delete or create a new category.
- **Settings**: Section for personalizing the interface and admin profile.

---

## User Roles and Management

The system supports two main types of user access:

1. **Regular User**:
   - Publish, edit, and delete their own posts.
   - Interact with other users' posts (like, comment, share, follow users).

2. **Administrator**:
   - Access to manage content and users.
   - Review reported content and remove inappropriate posts.
   - Block user accounts violating platform rules.
   - Access basic user information such as name, email, and activity for security and integrity purposes.

---

## Technologies Used

- **Frontend**: React with Vite and TypeScript, CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: MongoDB
- **Notifications & Moderation**: Custom logic for alerts and content analysis

---

## Expected Outcomes

The MangoTree platform aims to provide a modern, secure, and intuitive web experience combining elements of social networking and culinary blogging. By integrating content analysis and user interaction management, the system ensures a high level of reliability, safety, and audience engagement.

The ultimate goal is a functioning website that promotes the cultural value of culinary sharing while building a sustainable community of users with shared interests.

---

## How to Start the Project

### 1. Installation

   First, you need to clone the repository:
   ```bash
   git clone https://github.com/danivst/mango-tree
   ```

   Then, navigate to the folder: 
   ```bash
   cd mango-tree
   ```

### 3. Setting environmental variables

   This project needs **.env** files that contain configuration regarding the services. **Please note: Without having them configured, the project will not build, nor run.**

   To create these files, create a new file named .env in the main directory of the folder.

   The values needed are:
   ```bash
   PORT={port_number_for_backend} // This value by default is set to 3000 in the backend/src/config/env.ts file if it is missing in the .env file.
   MONGO_URI={mongodb_uri} // Required and has no default value
   JWT_SECRET={jwt_secret_key} // Required and has no default value
   DEEPL_API_KEY={deepl_api_key} // Required and has no default value
   CLIENT_URL={url_for_client}  // Required and has no default value. Please note: If launching in local host you can just enter http://localhost:{client_port}.
   BASE_API_URL={url_for_api}  // Required and has no default value. Please note: If launching in local host you can just enter http://localhost:{server_port}.
   VITE_BASE_API_URL={url_for_api} // Required by Vite for frontend configuration and has no default value. Please note: Set this value to the same one you set for BASE_API_URL.
   GEMINI_API_KEY={gemini_api_key} // Required and has no default value
   GEMINI_MODEL_DEFAULT={preferred_gemini_model} // This value by default is set to gemini-2.5-flash-lite in the backend/src/config/env.ts file if it is missing in the .env file.
   RESEND_API_KEY={resend_api_key} // This value has no default value set but if it is missing in the .env file the project can launch. Please note: If you do not set this value, the functionality related to sending emails will NOT work.
   RESEND_FROM_EMAIL={email_address_to_send_emails_from} // This value by default is set to support@mangotreeofficial.com in the backend/src/config/env.ts file if it is missing in the .env file, which is the official MangoTree email address. Please note: If you configure your own Resend API key, you need to set this value to the email address which you created the Resend account with, UNLESS you are using your own domain in the account. If that's the case, you need to set this value to your own official domain email.
   ```

   If the project is unable to launch with this .env file, try copying the file twice in each directory by navigating to backend and frontend separately and copy and pasting the file in each one. 

### 3. Development

   You must start both the backend and the frontend. First, open three terminal windows.

   Navigate to the shared folder:
   ```bash
   cd shared
   ```

   Install dependencies and packages:
   ```bash
   npm install
   ```

   Ensure there are no build errors:
   ```bash
   npm run build
   ```

   **Please note: This directory contains shared types and interfaces used by both client and server and is NOT intended to be launched on its own. It only needs the required packages installed.**

   Navigate to the backend folder: 
   ```bash
   cd ../backend
   ```

   Install dependencies and packages:
   ```bash
   npm install
   ```

   Ensure there are no build errors:
   ```bash
   npm run build
   ```

   To start the server, run:
   ```bash
   npm run dev
   ```
   If successful, in the terminal there should be logs, indicating that the server is running on port **3000**.

   The next step is to navigate back to the frontend folder:
   ```bash
   cd ../frontend
   ```

   Install dependencies and packages:
   ```bash
   npm install
   ```
   
   Ensure there are no build errors:
   ```bash
   npm run build
   ```

   To run the client, run:
   ```bash
   npm run dev
   ```

   If successful, in the terminal should appear a link to **localhost:5173**.
   **Please note: If port 5173 is not free to use, the frontend will be launched using a free port. This requires manual configuration in **backend/src/server.ts** in order to allow communication between the client and the server, so CORS allows the requests to pass, like so:**
   ```backend/src/server.ts
   app.use(cors({
      origin: [
         "http://localhost:{your_port}",
         "http://127.0.0.1:{your_port}",
      ],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
   }));
   ```

   **Please note: The provided origins are for local host ONLY. If you launch the project and try to access it from a network IP address, you need to add the IP with the same port as shown above to allow the requests to be sent to the backend.**

   To view and open the website, click on that link, which should automatically redirect you to the landing page in your preferred browser.

### 4. Running tests

   To run the two testing files for users and notifications, navigate to the backend directory with: 
   ```bash
   cd backend
   ```
   and run:
   ```bash
   npm run tests
   ```

   **Please note: In order to execute this command, the server must be stopped.**

### 5. Database seeding

   If you want to test the logic and see how it looks, instead of manually creating posts and accounts you can execute the seeding files in the **backend/src/scripts** folder. For this, you have to navigate to the backend folder:
   ```bash
   cd backend
   ```
   
   Next, execute the following commands in the provided order:
   ```bash
   npm run seed:categories
   npm run seed:tags
   npm run seed:users
   npm run seed:posts
   npm run seed:comments
   npm run seed:reports
   ```
   
   These commands seed 50 user profiles and a randomly generated amount of posts and comments related to them. There are also 7 reports generated. The categories and tags are the default intended for the usage and purpose of the platform.

   To create a default user account run:
   ```bash
   npm run create-user
   ```

   To create a default admin account run:
   ```bash
   npm run create-admin
   ```
   
   **Please note: Seeded users and the default user and admin profiles use the password format: [Username]123!@# (e.g., John123!@#).**

   **Please note: In order to execute this command, the server must be stopped.**

---

# Step-by-Step Guide: Deploying to Streamlit Community Cloud
**Project:** Smart Hospital Inventory Management System  
**Platform:** [Streamlit Community Cloud](https://share.streamlit.io/) (100% Free Hosting)  
**Database:** [MongoDB Atlas](https://www.mongodb.com/atlas) (Free M0 Cloud Database)

---

## 🌟 Why Streamlit Cloud?
- **Zero Server Setup:** Runs directly from your GitHub repository.
- **Always Online:** Generates a public HTTPS link (e.g. `https://smart-hospital-inventory.streamlit.app`) to share with professors and evaluators.
- **Automatic Deployment:** Every `git push` automatically rebuilds and updates the app.

---

## Step 1: Push Code to GitHub

1. Open your terminal in `c:\smart hospital`:
```powershell
cd "c:\smart hospital"
git init
git add .
git commit -m "Initial commit of Smart Hospital Inventory Management System"
```

2. Create a new repository on [GitHub](https://github.com/new) (e.g. `smart-hospital-inventory`).
3. Push your code:
```powershell
git branch -M main
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/smart-hospital-inventory.git
git push -u origin main
```

---

## Step 2: Set Up Free Cloud MongoDB Atlas (2 Minutes)

Since Streamlit Cloud runs on public web servers, it needs to connect to a cloud MongoDB cluster rather than your local PC (`localhost:27017`):

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and sign in (or create a free account).
2. Click **Create a Deployment** $\rightarrow$ select the **M0 FREE** tier $\rightarrow$ Choose AWS/Google Cloud in your region $\rightarrow$ Click **Create**.
3. Under **Security Quickstart**:
   - **Username & Password:** Create an administrative user (e.g., `hospital_admin` and a strong password). Save these!
   - **Network Access (IP Access List):** Click **Allow Access from Anywhere** (`0.0.0.0/0`) so Streamlit Cloud can connect.
4. Click **Database** $\rightarrow$ **Connect** $\rightarrow$ **Drivers** (Python).
5. Copy your connection string. It will look like:
   ```
   mongodb+srv://hospital_admin:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority
   ```
   *(Replace `<password>` with your actual database user password).*

---

## Step 3: Deploy on Streamlit Community Cloud

1. Go to [share.streamlit.io](https://share.streamlit.io/) and click **Sign In with GitHub**.
2. Click **New app** (or **Create app**).
3. Select your GitHub repository:
   - **Repository:** `<YOUR_USERNAME>/smart-hospital-inventory`
   - **Branch:** `main`
   - **Main file path:** `streamlit_app.py`
   - **App URL:** (Optional custom subdomain, e.g. `smart-hospital-cse494`)
4. Click **Advanced Settings...** $\rightarrow$ **Secrets**:
   Paste the following TOML configuration:
   ```toml
   MONGODB_URI = "mongodb+srv://hospital_admin:<YOUR_PASSWORD>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority"
   DATABASE_NAME = "SmartHospitalDB"
   ```
5. Click **Deploy!**

---

## Step 4: First-Time Data Seeding in the Cloud

When your app finishes deploying:
1. Open your live app link.
2. In the left sidebar, click the button:
   ```
   🌱 Seed / Reset Demonstration Data
   ```
3. The app will automatically populate your cloud MongoDB Atlas database with:
   - 5 Medical suppliers
   - 18 Diverse hospital inventory items (medicines, surgical supplies, equipment)
   - 5 Stock movement transactions
4. All dashboard KPIs, Plotly charts, inventory tables, and reports will instantly light up!

---

## 🛠️ Testing Locally Before Deploying

You can run the Streamlit app on your local machine anytime:
```powershell
cd "c:\smart hospital"
streamlit run streamlit_app.py
```
Local address: `http://localhost:8501`

> [!IMPORTANT]
> This project is currently broken and fixing is still in progress.

# Milestone

> Stay focused, stay organized.

**Milestone** is a sleek, modern time-tracking app built to help developers and professionals track, reflect on, and improve how they spend their work hours — project by project.

---

## 🚀 Features

* ⏱️ Start/stop time tracking
* 🗂️ Project-based log organization
* 🗒️ Session notes & file attachments
* 📊 Visual heatmap analytics
* 🌙 Dark mode support
* 📱 Fully responsive design
* � User authentication
* ☁️ Cloud storage for files
* 🗄️ PostgreSQL database

---

## 🛠️ Getting Started

### 🔧 Prerequisites

* **Node.js** (LTS version recommended)
* **npm** or **yarn**
* **PostgreSQL** database
* **AWS S3** bucket (for file storage)

### 📦 Installation

1. **Clone the repo:**

   ```bash
   git clone https://github.com/yourusername/CodeLog.git
   cd CodeLog
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**

   Copy `.env.example` to `.env` and fill in your values:

   ```env
   DATABASE_URL="your-postgresql-connection-string"
   NEXTAUTH_SECRET="your-nextauth-secret"
   NEXTAUTH_URL="http://localhost:3000"
   AWS_ACCESS_KEY_ID="your-aws-access-key"
   AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
   AWS_REGION="us-east-1"
   S3_BUCKET_NAME="your-bucket-name"
   ```

4. **Set up the database:**

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

5. **Run the dev server:**

   ```bash
   npm run dev
   ```

---

## 🚀 Deployment

### Vercel

1. Connect your GitHub repo to Vercel
2. Set environment variables in Vercel dashboard
3. Use Vercel Postgres for the database
4. Deploy!

### Other Platforms

The app can be deployed to any platform supporting Next.js, such as Netlify, Railway, or Heroku.

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/              # API routes
│   ├── auth/             # Authentication pages
│   ├── dashboard/        # Dashboard page
│   ├── projects/         # Projects pages
│   └── timer/            # Timer page
├── components/           # Reusable components
├── lib/                  # Utilities and configurations
└── prisma/               # Database schema and migrations
```

---

## 🧪 Testing

Run the test suite:

```bash
npm run test
```

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a PR

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

Open your browser at [http://localhost:3000](http://localhost:3000)

---

## 🧱 Tech Stack

* **Next.js** – App framework
* **Tailwind CSS** – Styling
* **Zustand** – State management
* **date-fns** – Date handling
* **Lucide React** – Icon set

---

## 🗂 Project Structure

```
/
├── src/
│   ├── app/          # App router pages
│   ├── components/   # UI components
│   └── lib/          # Stores and utilities
├── public/           # Static assets
└── ...config files
```

---

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests to improve CodeLog.

---

## 📄 License

Licensed under the **GNU Affero General Public License**. See the [LICENSE](LICENSE) file for details.

# Abledger Web App

A modern, multi-tenant SaaS web application built with Next.js 15, TypeScript, and Tailwind CSS. This application serves as the frontend interface for the Abledger platform, providing comprehensive ledger and management capabilities for tenants and platform administrators.

## 🚀 Features

- **Multi-Tenancy Support**: Seamless isolation and management for multiple organizations.
- **Role-Based Access Control (RBAC)**: secure access levels including Platform Admin, Tenant Owner, Tenant Admin, Staff, and Viewer.
- **Modern UI/UX**: Built with Radix UI and Tailwind CSS for a responsive, accessible, and polished interface.
- **Authentication**: Secure login and registration flows with JWT token management and auto-refresh.
- **Data Visualization**: Integrated charts and analytics using Chart.js and Recharts.
- **Dashboard**: specialized dashboards for both Tenant users and Platform Admins.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/), [Lucide React](https://lucide.dev/) (Icons)
- **Forms**: [React Hook Form](https://react-hook-form.com/)
- **HTTP Client**: [Axios](https://axios-http.com/)
- **Charts**: [Chart.js](https://www.chartjs.org/), [Recharts](https://recharts.org/)

## 🏁 Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm or pnpm
- Backend services running (see `README_API_INTEGRATION.md` for details)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd abledger-web
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    pnpm install
    ```

3.  **Environment Setup:**
    Create a `.env.local` file in the root directory:
    ```env
    NEXT_PUBLIC_API_URL=http://localhost:3000/api
    ```

### Running the Application

Start the development server:

```bash
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📂 Project Structure

```
├── app/                  # Next.js App Router pages and layouts
├── components/           # Reusable UI components
│   ├── ui/               # Base UI elements (buttons, inputs, etc.)
│   └── ...               # Feature-specific components
├── contexts/             # React Context providers (Auth, Theme, etc.)
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and API clients
│   ├── api/              # API integration logic
│   └── ...
├── public/               # Static assets
└── styles/               # Global styles
```

## 📖 Documentation

For more detailed information about specific parts of the system, refer to the following guides:

- [API Integration & Auth Flow](./README_API_INTEGRATION.md)
- [Registration Flow](./REGISTRATION_FLOW.md)
- [Security Guidelines](./SECURITY.md)

## 🤝 Contributing

1.  Fork the repository
2.  Create your feature branch (`git checkout -b feature/amazing-feature`)
3.  Commit your changes (`git commit -m 'Add some amazing feature'`)
4.  Push to the branch (`git push origin feature/amazing-feature`)
5.  Open a Pull Request

## 📄 License

This project is proprietary and private.

## Devitrak Admin Dashboard

Welcome to the **Devitrak Admin Dashboard**, a responsive, role-based platform designed for internal management of inventory, events, consumer assignments, and staff operations. This dashboard is tailored for efficient oversight and streamlined control of logistics, devices, and organizational data across the Devitrak system.

🔗 **Live App**: [https://admin.devitrak.net](https://admin.devitrak.net)

📘 **Full Documentation & Visual Overview**:  
Explore the full app functionality with detailed charts and visual breakdowns on DeepWiki:  
👉 [https://deepwiki.com/grodriguezcontextglobal/testing-admin-dashboard](https://deepwiki.com/grodriguezcontextglobal/testing-admin-dashboard)

---

## 🚀 Features

- **Advanced Inventory Management**
  - View, add, edit, and track device groups, individual items, and status (e.g., assigned, available, lost).
  - Bulk and single item uploads.
  - Tree view for hierarchical location/sub-location structure.
  - **NEW**: Advanced search with comprehensive filtering by category, group, brand, and location.
  - **NEW**: Daily inventory analysis with interactive charts showing availability trends.

- **Enhanced Event Control**
  - Manage event-based inventory allocation.
  - Assign devices to specific events and staff.
  - Track check-in/check-out history.
  - **NEW**: Event-specific device count tracking with real-time quantity calculations.
  - **NEW**: Streamlined event navigation with improved Redux state management.
  - **NEW**: Event details table with device count per event based on search parameters.

- **Consumer & Staff Management**
  - Assign devices to consumers or staff.
  - Track usage history and deposits.
  - Profile editing, account creation, and image uploads.

- **UI/UX Enhancements**
  - Responsive layout optimized for desktop and mobile.
  - Breadcrumb navigation, reusable buttons, and table components.
  - Visual status indicators and intuitive interaction flow.
  - **NEW**: Improved table columns with contextual device counting.
  - **NEW**: Enhanced navigation buttons with better user feedback.

- **Advanced Data Visualization**
  - Embedded chart components to visualize inventory statistics and event status.
  - Real-time updates and data-driven decision-making tools.
  - **NEW**: Daily timeline charts using ReactECharts for inventory tracking.
  - **NEW**: Multi-series bar and line charts with dual y-axes for comprehensive analytics.
  - **NEW**: Interactive tooltips and scrollable legends for better data exploration.

---

## 🧰 Tech Stack

- **Frontend**: React (Vite) + Tailwind CSS + React Query + clsx
- **Routing**: React Router v6
- **State Management**: Redux Toolkit
- **API Layer**: Axios (`devitrakApi`)
- **Authentication**: JWT-based with session and inactivity handling
- **Charts**: ReactECharts (Apache ECharts for React)
- **UI Components**: Material-UI (MUI) + Ant Design
- **Server**: Node.js (Express) — managed in separate repo
- **Database**: PlanetScale (MySQL), NoSQL (Firebase for event-specific items)

---

## 📁 Project Structure Highlights

src/
│
├── components/       # Reusable UI elements (icons, buttons, charts, tables)
├── pages/            # Main route views (inventory, staff, events, auth)
├── routes/           # Auth and non-auth route guards
├── store/            # Redux slices and configuration
├── styles/           # Global Tailwind and CSS custom variables
├── utils/            # Helpers, hooks, and custom logic
├── classes/          # Data mappers and upload/formatting logic

---

## 🧪 Testing & Development

* The app is actively tested and reviewed through weekly QA sessions.
* Ongoing component refactoring ensures performance and code reuse.
* Bug reports and optimization notes are tracked via project board.

---

## 📞 Support & Contribution

This is a private project maintained by the Devitrak internal development team. For internal contributions or issues, please contact the project owner or refer to documentation in DeepWiki.

---

## 📌 Author

**Gustavo Rodriguez**
Lead Developer – Devitrak Admin Portal
[https://deepwiki.com/grodriguezcontextglobal](https://deepwiki.com/grodriguezcontextglobal)

---

# Payroll Tracking & Calculation Tool - MVP Phase 0

A lightweight React TypeScript application that converts Slack attendance channel messages into accurate payroll calculations, including late-arrival deductions and offline penalties.

## 🚀 Features

- **Slack Message Parsing**: Import and parse Slack attendance messages with `:in:` and `:out:` emojis
- **Automated Calculations**: Calculate regular hours, overtime, and deductions based on configurable rules
- **Interactive Dashboard**: View payroll summaries with employee details and attendance issues
- **Date Range Filtering**: Select pay periods (1st-15th, 16th-EOM, or custom ranges)
- **CSV Export**: Export payroll data for finance systems
- **Local Storage**: Persist data between sessions
- **Mobile Responsive**: Works on desktop and mobile devices

## 📋 Payroll Rules (Configurable)

- **Standard Work Hours**: 8 hours per day
- **Overtime Multiplier**: 1.5x after 8 hours
- **Late Grace Period**: 5 minutes
- **Late Deduction**: $10 per late day
- **Offline Deduction**: $50 per offline day

## 🛠 Setup Instructions

### Prerequisites

- Node.js 18+ 
- npm or yarn package manager

### Installation

1. **Clone/Download the project**
```bash
git clone <repository-url>
cd payroll-tracker
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
```

3. **Start development server**
```bash
npm run dev
# or
yarn dev
```

4. **Open your browser**
Navigate to `http://localhost:5173`

## 📖 Usage Guide

### Step 1: Import Attendance Data

1. **Load Sample Data**: Click "Load Sample Data" to try the application with pre-configured sample data
2. **Upload JSON File**: Drag and drop or select a JSON file containing Slack messages
3. **Paste JSON**: Copy and paste Slack message JSON directly into the text area

#### Expected JSON Format:
```json
[
  {
    "user": "U01234567",
    "text": ":in: Good morning team!",
    "ts": "1704088800.000100",
    "date": "2024-01-01"
  },
  {
    "user": "U01234567",
    "text": ":out: Heading home!",
    "ts": "1704117600.000100",
    "date": "2024-01-01"
  }
]
```

### Step 2: Select Pay Period

Choose from quick presets or set custom date ranges:
- **1st - 15th**: First half of the month
- **16th - End of Month**: Second half of the month  
- **Full Month**: Entire month
- **Custom Range**: Select specific start and end dates

### Step 3: Review Payroll Summary

The dashboard displays:
- **Summary Cards**: Total gross pay, deductions, and net pay
- **Employee Table**: Detailed breakdown per employee including:
  - Total hours worked
  - Regular vs overtime hours
  - Hourly rate and gross pay
  - Deductions (late/offline penalties)
  - Net pay
  - Issue flags (late days, offline days)

### Step 4: Export Data

Click "Export CSV" to download payroll data for your finance system.

## 👥 Sample Employees

The application includes 10 sample employees with varying hourly rates:

| Name | Slack ID | Hourly Rate |
|------|----------|-------------|
| John Smith | U01234567 | $25.00 |
| Sarah Johnson | U01234568 | $30.00 |
| Michael Brown | U01234569 | $22.50 |
| Emily Davis | U01234570 | $28.00 |
| David Wilson | U01234571 | $26.75 |
| Lisa Martinez | U01234572 | $32.00 |
| James Taylor | U01234573 | $24.50 |
| Jennifer Garcia | U01234574 | $29.25 |
| Robert Anderson | U01234575 | $27.50 |
| Amanda White | U01234576 | $31.00 |

## 🧪 Testing

Run the test suite to validate parsing and calculation logic:

```bash
npm run test
# or
yarn test
```

Tests cover:
- Slack message parsing accuracy
- Payroll calculation logic
- Late arrival detection
- Overtime calculations
- CSV export functionality

## 📁 Project Structure

```
src/
├── components/           # React components
│   ├── FileUploader.tsx  # File upload and data import
│   ├── DateRangePicker.tsx # Pay period selection
│   └── PayrollTable.tsx  # Payroll summary display
├── data/                # Mock data files
│   ├── employees.json   # Sample employee data
│   └── slack-sample.json # Sample Slack messages
├── types/               # TypeScript interfaces
│   └── index.ts         # Type definitions
├── utils/               # Utility functions
│   └── payrollCalculator.ts # Core parsing and calculation logic
├── tests/               # Test files
│   └── payrollCalculator.test.ts # Unit tests
├── App.tsx              # Main application component
└── main.tsx             # Application entry point
```

## 🔧 Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run test suite
- `npm run lint` - Lint code
- `npm run preview` - Preview production build

## 🎯 Success Criteria

- ✅ Load sample logs and see correct payroll results within 2 minutes
- ✅ Parsing accuracy ≥ 95% on test dataset
- ✅ Exported CSV opens correctly in Excel/Sheets
- ✅ Responsive design works on mobile devices
- ✅ Data persists between browser sessions

## 🔄 Limitations (Phase 0 MVP)

- **No Backend**: All data stored locally in browser
- **No Authentication**: Open access to all features
- **No Real-time Sync**: Manual data import required
- **No Advanced Reporting**: Basic payroll calculations only
- **No Multi-currency**: USD only

## 🚀 Future Enhancements (Post-MVP)

- Supabase backend integration
- Slack OAuth and real-time message import
- User authentication and role-based access
- Advanced reporting and analytics
- Multi-currency support
- Email notifications and approval workflows
- Integration with external payroll systems

## 🐛 Troubleshooting

### Common Issues

1. **JSON Parse Error**: Ensure uploaded JSON follows the expected format
2. **No Data Displayed**: Check that date range includes message dates
3. **Missing Employees**: Verify Slack user IDs match employee records
4. **Export Not Working**: Ensure payroll data is calculated before exporting

### Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📞 Support

For questions or issues:
1. Check this README for solutions
2. Review the test files for expected behavior
3. Examine sample data format in `/src/data/`

---

**Built with**: React 18, TypeScript 5, Vite, TailwindCSS  
**License**: Internal Use Only  
**Version**: Phase 0 MVP 
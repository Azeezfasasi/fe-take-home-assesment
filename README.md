# NewGlobe Battery Field Support Tool

# Introduction

The NewGlobe Battery Field Support Tool is a high-performance web application designed to optimize the efficiency of in-country tech teams. In many educational environments, teacher tablets are critical tools; however, battery degradation can disrupt classroom activities.This application processes large-scale battery telemetry data to pinpoint exactly which schools and specific devices are failing. By identifying batteries that consume more than 30% of their charge per day, the tool enables field teams to prioritize their school visits based on actual hardware needs rather than guesswork. Built with Vue 3, TypeScript, and Vite, this project demonstrates a modern, scalable approach to data-driven field support, ensuring that production-quality code is delivered to solve real-world logistical challenges.

# Purpose

The primary objective of this tool is to transform raw JSON telemetry into actionable insights for the NewGlobe field support team. Specifically, the application serves three critical purposes:

- Automated Health Assessment: It implements a rigorous calculation engine to determine average daily battery usage across inconsistent data points. It intelligently excludes charging intervals to ensure that recharged devices do not skew the health metrics.
- Resource Prioritization: By ranking schools according to the volume of unhealthy devices, the tool ensures that limited field resources are deployed to the schools with the highest severity of battery issues first.
- Data Transparency: It provides a clear, drill-down view for each school, allowing the field support team to see individual device serial numbers and employee IDs associated with battery failures, facilitating faster on-site troubleshooting.
  This project prioritizes code quality and maintainability, utilizing a duration-weighted weighting mechanism to provide the most accurate assessment of battery health over time.

## Quick Start

## Prerequisites

- Node.js >= 18.0.0
- npm

## Installation & Running

```bash
# Install dependencies
npm install

# Start development server (opens in browser automatically)
npm run dev

# Run tests
npm run test

# Build for production
npm run build

# Type-check
npm run type-check

# Format and lint
npm run format
npm run lint
```

The development server will start on **http://localhost:5173**

## Project Overview

This application solves the "Field Support for Batteries" challenge by:

1. **Analyzing Battery Data**: Reads from `src/data/battery.json` and calculates daily battery consumption for each device
2. **School Prioritization**: Ranks schools by the number of devices needing battery replacement
3. **Device Tracking**: Provides device-level details including battery health status and consumption rates

### Key Features

- Dashboard showing school rankings by battery issue severity
- School detail pages showing individual device health metrics
- Comprehensive unit tests for battery calculation logic
- Responsive Tailwind CSS design
- TypeScript for type safety
- Duration-weighted battery calculation algorithm

## Battery Health Calculation

**Rule**: A device needs replacement if it uses **>30% of battery per day** on average.

**Formula**:
Daily Usage % = (Total Battery Drop % / Total Time Hours) × 24

**Key Features**:

- Excludes charging intervals (battery level increases)
- Weights intervals by duration to reduce impact of anomalies
- Marks devices with single data point as "unknown"
- Considers all readings for a device across the entire dataset

**Example**:

- Device: 100% at 9 AM, 90% at 9 PM (12 hours later)
- Drop: 10%, Time: 12 hours
- Daily Usage: (10 / 12) × 24 = 20% ✅ HEALTHY

See `IMPLEMENTATION_GUIDE.md` for detailed calculations and design rationale.

## Testing

```bash
# Run all tests
npm run test
```

**Test Coverage**: 8 comprehensive test cases covering:

- Basic discharge calculations
- Multi-interval averaging
- Charging event exclusion
- Unknown status handling
- Threshold testing
- Multi-device aggregation
- School ranking
- Multi-user device scenarios

## Project Structure

src/
|--- services/
│ |--- batteryService.ts (Core calculation logic)
│ └── tests/batteryService.test.ts (Comprehensive tests)
|--- views/
│ |--- Home.vue (Dashboard - school ranking)
│ └── SchoolDetail.vue (Device details view)
|--- router/
│ └── index.ts (Route configuration)
|--- data/
│ └── battery.json (Battery telemetry data)
|--- App.vue (Root component)
└── main.ts (App entry point)

## How to Use

### Dashboard (Home Page)

1. View all schools ranked by number of unhealthy devices
2. See summary statistics (total schools, issues, devices needing replacement)
3. Click "View" button to see device details for any school

### School Detail Page

1. See breakdown of devices in the selected school
2. Check each device's daily battery consumption rate
3. Status indicators:
   - Red: Needs replacement (>30% daily usage)
   - Green: Healthy (≤30% daily usage)
   - Gray: Unknown (insufficient data)

## Technical Stack

- **Framework**: Vue 3 (Composition API)
- **Language**: TypeScript 5.7
- **Styling**: Tailwind CSS
- **Testing**: Vitest
- **Build**: Vite
- **State Management**: Vue Router (navigation)

## Data Source

The application reads from `src/data/battery.json`, which contains:

- `academyId`: School identifier
- `batteryLevel`: Decimal percentage (0.68 = 68%)
- `employeeId`: User ID
- `serialNumber`: Device unique ID
- `timestamp`: ISO 8601 date/time with timezone

## Configuration

- **Battery Replacement Threshold**: 30% daily usage (configurable in `batteryService.ts`)
- **Data File**: `src/data/battery.json` (can be replaced with API call)
- **Base Path**: Configured in `src/config/env.ts`

## 🚪 Navigation

- `/` - Dashboard (school ranking)
- `/school/:academyId` - School detail page

## 🔍 Implementation Decisions

1. **Duration-Weighted Averaging**: Longer observation periods have more influence, reducing noise from single brief readings
2. **Charging Event Exclusion**: Devices that increase battery level between readings were charged; these intervals are ignored
3. **Service Layer Architecture**: Separates calculation logic from UI for testability and reusability
4. **TypeScript Strict Mode**: Catches potential bugs at compile time

See `IMPLEMENTATION_GUIDE.md` for detailed rationale and future improvements.

## Future Improvements

See `IMPLEMENTATION_GUIDE.md` "Future Improvements & Cut Scope" section for planned features:

- Search and filtering
- CSV/PDF exports
- Real API integration
- Advanced analytics and charts
- Device history tracking
- Multi-language support
- Accessibility enhancements

## 📞 Troubleshooting

If you encounter issues:

```bash
# Clear and reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npm run type-check

# Check that battery.json is valid JSON
npm run lint
```

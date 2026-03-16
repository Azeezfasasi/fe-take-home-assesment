# NewGlobe Battery Field Support Tool

A Vue 3 + TypeScript web application for identifying schools with battery health issues in tablet devices. This tool helps NewGlobe's field teams prioritize which schools need device maintenance based on battery consumption patterns.

## Overview

This application analyzes battery telemetry data from teacher tablets in schools and identifies devices that need battery replacement. The tool provides:

- **School Ranking Dashboard**: Lists schools ranked by the number of devices needing battery replacement
- **School Detail View**: Shows device-level battery health metrics for each school
- **Battery Health Analysis**: Sophisticated calculation of daily battery consumption rates
- **Field Team Prioritization**: Helps teams visit schools with the highest number of battery issues first

## Architecture & Design

### Core Design Principles

1. **Data as API**: The `battery.json` file is treated like an API response, making it easy to swap with a real backend later
2. **Separation of Concerns**: Logic, UI, and presentation are cleanly separated
3. **Type Safety**: Full TypeScript implementation for maintainability
4. **Testability**: Core calculation logic is isolated and thoroughly tested

### Project Structure

```
src/
├── services/
│   ├── batteryService.ts       # Core battery analysis logic
│   └── test/batteryService.test.ts  # Comprehensive unit tests
├── views/
│   ├── Home.vue                # Dashboard - School ranking
│   └── SchoolDetail.vue        # Device-level details for a school
├── router/
│   └── index.ts                # Route configuration
├── data/
│   └── battery.json            # Battery telemetry data
└── assets/
    └── styles/
        └── main.css            # Global styles (Tailwind)
```

## Battery Health Calculation

### The Formula

A device's **daily battery usage percentage** is calculated as:

Daily Usage = (Total Battery Drop % / Total Time in Hours) × 24

### Weighting Mechanism: Duration-Weighted Averaging

**Why duration-weighted?** Field devices report at unpredictable intervals (when they touch the network). A longer observation period is inherently more reliable than a brief snapshot. By weighting intervals by their duration, we ensure that sustained drain over 12 hours carries more influence than a brief 1-minute reading.

**Example:**

- Device reads 95% → 93% over 15 minutes: Drop = 2%, Duration = 0.25 hours
- Device reads 80% → 50% over 12 hours: Drop = 30%, Duration = 12 hours

The 12-hour interval carries ~48x more weight, making the overall average more representative of actual daily usage.

### Key Rules

1. **Charging Events Excluded**: If battery level increases between readings, the device was plugged in. These intervals are skipped.
2. **Minimum Data Points**: If a device has only 1 reading, its status is "unknown" (insufficient data)
3. **Threshold**: Devices with >30% daily usage need replacement
4. **All Data Considered**: Every reading for a device across the entire week is used

### Example Calculations

#### Scenario 1: Simple 12-Hour Reading

```
Reading 1: 100% at 9 AM
Reading 2: 90% at 9 PM (same day, 12 hours later)

Daily Usage = (10% / 12 hours) × 24 = 20%
Status: HEALTHY
```

#### Scenario 2: Multiple Intervals

Reading 1: 100% at Day 1, 9 AM
Reading 2: 90% at Day 1, 9 PM (12 hours)
Reading 3: 80% at Day 2, 9 PM (24 hours from Reading 2)

Total Drop: 20% (100% - 80%)
Total Time: 36 hours
Daily Usage = (20% / 36 hours) × 24 = 13.3%
Status: HEALTHY

#### Scenario 3: With Charging Event

Reading 1: 80% at 9 AM
Reading 2: 100% at 3 PM (6 hours) ← CHARGING EVENT (IGNORED)
Reading 3: 90% at 9 PM (6 hours)

Only Interval 1→3 counts:
Daily Usage = (10% / 12 hours) × 24 = 20%
Status: HEALTHY

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# The app will open at http://localhost:5173
```

### Build for Production

```bash
# Type-check the codebase
npm run type-check

# Build the optimized production bundle
npm run build

# Preview production build locally
npm run preview
```

## Testing

This project includes comprehensive unit tests for the battery calculation logic.

### Run Tests

```bash
npm run test
```

### Test Coverage

The test suite covers:

1. **Simple Discharge Calculations**: Validates the basic formula (10% drop over 12 hours = 20% daily usage)
2. **Multi-Interval Averaging**: Ensures duration-weighted averages across uneven intervals
3. **Charging Event Exclusion**: Confirms batteries increasing in level don't affect calculations
4. **Unknown Status**: Validates devices with only 1 reading are marked as "unknown"
5. **Threshold Testing**: Confirms >30% usage is flagged as "unhealthy"
6. **Multi-Device Aggregation**: Tests correct grouping and counting in schools
7. **School Ranking**: Validates schools are sorted by unhealthy device count
8. **Multi-User Devices**: Confirms devices shared by multiple employees are analyzed together

All tests follow a clear structure:

- **Scenario**: Describes the test data and conditions
- **Expected**: States what the calculation should produce
- **Validation**: Asserts the results match expectations

## Using the Application

### Dashboard (Home Page)

The dashboard displays:

- **Summary Cards**: Overall statistics (total schools, schools with issues, total unhealthy devices)
- **School Ranking Table**:
  - Priority number (1 = highest priority)
  - School ID
  - Total devices in that school
  - Number of devices needing replacement
  - Percentage of unhealthy devices (visual bar)
  - Unknown devices (insufficient data)
  - Action button to view details

**Key Features:**

- Schools are ranked by number of unhealthy devices (descending)
- Color coding: Red badges for multiple issues, orange for some issues
- Progress bars show the percentage of unhealthy devices visually

### School Detail View

Shows all devices in a specific school:

- **Device Serial Number**: Unique identifier
- **Status**: Needs Replacement | Healthy | Unknown
- **Daily Usage %**: Calculated consumption rate
- **Readings Count**: Number of data points for this device
- **Time Span**: Hours of observation
- **Recommendation**: Action item for field team

**Color Coding:**

- Red: Daily usage > 30% (urgent replacement)
- Green: Daily usage ≤ 30% (continue monitoring)
- Gray: Unknown (need more data)

## Technical Decisions & Rationale

### 1. Duration-Weighted Averaging

**Why?** Field devices report asynchronously. A 30% drop over 24 hours is more representative of actual battery health than 1% over 10 minutes. Duration-weighting ensures longer observations have more influence.

**Alternative Considered**: Simple averaging (all intervals equal weight). Rejected because it would overweight brief, potentially anomalous readings.

### 2. Automatic Charging Event Exclusion

**Why?** Users plug in devices throughout the day. If battery increases, it was charged. Including these intervals would underestimate actual drain rate.

**Example Impact**: A device dropping 20% over 12 hours, then charged to 100%, then draining 10% over 2 hours. Only counting discharge intervals gives accurate daily usage.

### 3. "Unknown" for Single-Point Devices

**Why?** You can't calculate consumption rate with only one snapshot. A device at 50% might be draining 1%/day or 99%/day. Without context, claiming either is misleading.

**Field Team Benefit**: Teachers know which devices need follow-up data collection.

### 4. Vue 3 Composition API

**Why?** Modern, readable, type-safe. Makes it easy to extract logic into composables if the app grows.

### 5. Tailwind CSS

**Why?** Utility-first approach produces clean, responsive UI without writing custom CSS. Ensures consistency across the dashboard and detail views.

## Assumptions & Constraints

1. **Latest Chrome Only**: No IE11 support, uses modern ES2020+ features
2. **Single-Week Data**: The provided battery.json represents ~7 days of data. The algorithm treats all readings together.
3. **No Real-Time Updates**: Data is static from the JSON file. A production version would fetch from an API.
4. **UTF-8 Timestamps**: All timestamps are ISO 8601 format with timezone information.
5. **No Device Metadata**: We don't track device models, ages, or original capacity. The 30% threshold applies equally to all devices.

## Future Improvements & Cut Scope

### Implemented

- School ranking by issue count
- Device-level battery health details
- Comprehensive unit tests
- Clean, responsive UI
- Duration-weighted calculation

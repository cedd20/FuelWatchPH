# FuelWatch PH - Design System & Implementation Guide

## Overview
FuelWatch PH is a mobile-first crowdsourced fuel price monitoring platform for users in the Philippines. This document outlines the complete UI/UX design system and implementation details.

## Color System

### Primary Colors
- **Primary Blue**: `#1E40AF` - Trust, navigation, CTAs
- **Primary Light**: `#3B82F6` - Hover states, highlights
- **Primary Dark**: `#1E3A8A` - Gradients, depth

### Semantic Colors
- **Success Green**: `#16A34A` - Verified updates, savings, confirmations
- **Success Light**: `#22C55E` - Success backgrounds
- **Warning Orange**: `#F59E0B` - Fuel highlights, alerts, badges
- **Warning Light**: `#FCD34D` - Warning backgrounds
- **Destructive Red**: `#DC2626` - Errors, delete actions

### Neutral Colors
- **Background**: `#FFFFFF` - Main background
- **Muted**: `#F3F4F6` - Cards, secondary backgrounds
- **Muted Foreground**: `#6B7280` - Secondary text
- **Border**: `rgba(0, 0, 0, 0.1)` - Dividers, card borders

## Typography

### Font Weights
- **Normal**: 400 - Body text, inputs
- **Medium**: 500 - Labels, buttons, navigation
- **Semibold**: 600 - Emphasized text, important data

### Hierarchy
- **H1**: Large titles (splash, main headers)
- **H2**: Section headers, screen titles
- **H3**: Card titles, subsection headers
- **H4**: Component labels
- **Body**: Standard text (16px base)
- **Small**: Supporting text, metadata (14px)
- **Extra Small**: Timestamps, captions (12px)

### Fuel Price Display
Prices are displayed prominently with:
- Large font size (24-32px)
- Bold weight (700)
- High contrast for outdoor readability
- Philippine Peso symbol (₱) prefix

## Layout Structure

### Mobile-First Grid
- Max width: 768px for optimal mobile viewing
- Padding: 16px (1rem) default page margins
- Gap: 12px between cards, 8px for chips

### Bottom Navigation
- Height: 64px (4rem)
- 5 main sections: Home, Map, Compare, Saved, Profile
- Active state: Primary color
- Inactive state: Muted foreground

### Screen Sections
1. **Header**: Gradient background, white text, key info
2. **Content**: Scrollable main area
3. **Bottom Nav/Actions**: Fixed at bottom

## Component Library

### 1. StationCard
Displays station information with:
- Station name + verification badge
- Address with map pin icon
- Distance from user
- Last updated timestamp
- Fuel prices in grid (3 columns)
- Verified indicator
- Chevron for navigation

**States**: Default, Hover, Selected

### 2. FuelTypeChip
Pill-shaped filter buttons:
- Active: Primary background, white text
- Inactive: Muted background, gray text
- Rounded-full border radius
- Compact padding (8px x 16px)

### 3. Button
Multiple variants:
- **Primary**: Blue background, white text
- **Secondary**: Muted background
- **Outline**: Border with transparent bg
- **Ghost**: No background
- **Success**: Green for confirmations
- **Destructive**: Red for delete/cancel

Sizes: Small, Medium, Large
Optional icon support

### 4. EmptyState
Centered content with:
- Icon in circular muted background
- Title (h3)
- Description text
- Optional CTA button

### 5. Trust Indicators
- **ShieldCheck Icon**: Verified stations
- **Accuracy Percentage**: 95% accuracy badge
- **Contributor Count**: "Verified by X contributors"
- **Trust Badge**: "Trusted" label with success color

## Key Screens

### 1. Splash Screen
- Full-screen gradient background (primary to primary-dark)
- Centered app icon and name
- Auto-navigates to onboarding (2s delay)

### 2. Onboarding (3 slides)
- Icon illustration
- Title and description
- Pagination dots
- Skip and Next/Get Started buttons
**Topics**: Find stations, Compare prices, Community powered

### 3. Login/Sign Up
- Gradient header with branding
- Email + password inputs
- Google Sign In option
- Form validation
- Toggle password visibility

### 4. Location Permission
- Explanation of why location is needed
- Benefits list with icons
- Allow/Skip options
- Trust-building messaging

### 5. Home Dashboard
**Header**:
- App name + current location
- Notification bell with badge
- Search bar

**Content**:
- Fuel type filter chips (horizontal scroll)
- "Cheapest Nearby" featured card
- Nearby stations list
- Quick action cards (Add Station, My Updates)

### 6. Map View
- Interactive map (mocked with gradient)
- Station pins (clickable markers)
- Fuel type filters at top
- Right-side controls (locate, filter, list toggle)
- Bottom sheet for selected station or station list
- Smooth transitions between views

### 7. Station Detail
**Header**:
- Back, Share, Save buttons
- Station name and address
- Distance and last updated

**Content**:
- Trust indicator card (accuracy, contributors)
- Fuel prices with trend indicators
- Price history/changes
- Bottom action buttons (Update, Directions, Report)

### 8. Update Fuel Price
**Components**:
- Location verification banner (green/orange)
- Fuel type selection (radio cards)
- Price input with ₱ prefix
- Price change indicator
- Guidelines box
- Disabled submit if not near station

**Success State**: Checkmark animation, confirmation message

### 9. Compare Prices
- Fuel type tabs
- "Lowest Price" banner card
- Sorted station list (cheapest first)
- Price difference indicators
- Savings estimator (40L/60L tanks)

### 10. Add New Station
- Station name input with duplicate detection
- Address input with location picker
- Optional fuel prices (4 types)
- Guidelines reminder
- Warning for duplicates

### 11. Saved Stations
- Search bar
- Station cards (saved favorites)
- Empty state if no saves

### 12. Profile
- User avatar and name
- Reputation badge
- Stats cards (Updates, Accuracy, Points)
- Recent achievements
- Menu items (Contributions, Notifications, Settings, Help, Terms)
- Sign out button
- App version

### 13. Settings
Sections:
- **Notifications**: Toggle for price alerts, nearby stations, weekly digest
- **Location**: Search radius selector
- **Fuel Preferences**: Default fuel type
- **App Settings**: Language, distance unit
- **Account**: Edit profile, change password, delete account

### 14. Contribution History
- Total updates and accuracy stats
- List of price updates with:
  - Station name
  - Fuel type and price
  - Date/time
  - Verification status (verified/pending)

### 15. Notifications
- Unread indicator (blue dot)
- Icon-based notification types:
  - Price drop (trending down, green)
  - New station (map pin, blue)
  - Verification (checkmark, green)
- Mark all read option

### 16. Report Issue
- Reason selection (radio cards)
- Optional details textarea
- Info box about report purpose
- Success confirmation

## Interaction Patterns

### Tap Targets
- Minimum 44px × 44px for all interactive elements
- Adequate spacing between clickable items

### Transitions
- Smooth page transitions (React Router)
- Hover states on cards (shadow elevation)
- Active states on chips and buttons
- Loading states with skeletons (not implemented but recommended)

### Feedback
- Toast notifications (sonner) for actions
- Success modals for submissions
- Inline validation on forms
- Visual confirmation of selections (checkmarks)

### Gestures
- Tap to navigate
- Horizontal scroll for chips/filters
- Bottom sheet drag (map view)
- Pull to refresh (recommended for lists)

## States & Edge Cases

### Loading States
- Skeleton cards for station lists
- Spinner for search/fetch operations

### Empty States
- No saved stations
- No contributions
- No notifications
- No search results
- No nearby stations

### Error States
- Location permission denied
- No internet connection
- Failed submission
- Invalid form input
- Too far from station (update blocked)

### Success States
- Price updated successfully
- Station added
- Report submitted
- Settings saved

### Validation States
- Location verified (green banner)
- Too far from station (orange banner)
- Duplicate station warning (yellow banner)
- Form field errors (red border + message)

## Accessibility Considerations

### Color Contrast
- All text meets WCAG AA standards
- Interactive elements have clear focus states
- Error states use both color and icons/text

### Touch Targets
- All buttons and interactive elements ≥ 44px
- Adequate spacing prevents mis-taps

### Readability
- Clear hierarchy with font sizes
- High contrast for outdoor use
- Important info (prices) prominently displayed

### Icons
- Icons paired with text labels
- Meaningful alt text where needed

## Responsive Behavior

### Mobile (< 768px)
- Single column layout
- Bottom navigation
- Full-width cards
- Horizontal scroll for chips

### Tablet (768px - 1024px)
- Two-column grids for cards
- Wider map + list side-by-side
- Larger touch targets

### Desktop (> 1024px)
- Max-width container (1024px)
- Top or side navigation option
- Multi-column dashboard
- Map and list split view
- Persistent filter sidebar

## Trust & Verification UX

### Visual Trust Indicators
- **Green ShieldCheck Icon**: Verified by community
- **Accuracy Percentage**: 95%+ shown with success color
- **Contributor Count**: Number of verifiers
- **Trusted Badge**: Pill badge with success background
- **Time Indicator**: "Updated 2 mins ago" creates urgency

### Location Validation
- GPS check before price updates
- Visual confirmation (green banner) when in range
- Warning (orange banner) when too far
- Prevents fake submissions

### Reporting System
- Easy access to report button
- Multiple report reasons
- Optional details field
- Thank you confirmation

## Data Display Patterns

### Price Formatting
- Philippine Peso: ₱XX.XX
- Two decimal places always
- Per liter notation
- Large, bold numbers

### Distance
- Kilometers: X.X km
- One decimal place
- Nearby threshold: < 5km highlighted

### Time
- Recent: "2 mins ago", "1 hour ago"
- Today: "Today, 2:30 PM"
- Past: "Yesterday", "Apr 13"

### Trends
- Down arrow (green) for price drops
- Up arrow (red) for price increases
- Change amount: ₱X.XX lower/higher

## Implementation Notes

### Tech Stack
- **Framework**: React 18.3.1
- **Routing**: React Router 7.13.0
- **Styling**: Tailwind CSS 4.x
- **Icons**: Lucide React
- **Notifications**: Sonner (toast)
- **Build**: Vite 6.x

### File Structure
```
/src
  /app
    /screens        (All main screens)
    /components     (Reusable UI components)
    routes.tsx      (React Router configuration)
    App.tsx         (Root component)
  /styles
    theme.css       (Color variables)
    index.css       (Global styles)
```

### Key Components Created
- Layout (with bottom nav)
- StationCard
- FuelTypeChip
- Button
- EmptyState

### Screen Routes
- `/` - Splash
- `/onboarding` - Onboarding flow
- `/login` - Login
- `/signup` - Sign up
- `/location-permission` - Location request
- `/app` - Main app with nested routes:
  - `/app` - Home dashboard
  - `/app/map` - Map view
  - `/app/compare` - Compare prices
  - `/app/saved` - Saved stations
  - `/app/profile` - User profile
  - `/app/station/:id` - Station detail
  - `/app/update-price/:id` - Update price
  - `/app/add-station` - Add new station
  - `/app/report/:id` - Report issue
  - `/app/contributions` - Contribution history
  - `/app/notifications` - Notifications
  - `/app/settings` - Settings

## Mock Data

All screens use realistic mock data for demonstration:
- Station names (Petron, Shell, Caltex, Seaoil)
- Philippine locations (Quezon City, EDSA, Mandaluyong)
- Fuel prices in PHP (₱55-73 range)
- Realistic timestamps
- Verification statuses

## Future Enhancements

### Recommended Features
1. Real-time database integration (Supabase)
2. Actual map integration (Google Maps / Mapbox)
3. User authentication
4. Photo uploads for price verification
5. Push notifications
6. Offline support with service workers
7. Share station links
8. Price history charts (Recharts)
9. Gamification (badges, leaderboards)
10. Admin moderation panel

### Performance Optimization
- Image lazy loading
- Virtual scrolling for long lists
- Code splitting by route
- PWA capabilities
- Caching strategies

## Design Philosophy

**Mobile-First**: Optimized for on-the-go fuel searches
**Trust-Driven**: Community verification builds confidence
**Clarity**: Clear information hierarchy, easy scanning
**Speed**: Quick access to critical data (prices, distance)
**Practical**: Real-world utility for everyday drivers

---

## Credits

**Design System**: FuelWatch PH
**Platform**: Figma Make
**Version**: 1.0.0
**Last Updated**: April 15, 2026

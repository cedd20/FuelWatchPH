import { createBrowserRouter, Navigate } from "react-router-dom";
import { Layout } from "@/shared/components/Layout";
import { AdminLayout } from "@/shared/components/admin/AdminLayout";
import { AdminRouteGuard } from "@/shared/components/admin/AdminRouteGuard";
import { Splash } from "@/features/Splash";
import { Onboarding } from "@/features/Onboarding";
import { Login } from "@/features/Login";
import { SignUp } from "@/features/SignUp";
import { LocationPermission } from "@/features/LocationPermission";
import { Home } from "@/features/Home";
import { Map } from "@/features/Map";
import { StationDetail } from "@/features/StationDetail";
import { Compare } from "@/features/Compare";
import { UpdatePrice } from "@/features/UpdatePrice";
import { AddStation } from "@/features/AddStation";
import { SavedStations } from "@/features/SavedStations";
import { ContributionHistory } from "@/features/ContributionHistory";

import { Profile } from "@/features/Profile";
import { Settings } from "@/features/Settings";
import { Leaderboard } from "@/features/Leaderboard";
import { ReportPrice } from "@/features/ReportPrice";
import { GasHistory } from "@/features/GasHistory";
import { ReportIssue } from "@/features/ReportIssue";
import { Support } from "@/features/Support";
import { Terms } from "@/features/Terms";
import { EditProfile } from "@/features/EditProfile";
import { VerificationRequest } from "@/features/VerificationRequest";
import { AdminDashboard } from "@/features/admin/AdminDashboard";
import { VerificationQueue } from "@/features/admin/VerificationQueue";
import { VerificationDetail } from "@/features/admin/VerificationDetail";
import { VerifiedUsers } from "@/features/admin/VerifiedUsers";
import { FuelReports } from "@/features/admin/FuelReports";
import { StationReports } from "@/features/admin/StationReports";
import { StationReportDetail } from "@/features/admin/StationReportDetail";
import { UserManagement } from "@/features/admin/UserManagement";
import { BannedUsers } from "@/features/admin/BannedUsers";
import { AdminActivityLog } from "@/features/admin/AdminActivityLog";
import { AdminSettings } from "@/features/admin/AdminSettings";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Splash />,
  },
  {
    path: "/onboarding",
    element: <Onboarding />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/signup",
    element: <SignUp />,
  },
  {
    path: "/location-permission",
    element: <LocationPermission />,
  },
  {
    path: "/app",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Map />,
      },
      {
        path: "home",
        element: <Home />,
      },
      {
        path: "map",
        element: <Map />,
      },
      {
        path: "compare",
        element: <Compare />,
      },
      {
        path: "gas-history",
        element: <GasHistory />,
      },
      {
        path: "saved",
        element: <SavedStations />,
      },
      {
        path: "profile",
        element: <Profile />,
      },
      {
        path: "edit-profile",
        element: <EditProfile />,
      },
      {
        path: "verify-identity",
        element: <VerificationRequest />,
      },
      {
        path: "leaderboard",
        element: <Leaderboard />,
      },
      {
        path: "station/:id",
        element: <StationDetail />,
      },
      {
        path: "update-price/:id",
        element: <UpdatePrice />,
      },
      {
        path: "add-station",
        element: <AddStation />,
      },
      {
        path: "report/:id",
        element: <ReportPrice />,
      },
      {
        path: "report-issue/:id",
        element: <ReportIssue />,
      },
      {
        path: "contributions",
        element: <ContributionHistory />,
      },

      {
        path: "settings",
        element: <Settings />,
      },
      {
        path: "support",
        element: <Support />,
      },
      {
        path: "terms",
        element: <Terms />,
      },
    ],
  },
  {
    path: "/admin",
    element: <AdminRouteGuard />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="/admin/dashboard" replace />,
          },
          {
            path: "dashboard",
            element: <AdminDashboard />,
          },
          {
            path: "verification-queue",
            element: <VerificationQueue />,
          },
          {
            path: "verification/:id",
            element: <VerificationDetail />,
          },
          {
            path: "verified-users",
            element: <VerifiedUsers />,
          },
          {
            path: "fuel-reports",
            element: <FuelReports />,
          },
          {
            path: "station-reports",
            element: <StationReports />,
          },
          {
            path: "station-reports/:id",
            element: <StationReportDetail />,
          },
          {
            path: "user-management",
            element: <UserManagement />,
          },
          {
            path: "banned-users",
            element: <BannedUsers />,
          },
          {
            path: "activity-log",
            element: <AdminActivityLog />,
          },
          {
            path: "settings",
            element: <AdminSettings />,
          },
        ],
      },
    ],
  },
]);

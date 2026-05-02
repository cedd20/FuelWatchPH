import { createBrowserRouter } from "react-router";
import { Layout } from "@/shared/components/Layout";
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
import { Notifications } from "@/features/Notifications";
import { Profile } from "@/features/Profile";
import { Settings } from "@/features/Settings";
import { Leaderboard } from "@/features/Leaderboard";
import { ReportPrice } from "@/features/ReportPrice";
import { GasHistory } from "@/features/GasHistory";
import { ReportIssue } from "@/features/ReportIssue";
import { Support } from "@/features/Support";
import { Terms } from "@/features/Terms";
import { EditProfile } from "@/features/EditProfile";


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
        path: "notifications",
        element: <Notifications />,
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
]);

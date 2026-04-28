import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Splash } from "./screens/Splash";
import { Onboarding } from "./screens/Onboarding";
import { Login } from "./screens/Login";
import { SignUp } from "./screens/SignUp";
import { LocationPermission } from "./screens/LocationPermission";
import { Home } from "./screens/Home";
import { Map } from "./screens/Map";
import { StationDetail } from "./screens/StationDetail";
import { Compare } from "./screens/Compare";
import { UpdatePrice } from "./screens/UpdatePrice";
import { AddStation } from "./screens/AddStation";
import { SavedStations } from "./screens/SavedStations";
import { ContributionHistory } from "./screens/ContributionHistory";
import { Notifications } from "./screens/Notifications";
import { Profile } from "./screens/Profile";
import { Settings } from "./screens/Settings";
import { ReportPrice } from "./screens/ReportPrice";
import { GasHistory } from "./screens/GasHistory";
import { ReportIssue } from "./screens/ReportIssue";

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
    ],
  },
]);

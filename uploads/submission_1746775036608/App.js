import { Route, Routes, Navigate } from "react-router-dom";
import { useAuth } from "./context/userContext";
import Home from "./Screen/Screen/Home";
import Login from "./Screen/UserRegisteraton/Login";
import Register from "./Screen/UserRegisteraton/register";
import PrivateRoute from "./ProtectedRoute/PrivateRoute";

import AdminRoute from "./ProtectedRoute/AdminRoute";
import AdminDashboard from "./Screen/Screen/AdminScreen/AdminDashboard";
import ClientDashboard from "./Screen/Screen/ClientDashboard/ClientDashboard";
import Membership from "./Screen/Screen/ClientDashboard/Billing";
import Profile from "./Screen/Screen/ClientDashboard/Profile";
import Setting from "./Screen/Screen/ClientDashboard/Setting";
import Tabs from "./Screen/Screen/freelancerDshboard/TapBar/Tabs";
import ProjectDetail from "./Screen/Screen/freelancerDshboard/ProjectDetail";
import PlanCreate from "./Screen/Screen/AdminScreen/PlanCreate";
import Plans from "./Screen/Screen/freelancerDshboard/Plans";
import PlanManagement from "./Screen/Screen/freelancerDshboard/PlanManagement";
import PurchaseManagement from "./Screen/Screen/AdminScreen/PurchaseManagement";
import UserManagement from "./Screen/Screen/AdminScreen/UserManagement";
import ApplicantDetail from "./Screen/Screen/ClientDashboard/ApplicantDetail";
import FreelancerProfile from "./Screen/Screen/ClientDashboard/FreelancerProfile";
import ProjectList from "./Screen/Screen/freelancerDshboard/ProjectList";
import MyProposal from "./Screen/Screen/freelancerDshboard/MyProposal";
import UserHireProject from "./Screen/Screen/freelancerDshboard/UserHireProject";
import UserMessage from "./Screen/Screen/freelancerDshboard/UserMessage";
import DashboardOverview from "./Screen/Screen/freelancerDshboard/DashboardOverview";

function App() {
  const { auth, getDashboardPath } = useAuth();

  return (
    <Routes>
      {/* Public routes with redirect if authenticated */}
      <Route
        path="/"
        element={
          auth.token ? (
            <Navigate to={getDashboardPath(auth)} replace />
          ) : (
            <Home />
          )
        }
      />
      <Route
        path="/login"
        element={
          auth.token ? (
            <Navigate to={getDashboardPath(auth)} replace />
          ) : (
            <Login />
          )
        }
      />
      <Route
        path="/register"
        element={
          auth.token ? (
            <Navigate to={getDashboardPath(auth)} replace />
          ) : (
            <Register />
          )
        }
      />

      {/* Protected routes */}
      <Route path="/BiZy/user/dashboard" element={<PrivateRoute />}>
        <Route path="freelancer" element={<DashboardOverview />} />
        <Route path="client" element={<ClientDashboard />} />
        <Route path="client/billing" element={<Membership />} />
        <Route path="client/profile" element={<Profile />} />
        <Route path="client/setting" element={<Setting />} />
        <Route path="client/tabs" element={<Tabs />} />
        <Route path="client/plan" element={<Plans />} />

        <Route path="client/projectdetail/:id" element={<ProjectDetail />} />
        <Route path="client/planmanagement" element={<PlanManagement />} />
        <Route path="client/findproject" element={<ProjectList />} />
        <Route path="client/proposal" element={<MyProposal />} />
        <Route path="client/hireproject" element={<UserHireProject />} />
        <Route path="client/message" element={<UserMessage />} />

        <Route
          path="client/freelancerprofile/:id"
          element={<FreelancerProfile />}
        />

        <Route
          path="client/applicant/:projectId"
          element={<ApplicantDetail />}
        />
      </Route>

      <Route path="/BiZy/admin/dashboard" element={<AdminRoute />}>
        <Route path="admin" element={<AdminDashboard />} />
        <Route path="admin/plans" element={<PlanCreate />} />
        <Route path="admin/purchase" element={<PurchaseManagement />} />
        <Route path="admin/users" element={<UserManagement />} />
      </Route>

      {/* Fallback route */}
      <Route
        path="*"
        element={
          <Navigate
            to={auth.token ? getDashboardPath(auth) : "/login"}
            replace
          />
        }
      />
    </Routes>
  );
}

export default App;

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LandingPage } from "../pages/LandingPage";
import { LoginPage } from "../pages/LoginPage";
import { Dashboard } from "../pages/Dashboard";
import { ContactAdminPage } from "../pages/ContactAdminPage";
import { NotFound } from "../pages/NotFound";

import { ClientDashboard } from "../dashboards/ClientDashboard";
import { ParalegalDashboard } from "../dashboards/ParalegalDashboard";
import { LawyerDashboard } from "../dashboards/LawyerDashboard";
import { AdminDashboard } from "../dashboards/AdminDashboard";

import { UploadContractPage } from "../contracts/UploadContractPage";
import { ViewContractPage } from "../contracts/ViewContractPage";
import { ContractSummaryPage } from "../contracts/ContractSummaryPage";

import { ManageClients } from "../management/ManageClients";
import { ManageUsersPage } from "../management/ManageUsersPage";
import { ManageUsersLawyer } from "../management/ManageUsersLawyer";
import { ResultPage } from "../pages/ResultPage";

export function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/landing" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/contact-admin" element={<ContactAdminPage />} />
                <Route path="/client-dashboard" element={<ClientDashboard />} />
                <Route path="/paralegal-dashboard" element={<ParalegalDashboard />} />
                <Route path="/lawyer-dashboard" element={<LawyerDashboard />} />
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="/manage-users" element={<ManageUsersPage />} />
                <Route path="/manage-users-lawyer" element={<ManageUsersLawyer />} />
                <Route path="/manage-clients" element={<ManageClients />} />
                <Route path="/upload-contract" element={<UploadContractPage />} />
                <Route path="/view-contract/:id" element={<ViewContractPage />} />
                <Route path="/contract-summary/:id" element={<ContractSummaryPage />} />
                <Route path="/result/:contractId" element={<ResultPage />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    );
}

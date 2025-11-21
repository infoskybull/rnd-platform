import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store";
import LandingPage from "./pages/LandingPage";
import MainPage from "./pages/MainPage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import DashboardRouter from "./pages/DashboardRouter";
import CreateProjectPage from "./pages/CreateProjectPage";
import CreateProjectAIPage from "./pages/CreateProjectAIPage";
import CreateProjectUploadPreviewPage from "./pages/CreateProjectUploadPreviewPage";
import CreateProjectCreatePage from "./pages/CreateProjectCreatePage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import ContractDetailPage from "./pages/ContractDetailPage";
import CollaborationDetailPage from "./pages/CollaborationDetailPage";
import ProfilePage from "./pages/ProfilePage";
import GlobalScrollbarStyles from "./components/GlobalScrollbarStyles";
import NotFoundPage from "./pages/NotFoundPage";
import ForbiddenPage from "./pages/ForbiddenPage";
import PlanPage from "./pages/PlanPage";
import ManagePlanPage from "./pages/ManagePlanPage";
import PaymentPage from "./pages/PaymentPage";
import PaymentCompletePage from "./pages/PaymentCompletePage";
import PaymentCancelPage from "./pages/PaymentCancelPage";

// Route Wrappers
import PublisherRouteWrapper from "./components/PublisherRouteWrapper";
import CreatorRouteWrapper from "./components/CreatorRouteWrapper";
import AdminRouteWrapper from "./components/AdminRouteWrapper";

// Context Providers
import { SidebarProvider } from "./contexts/SidebarContext";
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { THEME } from "@tonconnect/ui";
import { EthereumWalletProvider } from "./contexts/EthereumWalletContext";
import { SuiWalletProvider } from "./contexts/SuiWalletContext";
import { SolanaWalletProvider } from "./contexts/SolanaWalletContext";

function App() {
  return (
    <Provider store={store}>
      <EthereumWalletProvider>
        <SuiWalletProvider>
          <SolanaWalletProvider>
            <TonConnectUIProvider
              manifestUrl="https://dev1line.github.io/nft-factory/tonconnect-manifest.json"
              uiPreferences={{
                theme: THEME.DARK,
                borderRadius: "m",
              }}
              walletsListConfiguration={{
                includeWallets: [
                  {
                    appName: "tonwallet",
                    name: "TON Wallet",
                    imageUrl: "https://wallet.ton.org/assets/ui/qr-logo.png",
                    aboutUrl:
                      "https://chrome.google.com/webstore/detail/ton-wallet/nphplpgoakhhjchkkhmiggakijnkhfnd",
                    universalLink: "https://wallet.ton.org/ton-connect",
                    jsBridgeKey: "tonwallet",
                    bridgeUrl: "https://bridge.tonapi.io/bridge",
                    platforms: ["chrome", "android"],
                  },
                  {
                    appName: "mytonwallet",
                    name: "MyTonWallet",
                    imageUrl:
                      "https://mytonwallet.io/static/tonconnect_logo.png",
                    aboutUrl: "https://mytonwallet.io/",
                    universalLink: "https://connect.mytonwallet.org",
                    jsBridgeKey: "mytonwallet",
                    bridgeUrl: "https://bridge.tonapi.io/bridge",
                    platforms: ["chrome", "android"],
                  },
                ],
              }}
            >
              <SidebarProvider>
                <Router>
                  <GlobalScrollbarStyles />
                  <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignUpPage />} />
                    <Route
                      path="/forgot-password"
                      element={<ForgotPasswordPage />}
                    />

                    {/* Protected routes */}
                    <Route path="/main" element={<MainPage />} />
                    <Route path="/dashboard" element={<DashboardRouter />} />

                    {/* Publisher Dashboard Routes */}
                    <Route
                      path="/dashboard/publisher/browse-games"
                      element={<PublisherRouteWrapper page="browse-games" />}
                    />
                    <Route
                      path="/dashboard/publisher/messages"
                      element={<PublisherRouteWrapper page="messages" />}
                    />
                    <Route
                      path="/dashboard/publisher/inventory"
                      element={<PublisherRouteWrapper page="inventory" />}
                    />
                    <Route
                      path="/dashboard/publisher/collaborations"
                      element={<PublisherRouteWrapper page="collaborations" />}
                    />
                    <Route
                      path="/dashboard/publisher/contracts"
                      element={<PublisherRouteWrapper page="contracts" />}
                    />
                    <Route
                      path="/dashboard/publisher/stats"
                      element={<PublisherRouteWrapper page="stats" />}
                    />
                    <Route
                      path="/dashboard/publisher/history"
                      element={<PublisherRouteWrapper page="history" />}
                    />
                    <Route
                      path="/dashboard/publisher/settings"
                      element={<PublisherRouteWrapper page="settings" />}
                    />

                    {/* Creator Dashboard Routes */}
                    <Route
                      path="/dashboard/creator/your-projects"
                      element={<CreatorRouteWrapper page="your-projects" />}
                    />
                    <Route
                      path="/dashboard/creator/messages"
                      element={<CreatorRouteWrapper page="messages" />}
                    />
                    <Route
                      path="/dashboard/creator/collaborations"
                      element={<CreatorRouteWrapper page="collaborations" />}
                    />
                    <Route
                      path="/dashboard/creator/contracts"
                      element={<CreatorRouteWrapper page="contracts" />}
                    />
                    <Route
                      path="/dashboard/creator/stats"
                      element={<CreatorRouteWrapper page="stats" />}
                    />
                    <Route
                      path="/dashboard/creator/history"
                      element={<CreatorRouteWrapper page="history" />}
                    />
                    <Route
                      path="/dashboard/creator/settings"
                      element={<CreatorRouteWrapper page="settings" />}
                    />

                    {/* Admin Dashboard Routes */}
                    <Route
                      path="/admin/accounts"
                      element={<AdminRouteWrapper page="accounts" />}
                    />
                    <Route
                      path="/admin/messages"
                      element={<AdminRouteWrapper page="messages" />}
                    />
                    <Route
                      path="/admin/reports"
                      element={<AdminRouteWrapper page="reports" />}
                    />
                    {/* Redirect old /admin/management to /admin/accounts */}
                    <Route
                      path="/admin/management"
                      element={<Navigate to="/admin/accounts" replace />}
                    />

                    <Route
                      path="/create-project"
                      element={<CreateProjectPage />}
                    />
                    <Route
                      path="/create-project/ai"
                      element={<CreateProjectAIPage />}
                    />
                    <Route
                      path="/create-project/upload/preview"
                      element={<CreateProjectUploadPreviewPage />}
                    />
                    <Route
                      path="/create-project/create"
                      element={<CreateProjectCreatePage />}
                    />
                    <Route
                      path="/project-detail/:id"
                      element={<ProjectDetailPage />}
                    />
                    <Route
                      path="/contract/detail/:id"
                      element={<ContractDetailPage />}
                    />
                    <Route
                      path="/collaboration/:id"
                      element={<CollaborationDetailPage />}
                    />
                    <Route path="/profile/:userId" element={<ProfilePage />} />

                    {/* Error Pages */}
                    <Route path="/404" element={<NotFoundPage />} />
                    <Route path="/403" element={<ForbiddenPage />} />

                    {/* Plan and Payment Routes */}
                    <Route path="/plan" element={<PlanPage />} />
                    <Route path="/manage-plan" element={<ManagePlanPage />} />
                    <Route path="/payment" element={<PaymentPage />} />
                    <Route
                      path="/payment/complete"
                      element={<PaymentCompletePage />}
                    />
                    <Route
                      path="/payment/cancel"
                      element={<PaymentCancelPage />}
                    />

                    {/* Catch all route - redirect to /404 */}
                    <Route path="*" element={<Navigate to="/404" replace />} />
                  </Routes>
                </Router>
              </SidebarProvider>
            </TonConnectUIProvider>
          </SolanaWalletProvider>
        </SuiWalletProvider>
      </EthereumWalletProvider>
    </Provider>
  );
}

export default App;

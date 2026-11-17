import { Suspense } from "react";
import { Navigate, Route, Routes } from "react-router";
import CenteringGrid from "../../styles/global/CenteringGrid";
import DevitrakLoading from "../../components/animation/DevitrakLoading";
import ErrorBoundary from "../../components/utils/ErrorBoundary";
import { lazyWithRetry } from "../lazyWithRetry";
import PlatformGuard from "./PlatformGuard";

/**
 * The Devitrak Admin Console is its own page, not a screen inside a client
 * company's dashboard: no client navigation bar, no client footer, no
 * company name in a bar above it, and no 1400px content cap. It owns the
 * whole viewport and brings its own shell (PlatformLayout).
 *
 * That is not decoration. An operator here is looking at every client at
 * once; leaving one client company's chrome around the screen says the
 * opposite, and invites the mistake of reading a cross-client number as that
 * company's.
 *
 * AuthRoutes hands every /platform path straight here.
 */
const PlatformLayout = lazyWithRetry(() => import("../../pages/platform/PlatformLayout"));
const PlatformClientsPage = lazyWithRetry(() =>
  import("../../pages/platform/PlatformClientsPage")
);
const PlatformClientProfilePage = lazyWithRetry(() =>
  import("../../pages/platform/PlatformClientProfilePage")
);
const PlatformOverviewPage = lazyWithRetry(() =>
  import("../../pages/platform/PlatformOverviewPage")
);
const PlatformListPage = lazyWithRetry(() => import("../../pages/platform/PlatformListPage"));

const PlatformRoutes = () => (
  <Suspense
    fallback={
      <div style={{ ...CenteringGrid, minHeight: "100dvh" }}>
        <DevitrakLoading />
      </div>
    }
  >
    <ErrorBoundary>
      <Routes>
        <Route element={<PlatformGuard />}>
          <Route path="/platform" element={<PlatformLayout />}>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<PlatformOverviewPage />} />
            <Route path="clients" element={<PlatformClientsPage />} />
            <Route path="clients/:companyId" element={<PlatformClientProfilePage />} />
            <Route path="inventory" element={<PlatformListPage screenKey="inventory" />} />
            <Route path="transactions" element={<PlatformListPage screenKey="transactions" />} />
            <Route path="events" element={<PlatformListPage screenKey="events" />} />
            <Route path="people" element={<PlatformListPage screenKey="people" />} />
            <Route path="audit" element={<PlatformListPage screenKey="audit" />} />
            {/* Anything else under /platform is a typo, not an error page in
                the client app's chrome. */}
            <Route path="*" element={<Navigate to="/platform/overview" replace />} />
          </Route>
        </Route>
      </Routes>
    </ErrorBoundary>
  </Suspense>
);

export default PlatformRoutes;

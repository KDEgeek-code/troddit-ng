import React, { Suspense } from "react";
import { useMainContext } from "../MainContext";

export const LazyLoginModal = React.lazy(() => import("./LoginModal"));
export const LazyPostModal = React.lazy(() => import("./PostModal"));
export const LazyPremiumModal = React.lazy(() => import("./PremiumModal"));
export const LazyRateLimitModal = React.lazy(() => import("./RateLimitModal"));
export const LazyFilterModal = React.lazy(() => import("./FilterModal"));
export const LazySubInfoModal = React.lazy(() => import("./SubInfoModal"));
export const LazyMultiManageModal = React.lazy(() => import("./MultiManageModal"));
export const LazyMediaModal = React.lazy(() => import("./MediaModal"));

export const ModalProvider = () => {
  const context: any = useMainContext();
  return (
    <>
      <Suspense fallback={null}>
        {context?.loginModal && <LazyLoginModal />}
      </Suspense>
      <Suspense fallback={null}>
        {context?.premiumModal && <LazyPremiumModal />}
      </Suspense>
      <Suspense fallback={null}>
        {context?.rateLimitModal?.show && <LazyRateLimitModal />}
      </Suspense>
    </>
  );
};

export default ModalProvider;


import React from "react";
import { UIProvider } from "./UIContext";
import { MediaProvider } from "./MediaContext";
import { FilterProvider } from "./FilterContext";
import { MainProvider } from "../MainContext";

interface AppProvidersProps {
  children: React.ReactNode;
}

/**
 * AppProviders component that wraps the entire application with all context providers
 * in the correct dependency order:
 * - UIProvider: UI layout and display preferences
 * - MediaProvider: Media playback and quality settings  
 * - FilterProvider: Content filtering logic
 * - MainProvider: Core app state (slimmed down)
 */
export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <UIProvider>
      <MediaProvider>
        <FilterProvider>
          <MainProvider>
            {children}
          </MainProvider>
        </FilterProvider>
      </MediaProvider>
    </UIProvider>
  );
};

export default AppProviders;
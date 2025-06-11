// Theme integration utilities for matching any Shopify theme

export interface ThemeConfig {
  primaryColor: string
  secondaryColor: string
  fontFamily: string
  borderRadius: string
  spacing: string
  buttonStyle: "rounded" | "square" | "pill"
  filterStyle: "sidebar" | "dropdown" | "modal"
}

export const detectThemeConfig = async (shopDomain: string): Promise<ThemeConfig> => {
  // In a real implementation, this would analyze the current theme
  // and extract styling information

  return {
    primaryColor: "#000000",
    secondaryColor: "#666666",
    fontFamily: "system-ui",
    borderRadius: "4px",
    spacing: "16px",
    buttonStyle: "rounded",
    filterStyle: "sidebar",
  }
}

export const generateThemeCSS = (config: ThemeConfig): string => {
  return `
    .boost-search-filter {
      --primary-color: ${config.primaryColor};
      --secondary-color: ${config.secondaryColor};
      --font-family: ${config.fontFamily};
      --border-radius: ${config.borderRadius};
      --spacing: ${config.spacing};
    }
    
    .boost-search-filter .filter-button {
      background-color: var(--primary-color);
      color: white;
      border-radius: var(--border-radius);
      padding: var(--spacing);
      font-family: var(--font-family);
    }
    
    .boost-search-filter .filter-sidebar {
      border-radius: var(--border-radius);
      padding: var(--spacing);
    }
    
    .boost-search-filter .search-input {
      border-radius: var(--border-radius);
      font-family: var(--font-family);
      border: 1px solid var(--secondary-color);
    }
  `
}

export const injectThemeStyles = (config: ThemeConfig) => {
  const css = generateThemeCSS(config)
  const styleElement = document.createElement("style")
  styleElement.textContent = css
  document.head.appendChild(styleElement)
}

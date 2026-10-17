/**
 * sample-data.js
 * Provides rich sample JSON for demo and testing purposes.
 */
export const SAMPLE_JSON = {
  app: "Online JSON Viewer",
  version: "1.0.0",
  releaseYear: 2026,
  isPrivacyFirst: true,
  rating: 4.98,
  metrics: {
    totalDownloads: 125000,
    uptimePercent: 99.99,
    latencyMs: -0.5
  },
  features: [
    "Format & Beautify (2 spaces)",
    "Minify to single line",
    "Interactive collapsible tree view",
    "Full-text search & highlight",
    "Instant client-side syntax validation",
    "Zero server transmission (100% offline-ready)"
  ],
  author: {
    name: "Alex Mercer",
    role: "Principal Systems Architect",
    verified: true,
    secondaryEmail: null,
    social: {
      github: "https://github.com",
      twitter: "@alexmercer_dev"
    }
  },
  settings: {
    theme: "auto",
    indentSize: 2,
    collapsibleTree: true,
    autoValidate: true,
    historyLimit: 50,
    experimentalFeatures: null
  },
  emptyStructures: {
    emptyList: [],
    emptyDictionary: {}
  },
  sampleItems: [
    {
      id: "item-001",
      sku: "A109-PRO",
      name: "Ultra-light Wireless Mouse",
      price: 79.99,
      inStock: true,
      tags: ["peripherals", "wireless", "ergonomic"]
    },
    {
      id: "item-002",
      sku: "B204-RGB",
      name: "Custom Mechanical Keyboard 75%",
      price: 149.5,
      inStock: false,
      tags: ["hardware", "typing", "hot-swap"]
    }
  ]
};

export const SAMPLE_JSON_STRING = JSON.stringify(SAMPLE_JSON, null, 2);

/**
 * Configuration settings for the frontend
 */

// API configuration
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Authentication settings
export const AUTH_COOKIE_NAME = 'crm_auth_token';
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// Feature flags
export const FEATURES = {
  enableAIInsights: true,
  enableCampaignAnalytics: true,
  enableSegmentVisualizer: true,
};

// Theme settings
export const THEME = {
  colorMode: 'system', // 'light', 'dark', or 'system'
  primaryColor: 'blue',
};
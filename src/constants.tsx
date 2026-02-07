
import React from 'react';
import { DeliveryFrequency, ContentSource, UserPreferences } from './types';

// Domain-aware topic categories
export const ACADEMIC_TOPICS = [
  'Machine Learning',
  'Quantum Computing',
  'Computational Biology',
  'Theoretical Physics',
  'Neuroscience',
  'Climate Science',
  'Materials Science',
  'Cryptography',
  'Computer Vision',
  'Natural Language Processing'
];

export const INDUSTRY_TOPICS = [
  'Artificial Intelligence',
  'Cloud Computing',
  'Software Engineering',
  'Cybersecurity',
  'Data Science',
  'DevOps',
  'Mobile Development',
  'Web3',
  'IoT',
  'Edge Computing'
];

export const FINANCIAL_TOPICS = [
  'Stock Markets',
  'Cryptocurrency',
  'FinTech',
  'Investment Banking',
  'DeFi',
  'Commodities',
  'Foreign Exchange',
  'Economic Policy',
  'Real Estate',
  'Venture Capital'
];

// Domain-aware keyword recommendations
export const ACADEMIC_KEYWORDS = [
  'Peer Review',
  'Research Papers',
  'Clinical Trials',
  'Methodology',
  'Conference Proceedings',
  'Meta-Analysis',
  'Hypothesis Testing',
  'Statistical Significance',
  'Literature Review',
  'Research Methods'
];

export const INDUSTRY_KEYWORDS = [
  'LLMs',
  'Neural Networks',
  'Microservices',
  'Kubernetes',
  'Zero Trust',
  'API Design',
  'DevSecOps',
  'Agile',
  'CI/CD',
  'Serverless'
];

export const FINANCIAL_KEYWORDS = [
  'Gold Prices',
  'Inflation',
  'Interest Rates',
  'IPO',
  'Earnings Report',
  'Market Volatility',
  'Bull Market',
  'Bear Market',
  'Portfolio Management',
  'Risk Assessment'
];

// Legacy exports for backwards compatibility
export const TOPIC_CATEGORIES = INDUSTRY_TOPICS;
export const KEYWORD_RECOMMENDATIONS = INDUSTRY_KEYWORDS;

// Helper function to get topics based on source
export const getTopicsForSource = (source: ContentSource): string[] => {
  switch (source) {
    case ContentSource.ACADEMIC:
      return ACADEMIC_TOPICS;
    case ContentSource.INDUSTRY:
      return INDUSTRY_TOPICS;
    case ContentSource.FINANCIAL:
      return FINANCIAL_TOPICS;
    case ContentSource.BOTH:
      // Combine all topics for "All Sources"
      return [...new Set([...ACADEMIC_TOPICS, ...INDUSTRY_TOPICS, ...FINANCIAL_TOPICS])];
    default:
      return INDUSTRY_TOPICS;
  }
};

// Helper function to get keywords based on source
export const getKeywordsForSource = (source: ContentSource): string[] => {
  switch (source) {
    case ContentSource.ACADEMIC:
      return ACADEMIC_KEYWORDS;
    case ContentSource.INDUSTRY:
      return INDUSTRY_KEYWORDS;
    case ContentSource.FINANCIAL:
      return FINANCIAL_KEYWORDS;
    case ContentSource.BOTH:
      // Combine all keywords for "All Sources"
      return [...new Set([...ACADEMIC_KEYWORDS, ...INDUSTRY_KEYWORDS, ...FINANCIAL_KEYWORDS])];
    default:
      return INDUSTRY_KEYWORDS;
  }
};

export const INITIAL_PREFERENCES: UserPreferences = {
  email: '',
  topics: ['Artificial Intelligence'],
  keywords: ['LLMs', 'Neural Networks'],
  frequency: DeliveryFrequency.DAILY,
  source: ContentSource.BOTH,
  deliveryTime: '09:00',
  deliveryDay: 'Monday',
  deliveryDate: 1,
  summaryLength: 'concise',
  duplicateFiltering: true
};

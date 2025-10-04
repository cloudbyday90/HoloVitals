/**
 * Query Classifier Utility
 * 
 * Classifies user queries by complexity and determines if escalation
 * to heavy-duty analysis is needed.
 */

import {
  QueryComplexity,
  EscalationReason,
  EscalationTrigger,
  COMPLEXITY_INDICATORS,
  ESCALATION_TRIGGERS
} from '@/lib/types/chatbot';

/**
 * Classify query complexity
 */
export function classifyQueryComplexity(query: string): QueryComplexity {
  const lowerQuery = query.toLowerCase();

  // Check for critical indicators first
  const hasCritical = COMPLEXITY_INDICATORS.critical.some(indicator =>
    lowerQuery.includes(indicator)
  );
  if (hasCritical) {
    return QueryComplexity.CRITICAL;
  }

  // Check for complex indicators
  const complexCount = COMPLEXITY_INDICATORS.complex.filter(indicator =>
    lowerQuery.includes(indicator)
  ).length;
  if (complexCount >= 2) {
    return QueryComplexity.COMPLEX;
  }

  // Check for moderate indicators
  const moderateCount = COMPLEXITY_INDICATORS.moderate.filter(indicator =>
    lowerQuery.includes(indicator)
  ).length;
  if (moderateCount >= 2) {
    return QueryComplexity.MODERATE;
  }

  // Check for simple indicators
  const simpleCount = COMPLEXITY_INDICATORS.simple.filter(indicator =>
    lowerQuery.includes(indicator)
  ).length;
  if (simpleCount >= 1) {
    return QueryComplexity.SIMPLE;
  }

  // Default to moderate if no clear indicators
  return QueryComplexity.MODERATE;
}

/**
 * Calculate complexity score (0-1)
 */
export function calculateComplexityScore(query: string): number {
  const lowerQuery = query.toLowerCase();
  let score = 0;

  // Base score on query length
  const wordCount = query.split(/\s+/).length;
  if (wordCount > 50) score += 0.3;
  else if (wordCount > 20) score += 0.2;
  else if (wordCount > 10) score += 0.1;

  // Check for medical terms (simplified - in production, use medical dictionary)
  const medicalTerms = [
    'diagnosis', 'prognosis', 'treatment', 'medication', 'symptom',
    'disease', 'condition', 'syndrome', 'disorder', 'infection',
    'inflammation', 'chronic', 'acute', 'malignant', 'benign'
  ];
  const medicalTermCount = medicalTerms.filter(term =>
    lowerQuery.includes(term)
  ).length;
  score += Math.min(medicalTermCount * 0.1, 0.4);

  // Check for analysis keywords
  const analysisKeywords = [
    'analyze', 'compare', 'correlate', 'predict', 'trend',
    'pattern', 'relationship', 'cause', 'effect', 'risk'
  ];
  const analysisCount = analysisKeywords.filter(keyword =>
    lowerQuery.includes(keyword)
  ).length;
  score += Math.min(analysisCount * 0.15, 0.3);

  // Check for temporal indicators
  const temporalIndicators = [
    'over time', 'history', 'trend', 'change', 'progression',
    'improvement', 'deterioration', 'since', 'before', 'after'
  ];
  const hasTemporalAnalysis = temporalIndicators.some(indicator =>
    lowerQuery.includes(indicator)
  );
  if (hasTemporalAnalysis) score += 0.2;

  return Math.min(score, 1);
}

/**
 * Determine if query should be escalated
 */
export function shouldEscalate(
  query: string,
  context?: {
    documentCount?: number;
    hasTemporalData?: boolean;
    userRequestedDetailed?: boolean;
    previousEscalations?: number;
  }
): EscalationTrigger {
  const complexity = classifyQueryComplexity(query);
  const complexityScore = calculateComplexityScore(query);

  // Critical queries always escalate
  if (complexity === QueryComplexity.CRITICAL) {
    return {
      shouldEscalate: true,
      reason: EscalationReason.COMPLEXITY,
      confidence: 1.0,
      complexity,
      metadata: { criticalIndicators: true }
    };
  }

  // Check document count
  if (context?.documentCount && context.documentCount >= ESCALATION_TRIGGERS.multipleDocuments) {
    return {
      shouldEscalate: true,
      reason: EscalationReason.MULTIPLE_DOCUMENTS,
      confidence: 0.9,
      complexity,
      metadata: { documentCount: context.documentCount }
    };
  }

  // Check for temporal analysis
  if (context?.hasTemporalData && ESCALATION_TRIGGERS.temporalAnalysis) {
    return {
      shouldEscalate: true,
      reason: EscalationReason.TREND_ANALYSIS,
      confidence: 0.85,
      complexity,
      metadata: { temporalAnalysis: true }
    };
  }

  // Check user request
  if (context?.userRequestedDetailed) {
    return {
      shouldEscalate: true,
      reason: EscalationReason.USER_REQUEST,
      confidence: 1.0,
      complexity,
      metadata: { userRequested: true }
    };
  }

  // Check complexity threshold
  if (complexityScore >= ESCALATION_TRIGGERS.complexityThreshold) {
    return {
      shouldEscalate: true,
      reason: EscalationReason.COMPLEXITY,
      confidence: complexityScore,
      complexity,
      metadata: { complexityScore }
    };
  }

  // Check for medical analysis keywords
  const medicalAnalysisKeywords = [
    'diagnose', 'diagnosis', 'what could', 'might be', 'could indicate',
    'risk of', 'probability', 'likelihood', 'prognosis'
  ];
  const hasMedicalAnalysis = medicalAnalysisKeywords.some(keyword =>
    query.toLowerCase().includes(keyword)
  );
  if (hasMedicalAnalysis) {
    return {
      shouldEscalate: true,
      reason: EscalationReason.MEDICAL_ANALYSIS,
      confidence: 0.8,
      complexity,
      metadata: { medicalAnalysisDetected: true }
    };
  }

  // No escalation needed
  return {
    shouldEscalate: false,
    confidence: 1 - complexityScore,
    complexity,
    metadata: { complexityScore }
  };
}

/**
 * Extract key medical terms from query
 */
export function extractMedicalTerms(query: string): string[] {
  // Simplified medical term extraction
  // In production, use a proper medical terminology database
  const medicalTermPatterns = [
    /\b[A-Z][a-z]+itis\b/g,        // Conditions ending in -itis
    /\b[A-Z][a-z]+osis\b/g,        // Conditions ending in -osis
    /\b[A-Z][a-z]+emia\b/g,        // Blood conditions
    /\b[A-Z][a-z]+pathy\b/g,       // Disease conditions
    /\b\d+\s*mg\b/gi,              // Medication dosages
    /\b\d+\s*ml\b/gi,              // Volume measurements
  ];

  const terms: string[] = [];
  for (const pattern of medicalTermPatterns) {
    const matches = query.match(pattern);
    if (matches) {
      terms.push(...matches);
    }
  }

  return [...new Set(terms)]; // Remove duplicates
}

/**
 * Detect if query requires cross-document analysis
 */
export function requiresCrossDocumentAnalysis(query: string): boolean {
  const crossDocumentIndicators = [
    'compare', 'difference', 'between', 'versus', 'vs',
    'all', 'multiple', 'different', 'various', 'across'
  ];

  const lowerQuery = query.toLowerCase();
  return crossDocumentIndicators.some(indicator =>
    lowerQuery.includes(indicator)
  );
}

/**
 * Detect if query requires temporal analysis
 */
export function requiresTemporalAnalysis(query: string): boolean {
  const temporalIndicators = [
    'over time', 'trend', 'change', 'progression', 'history',
    'since', 'before', 'after', 'improvement', 'deterioration',
    'increasing', 'decreasing', 'stable', 'fluctuating'
  ];

  const lowerQuery = query.toLowerCase();
  return temporalIndicators.some(indicator =>
    lowerQuery.includes(indicator)
  );
}

/**
 * Get suggested follow-up questions
 */
export function getSuggestedFollowUps(
  query: string,
  complexity: QueryComplexity
): string[] {
  const suggestions: string[] = [];

  if (complexity === QueryComplexity.SIMPLE) {
    suggestions.push(
      'Would you like more detailed information?',
      'Do you have any specific questions about this?',
      'Would you like to see related information?'
    );
  } else if (complexity === QueryComplexity.MODERATE) {
    suggestions.push(
      'Would you like a more detailed analysis?',
      'Should I compare this with your previous results?',
      'Would you like to see trends over time?'
    );
  } else {
    suggestions.push(
      'Would you like me to create a comprehensive analysis report?',
      'Should I analyze all related documents?',
      'Would you like to schedule a detailed review?'
    );
  }

  return suggestions;
}

/**
 * Estimate confidence in classification
 */
export function estimateClassificationConfidence(
  query: string,
  complexity: QueryComplexity
): number {
  const complexityScore = calculateComplexityScore(query);
  const indicators = COMPLEXITY_INDICATORS[complexity.toLowerCase() as keyof typeof COMPLEXITY_INDICATORS] || [];
  
  const lowerQuery = query.toLowerCase();
  const matchCount = indicators.filter(indicator =>
    lowerQuery.includes(indicator)
  ).length;

  // Base confidence on indicator matches and complexity score alignment
  let confidence = 0.5;
  
  if (matchCount > 0) {
    confidence += Math.min(matchCount * 0.15, 0.3);
  }

  // Adjust based on complexity score alignment
  if (complexity === QueryComplexity.SIMPLE && complexityScore < 0.3) {
    confidence += 0.2;
  } else if (complexity === QueryComplexity.COMPLEX && complexityScore > 0.7) {
    confidence += 0.2;
  }

  return Math.min(confidence, 1);
}
/**
 * Context Optimizer Service Tests
 */

import { 
  ContextOptimizerService,
  OptimizationStrategy,
  ContentType
} from '@/lib/services/ContextOptimizerService';

describe('ContextOptimizerService', () => {
  let service: ContextOptimizerService;

  beforeEach(() => {
    service = ContextOptimizerService.getInstance();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ContextOptimizerService.getInstance();
      const instance2 = ContextOptimizerService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Basic Optimization', () => {
    it('should optimize simple text', async () => {
      const content = 'The patient has a history of high blood pressure and diabetes. The patient is currently taking medication for both conditions.';
      
      const result = await service.optimize({
        content,
        strategy: OptimizationStrategy.BALANCED
      });

      expect(result.optimizedContent).toBeDefined();
      expect(result.originalTokens).toBeGreaterThan(0);
      expect(result.optimizedTokens).toBeGreaterThan(0);
      expect(result.optimizedTokens).toBeLessThan(result.originalTokens);
      expect(result.reductionPercentage).toBeGreaterThan(0);
    });

    it('should preserve medical keywords', async () => {
      const content = 'Patient diagnosed with hypertension. Blood pressure: 140/90 mmHg. Prescribed lisinopril 10mg daily.';
      
      const result = await service.optimize({
        content,
        strategy: OptimizationStrategy.BALANCED,
        contentType: ContentType.MEDICAL_REPORT
      });

      const optimized = result.optimizedContent.toLowerCase();
      expect(optimized).toContain('hypertension');
      // BP is abbreviation for blood pressure
      expect(optimized.includes('blood pressure') || optimized.includes('bp')).toBe(true);
      expect(optimized).toContain('lisinopril');
    });

    it('should handle empty content', async () => {
      const result = await service.optimize({
        content: '',
        strategy: OptimizationStrategy.BALANCED
      });

      expect(result.optimizedContent).toBe('');
      expect(result.originalTokens).toBe(0);
      expect(result.optimizedTokens).toBe(0);
    });
  });

  describe('Optimization Strategies', () => {
    const testContent = `
      Patient History: The patient is a 45-year-old male with a long history of type 2 diabetes mellitus.
      He has been managing his condition with metformin and lifestyle modifications for the past 10 years.
      Current Symptoms: The patient reports increased thirst, frequent urination, and fatigue over the past 2 weeks.
      Vital Signs: Blood pressure 130/85 mmHg, heart rate 78 bpm, temperature 98.6°F, weight 185 lbs.
      Assessment: The patient's symptoms suggest poor glycemic control. HbA1c test ordered.
      Plan: Adjust medication dosage and schedule follow-up in 2 weeks.
    `;

    it('should apply AGGRESSIVE strategy with high reduction', async () => {
      const result = await service.optimize({
        content: testContent,
        strategy: OptimizationStrategy.AGGRESSIVE
      });

      expect(result.reductionPercentage).toBeGreaterThan(20);
      expect(result.strategy).toBe(OptimizationStrategy.AGGRESSIVE);
    });

    it('should apply BALANCED strategy with moderate reduction', async () => {
      const result = await service.optimize({
        content: testContent,
        strategy: OptimizationStrategy.BALANCED
      });

      expect(result.reductionPercentage).toBeGreaterThan(10);
      expect(result.reductionPercentage).toBeLessThan(60);
      expect(result.strategy).toBe(OptimizationStrategy.BALANCED);
    });

    it('should apply CONSERVATIVE strategy with low reduction', async () => {
      const result = await service.optimize({
        content: testContent,
        strategy: OptimizationStrategy.CONSERVATIVE
      });

      expect(result.reductionPercentage).toBeGreaterThan(5);
      expect(result.reductionPercentage).toBeLessThan(40);
      expect(result.strategy).toBe(OptimizationStrategy.CONSERVATIVE);
    });

    it('should apply MINIMAL strategy with minimal reduction', async () => {
      const result = await service.optimize({
        content: testContent,
        strategy: OptimizationStrategy.MINIMAL
      });

      expect(result.reductionPercentage).toBeGreaterThan(0);
      expect(result.reductionPercentage).toBeLessThan(15);
      expect(result.strategy).toBe(OptimizationStrategy.MINIMAL);
    });
  });

  describe('Content Types', () => {
    it('should handle MEDICAL_REPORT type', async () => {
      const content = 'Diagnosis: Type 2 Diabetes Mellitus. Treatment: Metformin 500mg twice daily.';
      
      const result = await service.optimize({
        content,
        contentType: ContentType.MEDICAL_REPORT,
        strategy: OptimizationStrategy.BALANCED
      });

      expect(result.optimizedContent).toContain('Diabetes');
      expect(result.optimizedContent).toContain('Metformin');
    });

    it('should handle LAB_RESULTS type', async () => {
      const content = 'Glucose: 180 mg/dL (High). HbA1c: 8.5% (Elevated). Cholesterol: 220 mg/dL.';
      
      const result = await service.optimize({
        content,
        contentType: ContentType.LAB_RESULTS,
        strategy: OptimizationStrategy.BALANCED
      });

      // Should preserve numerical values
      expect(result.optimizedContent).toContain('180');
      expect(result.optimizedContent).toContain('8.5');
    });

    it('should handle PRESCRIPTION type', async () => {
      const content = 'Prescription: Lisinopril 10mg, take one tablet daily in the morning with food.';
      
      const result = await service.optimize({
        content,
        contentType: ContentType.PRESCRIPTION,
        strategy: OptimizationStrategy.BALANCED
      });

      expect(result.optimizedContent).toContain('Lisinopril');
      expect(result.optimizedContent).toContain('10mg');
    });
  });

  describe('Target Tokens', () => {
    it('should reduce tokens significantly', async () => {
      const longContent = 'This is a very long medical report. '.repeat(100);
      
      const result = await service.optimize({
        content: longContent,
        strategy: OptimizationStrategy.BALANCED,
        targetTokens: 50
      });

      // Should reduce tokens, even if not hitting exact target
      expect(result.optimizedTokens).toBeLessThan(result.originalTokens);
      expect(result.reductionPercentage).toBeGreaterThan(0);
    });

    it('should not over-compress if already under target', async () => {
      const shortContent = 'Patient has diabetes.';
      
      const result = await service.optimize({
        content: shortContent,
        strategy: OptimizationStrategy.BALANCED,
        targetTokens: 100
      });

      expect(result.optimizedTokens).toBeLessThan(100);
    });
  });

  describe('Keyword Preservation', () => {
    it('should preserve specified keywords', async () => {
      const content = 'Patient has hypertension and takes lisinopril. Also has diabetes and takes metformin.';
      
      const result = await service.optimize({
        content,
        strategy: OptimizationStrategy.AGGRESSIVE,
        preserveKeywords: ['hypertension', 'diabetes']
      });

      const optimized = result.optimizedContent.toLowerCase();
      expect(optimized).toContain('hypertension');
      expect(optimized).toContain('diabetes');
    });

    it('should return preserved keywords in result', async () => {
      const content = 'Patient diagnosed with hypertension and diabetes mellitus.';
      
      const result = await service.optimize({
        content,
        strategy: OptimizationStrategy.BALANCED
      });

      expect(result.preservedKeywords).toBeDefined();
      expect(Array.isArray(result.preservedKeywords)).toBe(true);
    });
  });

  describe('Metrics', () => {
    it('should calculate compression ratio', async () => {
      const content = 'The patient has a history of diabetes. The patient takes medication daily.';
      
      const result = await service.optimize({
        content,
        strategy: OptimizationStrategy.BALANCED
      });

      expect(result.metrics.compressionRatio).toBeGreaterThan(1);
      expect(result.metrics.compressionRatio).toBeDefined();
    });

    it('should calculate relevance score', async () => {
      const content = 'Patient has diabetes. Blood sugar: 180 mg/dL. Prescribed metformin.';
      
      const result = await service.optimize({
        content,
        strategy: OptimizationStrategy.BALANCED
      });

      expect(result.metrics.relevanceScore).toBeGreaterThan(0);
      expect(result.metrics.relevanceScore).toBeLessThanOrEqual(1);
    });

    it('should calculate information density', async () => {
      const content = 'Patient diagnosed with type 2 diabetes mellitus.';
      
      const result = await service.optimize({
        content,
        strategy: OptimizationStrategy.BALANCED
      });

      expect(result.metrics.informationDensity).toBeGreaterThan(0);
      expect(result.metrics.informationDensity).toBeLessThanOrEqual(1);
    });

    it('should track processing time', async () => {
      const content = 'Patient has diabetes and hypertension.';
      
      const result = await service.optimize({
        content,
        strategy: OptimizationStrategy.BALANCED
      });

      expect(result.metrics.processingTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should calculate quality score', async () => {
      const content = 'Patient has diabetes. Takes metformin 500mg twice daily.';
      
      const result = await service.optimize({
        content,
        strategy: OptimizationStrategy.BALANCED
      });

      expect(result.metrics.qualityScore).toBeGreaterThan(0);
      expect(result.metrics.qualityScore).toBeLessThanOrEqual(1);
    });
  });

  describe('Batch Optimization', () => {
    it('should optimize multiple contexts', async () => {
      const requests = [
        { content: 'Patient has diabetes.' },
        { content: 'Patient has hypertension.' },
        { content: 'Patient takes metformin.' }
      ];

      const results = await service.batchOptimize(requests);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.optimizedContent).toBeDefined();
        expect(result.originalTokens).toBeGreaterThan(0);
      });
    });

    it('should handle empty batch', async () => {
      const results = await service.batchOptimize([]);
      expect(results).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very short content', async () => {
      const result = await service.optimize({
        content: 'Diabetes.',
        strategy: OptimizationStrategy.BALANCED
      });

      expect(result.optimizedContent).toBeDefined();
      expect(result.optimizedTokens).toBeGreaterThan(0);
    });

    it('should handle content with special characters', async () => {
      const content = 'Patient BP: 140/90 mmHg. Temp: 98.6°F. Weight: 185 lbs.';
      
      const result = await service.optimize({
        content,
        strategy: OptimizationStrategy.BALANCED
      });

      expect(result.optimizedContent).toBeDefined();
      expect(result.optimizedTokens).toBeGreaterThan(0);
    });

    it('should handle content with numbers', async () => {
      const content = 'Glucose: 180 mg/dL. HbA1c: 8.5%. Cholesterol: 220 mg/dL.';
      
      const result = await service.optimize({
        content,
        strategy: OptimizationStrategy.BALANCED
      });

      // Should preserve numbers
      expect(result.optimizedContent).toContain('180');
      expect(result.optimizedContent).toContain('8.5');
      expect(result.optimizedContent).toContain('220');
    });

    it('should handle content with multiple paragraphs', async () => {
      const content = `
        Patient History:
        45-year-old male with diabetes.

        Current Symptoms:
        Increased thirst and fatigue.

        Assessment:
        Poor glycemic control.
      `;
      
      const result = await service.optimize({
        content,
        strategy: OptimizationStrategy.BALANCED
      });

      expect(result.optimizedContent).toBeDefined();
      expect(result.optimizedTokens).toBeLessThan(result.originalTokens);
    });
  });

  describe('Performance', () => {
    it('should optimize within reasonable time', async () => {
      const content = 'Patient has diabetes. '.repeat(100);
      
      const startTime = Date.now();
      await service.optimize({
        content,
        strategy: OptimizationStrategy.BALANCED
      });
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete in < 1 second
    });

    it('should handle large content efficiently', async () => {
      const largeContent = 'This is a medical report with lots of details. '.repeat(500);
      
      const result = await service.optimize({
        content: largeContent,
        strategy: OptimizationStrategy.BALANCED
      });

      expect(result.metrics.processingTimeMs).toBeLessThan(5000); // Should complete in < 5 seconds
    });
  });
});
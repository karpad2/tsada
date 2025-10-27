// Backward Compatibility Utilities and Checks
import type { ContentComponent, LegacyContent } from '@/types/contentTypes';

export interface CompatibilityReport {
  isCompatible: boolean;
  issues: CompatibilityIssue[];
  recommendations: string[];
  migrationRequired: boolean;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface CompatibilityIssue {
  type: 'missing_field' | 'deprecated_feature' | 'breaking_change' | 'performance_issue';
  severity: 'warning' | 'error' | 'info';
  message: string;
  field?: string;
  solution?: string;
}

export class BackwardCompatibilityChecker {
  /**
   * Checks if a document is compatible with both legacy and new systems
   */
  static checkDocumentCompatibility(document: any): CompatibilityReport {
    const issues: CompatibilityIssue[] = [];
    const recommendations: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    // Check for legacy fields
    this.checkLegacyFields(document, issues, recommendations);

    // Check for modular components
    this.checkModularComponents(document, issues, recommendations);

    // Check for potential conflicts
    this.checkForConflicts(document, issues, recommendations);

    // Check for deprecated features
    this.checkDeprecatedFeatures(document, issues, recommendations);

    // Determine risk level
    riskLevel = this.calculateRiskLevel(issues);

    // Determine if migration is required
    const migrationRequired = this.shouldMigrate(document, issues);

    return {
      isCompatible: issues.filter(i => i.severity === 'error').length === 0,
      issues,
      recommendations,
      migrationRequired,
      riskLevel
    };
  }

  /**
   * Checks legacy field compatibility
   */
  private static checkLegacyFields(
    document: any,
    issues: CompatibilityIssue[],
    recommendations: string[]
  ) {
    const legacyFields = [
      'title_rs', 'title_en', 'title_hu',
      'text_rs', 'text_en', 'text_hu',
      'yt_video', 'has_gallery', 'gallery',
      'has_documents', 'video', 'show_date'
    ];

    const presentFields = legacyFields.filter(field =>
      document[field] !== undefined && document[field] !== null && document[field] !== ''
    );

    if (presentFields.length > 0) {
      issues.push({
        type: 'deprecated_feature',
        severity: 'info',
        message: `Document contains ${presentFields.length} legacy fields that can be migrated to the new modular system`,
        solution: 'Consider migrating to modular components for better content management'
      });

      recommendations.push('Migrate legacy content to modular components for enhanced features');
    }

    // Check for inconsistent language content
    const hasRs = !!(document.title_rs || document.text_rs);
    const hasEn = !!(document.title_en || document.text_en);
    const hasHu = !!(document.title_hu || document.text_hu);

    if (hasRs && !hasEn) {
      issues.push({
        type: 'missing_field',
        severity: 'warning',
        message: 'English content is missing but Serbian content exists',
        field: 'title_en, text_en',
        solution: 'Add English translations for complete multi-language support'
      });
    }

    if (hasRs && !hasHu) {
      issues.push({
        type: 'missing_field',
        severity: 'warning',
        message: 'Hungarian content is missing but Serbian content exists',
        field: 'title_hu, text_hu',
        solution: 'Add Hungarian translations for complete multi-language support'
      });
    }
  }

  /**
   * Checks modular components compatibility
   */
  private static checkModularComponents(
    document: any,
    issues: CompatibilityIssue[],
    recommendations: string[]
  ) {
    if (document.components && Array.isArray(document.components)) {
      if (document.components.length === 0) {
        issues.push({
          type: 'missing_field',
          severity: 'warning',
          message: 'Document is set to use modular system but has no components',
          solution: 'Add content components or revert to legacy system'
        });
      } else {
        recommendations.push('Document uses modern modular system - all features available');
      }
    }

    // Check for mixed mode (both legacy and modular)
    const hasLegacyContent = !!(
      document.title_rs || document.text_rs ||
      document.yt_video || document.has_gallery
    );
    const hasModularComponents = !!(document.components && document.components.length > 0);

    if (hasLegacyContent && hasModularComponents) {
      issues.push({
        type: 'breaking_change',
        severity: 'warning',
        message: 'Document contains both legacy and modular content',
        solution: 'Choose either legacy or modular system to avoid conflicts'
      });
    }
  }

  /**
   * Checks for potential conflicts between systems
   */
  private static checkForConflicts(
    document: any,
    issues: CompatibilityIssue[],
    recommendations: string[]
  ) {
    // Check use_legacy_content flag consistency
    if (document.use_legacy_content === false) {
      const hasLegacyContent = !!(
        document.title_rs || document.text_rs ||
        document.yt_video || document.has_gallery
      );

      if (hasLegacyContent && (!document.components || document.components.length === 0)) {
        issues.push({
          type: 'breaking_change',
          severity: 'error',
          message: 'Document is set to use modular system but has no components and legacy content exists',
          solution: 'Either migrate legacy content to components or set use_legacy_content to true'
        });
      }
    }

    // Check for conflicting gallery settings
    if (document.has_gallery && document.gallery) {
      const hasGalleryComponents = document.components?.some((id: string) =>
        id.includes('gallery') // Simplified check
      );

      if (hasGalleryComponents) {
        issues.push({
          type: 'breaking_change',
          severity: 'warning',
          message: 'Document has both legacy gallery and modular gallery components',
          solution: 'Consolidate gallery content into modular components'
        });
      }
    }
  }

  /**
   * Checks for deprecated features
   */
  private static checkDeprecatedFeatures(
    document: any,
    issues: CompatibilityIssue[],
    recommendations: string[]
  ) {
    // Check for old video handling
    if (document.video && typeof document.video === 'string') {
      issues.push({
        type: 'deprecated_feature',
        severity: 'info',
        message: 'Legacy video field detected',
        field: 'video',
        solution: 'Migrate to VideoBlock component for enhanced video features'
      });
    }

    // Check for old YouTube format
    if (document.yt_video && Array.isArray(document.yt_video)) {
      issues.push({
        type: 'deprecated_feature',
        severity: 'info',
        message: 'Legacy YouTube video array detected',
        field: 'yt_video',
        solution: 'Migrate to YouTubeBlock components for better video management'
      });
    }

    // Check for performance issues with large legacy content
    const textLength = (document.text_rs || '').length +
                      (document.text_en || '').length +
                      (document.text_hu || '').length;

    if (textLength > 10000) {
      issues.push({
        type: 'performance_issue',
        severity: 'warning',
        message: 'Large legacy text content detected',
        solution: 'Consider breaking into smaller TextBlock components for better performance'
      });
    }
  }

  /**
   * Calculates overall risk level
   */
  private static calculateRiskLevel(issues: CompatibilityIssue[]): 'low' | 'medium' | 'high' {
    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;

    if (errorCount > 0) return 'high';
    if (warningCount > 2) return 'medium';
    return 'low';
  }

  /**
   * Determines if migration is recommended
   */
  private static shouldMigrate(document: any, issues: CompatibilityIssue[]): boolean {
    // High-priority migration cases
    const hasErrors = issues.some(i => i.severity === 'error');
    const hasLegacyContent = !!(
      document.title_rs || document.text_rs ||
      document.yt_video || document.has_gallery
    );
    const isExplicitlyLegacy = document.use_legacy_content === true;

    return hasErrors || (hasLegacyContent && !isExplicitlyLegacy);
  }

  /**
   * Validates component compatibility
   */
  static validateComponent(component: ContentComponent): CompatibilityIssue[] {
    const issues: CompatibilityIssue[] = [];

    // Check required fields
    if (!component.type) {
      issues.push({
        type: 'missing_field',
        severity: 'error',
        message: 'Component missing required type field',
        field: 'type'
      });
    }

    if (!component.language_metadata) {
      issues.push({
        type: 'missing_field',
        severity: 'warning',
        message: 'Component missing language metadata',
        field: 'language_metadata',
        solution: 'Add language metadata for proper multi-language support'
      });
    }

    // Check content consistency
    const hasRsContent = !!(component.content_rs && Object.keys(component.content_rs).length > 0);
    const hasEnContent = !!(component.content_en && Object.keys(component.content_en).length > 0);
    const hasHuContent = !!(component.content_hu && Object.keys(component.content_hu).length > 0);

    if (hasRsContent && !hasEnContent) {
      issues.push({
        type: 'missing_field',
        severity: 'warning',
        message: 'Component has Serbian content but missing English translation',
        field: 'content_en'
      });
    }

    if (hasRsContent && !hasHuContent) {
      issues.push({
        type: 'missing_field',
        severity: 'warning',
        message: 'Component has Serbian content but missing Hungarian translation',
        field: 'content_hu'
      });
    }

    return issues;
  }

  /**
   * Validates entire content system compatibility
   */
  static validateSystemCompatibility(documents: any[]): {
    overallCompatibility: number;
    systemIssues: CompatibilityIssue[];
    migrationRecommendations: string[];
  } {
    const systemIssues: CompatibilityIssue[] = [];
    const migrationRecommendations: string[] = [];
    let compatibleCount = 0;

    // Check each document
    for (const doc of documents) {
      const report = this.checkDocumentCompatibility(doc);
      if (report.isCompatible) {
        compatibleCount++;
      }
      systemIssues.push(...report.issues);
    }

    const overallCompatibility = (compatibleCount / documents.length) * 100;

    // System-wide recommendations
    const legacyCount = documents.filter(doc =>
      doc.use_legacy_content === true || this.shouldMigrate(doc, [])
    ).length;

    if (legacyCount > documents.length * 0.5) {
      migrationRecommendations.push(
        'More than 50% of documents use legacy system - consider bulk migration'
      );
    }

    if (legacyCount > 0 && legacyCount < documents.length * 0.2) {
      migrationRecommendations.push(
        'Small number of legacy documents remaining - good migration progress'
      );
    }

    return {
      overallCompatibility,
      systemIssues,
      migrationRecommendations
    };
  }

  /**
   * Provides migration roadmap
   */
  static generateMigrationRoadmap(documents: any[]): {
    phases: MigrationPhase[];
    estimatedTime: string;
    complexity: 'simple' | 'moderate' | 'complex';
  } {
    const phases: MigrationPhase[] = [];

    // Phase 1: Simple documents (text + title only)
    const simpleDocuments = documents.filter(doc => {
      const hasOnlyBasic = !!(doc.title_rs || doc.text_rs) &&
                          !doc.yt_video && !doc.has_gallery && !doc.video;
      return hasOnlyBasic;
    });

    if (simpleDocuments.length > 0) {
      phases.push({
        name: 'Simple Text Migration',
        description: 'Migrate documents with only title and text content',
        documentCount: simpleDocuments.length,
        estimatedHours: simpleDocuments.length * 0.1,
        complexity: 'simple',
        priority: 'high'
      });
    }

    // Phase 2: Media documents (with videos/galleries)
    const mediaDocuments = documents.filter(doc =>
      (doc.yt_video && doc.yt_video.length > 0) || doc.has_gallery || doc.video
    );

    if (mediaDocuments.length > 0) {
      phases.push({
        name: 'Media Content Migration',
        description: 'Migrate documents with videos, galleries, and rich media',
        documentCount: mediaDocuments.length,
        estimatedHours: mediaDocuments.length * 0.5,
        complexity: 'moderate',
        priority: 'medium'
      });
    }

    // Phase 3: Complex documents (with documents, multiple features)
    const complexDocuments = documents.filter(doc =>
      doc.has_documents || (doc.yt_video && doc.yt_video.length > 2) ||
      (doc.text_rs && doc.text_rs.length > 5000)
    );

    if (complexDocuments.length > 0) {
      phases.push({
        name: 'Complex Content Migration',
        description: 'Migrate documents with multiple features and complex content',
        documentCount: complexDocuments.length,
        estimatedHours: complexDocuments.length * 1,
        complexity: 'complex',
        priority: 'low'
      });
    }

    const totalHours = phases.reduce((sum, phase) => sum + phase.estimatedHours, 0);
    const estimatedTime = totalHours < 1 ? 'Less than 1 hour' :
                         totalHours < 8 ? `${Math.ceil(totalHours)} hours` :
                         `${Math.ceil(totalHours / 8)} days`;

    const complexity = totalHours < 2 ? 'simple' :
                      totalHours < 10 ? 'moderate' : 'complex';

    return {
      phases,
      estimatedTime,
      complexity
    };
  }
}

export interface MigrationPhase {
  name: string;
  description: string;
  documentCount: number;
  estimatedHours: number;
  complexity: 'simple' | 'moderate' | 'complex';
  priority: 'high' | 'medium' | 'low';
}

// Convenience exports
export const checkDocumentCompatibility = BackwardCompatibilityChecker.checkDocumentCompatibility.bind(BackwardCompatibilityChecker);
export const validateComponent = BackwardCompatibilityChecker.validateComponent.bind(BackwardCompatibilityChecker);
export const validateSystemCompatibility = BackwardCompatibilityChecker.validateSystemCompatibility.bind(BackwardCompatibilityChecker);
export const generateMigrationRoadmap = BackwardCompatibilityChecker.generateMigrationRoadmap.bind(BackwardCompatibilityChecker);
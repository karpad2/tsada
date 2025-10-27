// Content Import/Export Utilities
import { ID, Databases } from 'appwrite';
import { appw, config } from '@/appwrite';
import type { ContentComponent, LegacyContent } from '@/types/contentTypes';
import { ContentMigrationService } from './contentMigration';

export interface ExportOptions {
  format: 'json' | 'csv' | 'xml' | 'markdown';
  includeMetadata: boolean;
  includeLegacyContent: boolean;
  includeComponents: boolean;
  languageFilter?: 'rs' | 'en' | 'hu' | 'all';
  dateRange?: {
    from: string;
    to: string;
  };
}

export interface ImportOptions {
  format: 'json' | 'csv' | 'xml' | 'markdown';
  overwriteExisting: boolean;
  preserveIds: boolean;
  autoMigrate: boolean;
  validateBeforeImport: boolean;
  batchSize: number;
}

export interface ExportResult {
  success: boolean;
  data?: string | object;
  filename: string;
  contentType: string;
  documentCount: number;
  componentCount: number;
  errors: string[];
}

export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  warnings: string[];
  errors: string[];
  documents: string[];
}

export class ContentImportExportService {
  /**
   * Exports content in specified format
   */
  static async exportContent(
    documentIds: string[] = [],
    options: ExportOptions = {
      format: 'json',
      includeMetadata: true,
      includeLegacyContent: true,
      includeComponents: true,
      languageFilter: 'all'
    }
  ): Promise<ExportResult> {
    try {
      const database = new Databases(appw);
      const exportData: any = {
        exportInfo: {
          timestamp: new Date().toISOString(),
          version: '2.0',
          format: options.format,
          options
        },
        documents: [],
        components: []
      };

      let documentCount = 0;
      let componentCount = 0;
      const errors: string[] = [];

      // Load documents
      if (documentIds.length === 0) {
        // Export all documents
        const allDocs = await database.listDocuments(
          config.website_db,
          config.about_us_db,
          []
        );
        documentIds = allDocs.documents.map(d => d.$id);
      }

      for (const docId of documentIds) {
        try {
          const doc = await database.getDocument(
            config.website_db,
            config.about_us_db,
            docId
          );

          // Filter by date range if specified
          if (options.dateRange) {
            const docDate = new Date(doc.$createdAt);
            const fromDate = new Date(options.dateRange.from);
            const toDate = new Date(options.dateRange.to);

            if (docDate < fromDate || docDate > toDate) {
              continue;
            }
          }

          const exportDoc: any = {};

          // Include metadata
          if (options.includeMetadata) {
            exportDoc.$id = doc.$id;
            exportDoc.$createdAt = doc.$createdAt;
            exportDoc.$updatedAt = doc.$updatedAt;
            exportDoc.use_legacy_content = doc.use_legacy_content;
          }

          // Include legacy content
          if (options.includeLegacyContent) {
            this.addLegacyContent(doc, exportDoc, options.languageFilter);
          }

          // Include components
          if (options.includeComponents) {
            try {
              const components = await database.listDocuments(
                config.website_db,
                config.enhanced_text_components,
                [
                  { attribute: 'parent_id', operator: 'equal', value: docId }
                ]
              );

              exportDoc.components = components.documents.map(comp => {
                const exportComp = { ...comp };

                // Filter language content if specified
                if (options.languageFilter && options.languageFilter !== 'all') {
                  const lang = options.languageFilter;
                  exportComp.content = exportComp[`content_${lang}`];
                  delete exportComp.content_rs;
                  delete exportComp.content_en;
                  delete exportComp.content_hu;
                }

                return exportComp;
              });

              componentCount += exportDoc.components.length;
            } catch (compError) {
              errors.push(`Failed to load components for ${docId}: ${compError}`);
            }
          }

          exportData.documents.push(exportDoc);
          documentCount++;

        } catch (docError) {
          errors.push(`Failed to load document ${docId}: ${docError}`);
        }
      }

      // Format the data
      const result = await this.formatExportData(exportData, options.format);

      return {
        success: true,
        data: result.data,
        filename: result.filename,
        contentType: result.contentType,
        documentCount,
        componentCount,
        errors
      };

    } catch (error) {
      return {
        success: false,
        filename: '',
        contentType: '',
        documentCount: 0,
        componentCount: 0,
        errors: [`Export failed: ${error}`]
      };
    }
  }

  /**
   * Imports content from data
   */
  static async importContent(
    data: string | object,
    options: ImportOptions = {
      format: 'json',
      overwriteExisting: false,
      preserveIds: false,
      autoMigrate: true,
      validateBeforeImport: true,
      batchSize: 10
    }
  ): Promise<ImportResult> {
    try {
      const database = new Databases(appw);
      const result: ImportResult = {
        success: true,
        imported: 0,
        failed: 0,
        warnings: [],
        errors: [],
        documents: []
      };

      // Parse data
      const importData = await this.parseImportData(data, options.format);

      if (!importData.documents || !Array.isArray(importData.documents)) {
        throw new Error('Invalid import data format');
      }

      // Validate data
      if (options.validateBeforeImport) {
        const validation = this.validateImportData(importData);
        if (!validation.valid) {
          result.errors.push(...validation.errors);
          if (validation.errors.length > 0) {
            result.success = false;
            return result;
          }
        }
        result.warnings.push(...validation.warnings);
      }

      // Process documents in batches
      const documents = importData.documents;
      for (let i = 0; i < documents.length; i += options.batchSize) {
        const batch = documents.slice(i, i + options.batchSize);

        for (const doc of batch) {
          try {
            const importedDocId = await this.importSingleDocument(doc, options);
            result.documents.push(importedDocId);
            result.imported++;
          } catch (error) {
            result.errors.push(`Failed to import document: ${error}`);
            result.failed++;
          }
        }
      }

      return result;

    } catch (error) {
      return {
        success: false,
        imported: 0,
        failed: 0,
        warnings: [],
        errors: [`Import failed: ${error}`],
        documents: []
      };
    }
  }

  /**
   * Adds legacy content to export document
   */
  private static addLegacyContent(
    doc: any,
    exportDoc: any,
    languageFilter?: 'rs' | 'en' | 'hu' | 'all'
  ) {
    const legacyFields = [
      'title_rs', 'title_en', 'title_hu',
      'text_rs', 'text_en', 'text_hu',
      'yt_video', 'has_gallery', 'gallery',
      'has_documents', 'video', 'show_date'
    ];

    if (languageFilter && languageFilter !== 'all') {
      // Only include specific language
      const suffix = languageFilter;
      exportDoc[`title_${suffix}`] = doc[`title_${suffix}`];
      exportDoc[`text_${suffix}`] = doc[`text_${suffix}`];

      // Include non-language specific fields
      ['yt_video', 'has_gallery', 'gallery', 'has_documents', 'video', 'show_date'].forEach(field => {
        if (doc[field] !== undefined) {
          exportDoc[field] = doc[field];
        }
      });
    } else {
      // Include all legacy fields
      legacyFields.forEach(field => {
        if (doc[field] !== undefined) {
          exportDoc[field] = doc[field];
        }
      });
    }
  }

  /**
   * Formats export data according to specified format
   */
  private static async formatExportData(
    data: any,
    format: 'json' | 'csv' | 'xml' | 'markdown'
  ): Promise<{ data: string | object; filename: string; contentType: string }> {
    const timestamp = new Date().toISOString().split('T')[0];

    switch (format) {
      case 'json':
        return {
          data: JSON.stringify(data, null, 2),
          filename: `content-export-${timestamp}.json`,
          contentType: 'application/json'
        };

      case 'csv':
        const csvData = this.convertToCSV(data.documents);
        return {
          data: csvData,
          filename: `content-export-${timestamp}.csv`,
          contentType: 'text/csv'
        };

      case 'xml':
        const xmlData = this.convertToXML(data);
        return {
          data: xmlData,
          filename: `content-export-${timestamp}.xml`,
          contentType: 'application/xml'
        };

      case 'markdown':
        const mdData = this.convertToMarkdown(data.documents);
        return {
          data: mdData,
          filename: `content-export-${timestamp}.md`,
          contentType: 'text/markdown'
        };

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Converts data to CSV format
   */
  private static convertToCSV(documents: any[]): string {
    if (documents.length === 0) return '';

    const headers = ['ID', 'Title (RS)', 'Title (EN)', 'Title (HU)', 'Type', 'Created', 'Updated'];
    const rows = [headers.join(',')];

    documents.forEach(doc => {
      const row = [
        doc.$id || '',
        this.escapeCsvValue(doc.title_rs || ''),
        this.escapeCsvValue(doc.title_en || ''),
        this.escapeCsvValue(doc.title_hu || ''),
        doc.use_legacy_content ? 'Legacy' : 'Modular',
        doc.$createdAt || '',
        doc.$updatedAt || ''
      ];
      rows.push(row.join(','));
    });

    return rows.join('\n');
  }

  /**
   * Converts data to XML format
   */
  private static convertToXML(data: any): string {
    const xml = ['<?xml version="1.0" encoding="UTF-8"?>'];
    xml.push('<export>');
    xml.push(`  <info>`);
    xml.push(`    <timestamp>${data.exportInfo.timestamp}</timestamp>`);
    xml.push(`    <version>${data.exportInfo.version}</version>`);
    xml.push(`  </info>`);
    xml.push('  <documents>');

    data.documents.forEach((doc: any) => {
      xml.push('    <document>');
      xml.push(`      <id>${doc.$id || ''}</id>`);
      xml.push(`      <title_rs><![CDATA[${doc.title_rs || ''}]]></title_rs>`);
      xml.push(`      <title_en><![CDATA[${doc.title_en || ''}]]></title_en>`);
      xml.push(`      <title_hu><![CDATA[${doc.title_hu || ''}]]></title_hu>`);
      xml.push(`      <type>${doc.use_legacy_content ? 'legacy' : 'modular'}</type>`);
      xml.push('    </document>');
    });

    xml.push('  </documents>');
    xml.push('</export>');
    return xml.join('\n');
  }

  /**
   * Converts data to Markdown format
   */
  private static convertToMarkdown(documents: any[]): string {
    const md = ['# Content Export\n'];
    md.push(`Generated on: ${new Date().toISOString()}\n`);
    md.push(`Total documents: ${documents.length}\n`);

    documents.forEach(doc => {
      md.push(`## ${doc.title_rs || doc.title_en || 'Untitled'}\n`);
      md.push(`**ID:** ${doc.$id}\n`);
      md.push(`**Type:** ${doc.use_legacy_content ? 'Legacy' : 'Modular'}\n`);

      if (doc.title_en && doc.title_en !== doc.title_rs) {
        md.push(`**Title (EN):** ${doc.title_en}\n`);
      }
      if (doc.title_hu && doc.title_hu !== doc.title_rs) {
        md.push(`**Title (HU):** ${doc.title_hu}\n`);
      }

      if (doc.text_rs) {
        md.push(`\n${doc.text_rs}\n`);
      }

      md.push('---\n');
    });

    return md.join('\n');
  }

  /**
   * Escapes CSV values
   */
  private static escapeCsvValue(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * Parses import data
   */
  private static async parseImportData(
    data: string | object,
    format: 'json' | 'csv' | 'xml' | 'markdown'
  ): Promise<any> {
    switch (format) {
      case 'json':
        return typeof data === 'string' ? JSON.parse(data) : data;

      case 'csv':
        return this.parseCSV(data as string);

      case 'xml':
        return this.parseXML(data as string);

      case 'markdown':
        return this.parseMarkdown(data as string);

      default:
        throw new Error(`Unsupported import format: ${format}`);
    }
  }

  /**
   * Parses CSV data
   */
  private static parseCSV(csvData: string): any {
    const lines = csvData.split('\n');
    const headers = lines[0].split(',');
    const documents = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const doc: any = {};

      headers.forEach((header, index) => {
        doc[header.trim()] = values[index]?.trim() || '';
      });

      if (doc.ID) {
        documents.push(doc);
      }
    }

    return { documents };
  }

  /**
   * Parses XML data (simplified)
   */
  private static parseXML(xmlData: string): any {
    // Simplified XML parsing - would use proper XML parser in production
    const documents: any[] = [];
    const docMatches = xmlData.match(/<document>(.*?)<\/document>/gs);

    if (docMatches) {
      docMatches.forEach(docXml => {
        const doc: any = {};
        const idMatch = docXml.match(/<id>(.*?)<\/id>/);
        const titleRsMatch = docXml.match(/<title_rs><!\[CDATA\[(.*?)\]\]><\/title_rs>/);
        const titleEnMatch = docXml.match(/<title_en><!\[CDATA\[(.*?)\]\]><\/title_en>/);
        const titleHuMatch = docXml.match(/<title_hu><!\[CDATA\[(.*?)\]\]><\/title_hu>/);

        if (idMatch) doc.$id = idMatch[1];
        if (titleRsMatch) doc.title_rs = titleRsMatch[1];
        if (titleEnMatch) doc.title_en = titleEnMatch[1];
        if (titleHuMatch) doc.title_hu = titleHuMatch[1];

        documents.push(doc);
      });
    }

    return { documents };
  }

  /**
   * Parses Markdown data (simplified)
   */
  private static parseMarkdown(mdData: string): any {
    const documents: any[] = [];
    const sections = mdData.split('---');

    sections.forEach(section => {
      const lines = section.split('\n');
      const doc: any = {};

      lines.forEach(line => {
        const idMatch = line.match(/\*\*ID:\*\*\s*(.+)/);
        const titleMatch = line.match(/^##\s*(.+)/);

        if (idMatch) doc.$id = idMatch[1].trim();
        if (titleMatch) doc.title_rs = titleMatch[1].trim();
      });

      if (doc.$id) {
        documents.push(doc);
      }
    });

    return { documents };
  }

  /**
   * Validates import data
   */
  private static validateImportData(data: any): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!data.documents || !Array.isArray(data.documents)) {
      errors.push('Import data must contain documents array');
      return { valid: false, errors, warnings };
    }

    if (data.documents.length === 0) {
      warnings.push('No documents found in import data');
    }

    data.documents.forEach((doc: any, index: number) => {
      if (!doc.$id && !doc.title_rs && !doc.title_en) {
        warnings.push(`Document ${index} has no ID or title`);
      }

      if (doc.components && !Array.isArray(doc.components)) {
        errors.push(`Document ${index} has invalid components structure`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Imports a single document
   */
  private static async importSingleDocument(
    doc: any,
    options: ImportOptions
  ): Promise<string> {
    const database = new Databases(appw);
    const docId = options.preserveIds && doc.$id ? doc.$id : ID.unique();

    // Check if document exists
    if (!options.overwriteExisting) {
      try {
        await database.getDocument(config.website_db, config.about_us_db, docId);
        throw new Error(`Document ${docId} already exists`);
      } catch (error) {
        // Document doesn't exist, continue with import
      }
    }

    // Prepare document data
    const docData: any = {
      ...doc,
      $id: docId
    };

    // Remove metadata that shouldn't be imported
    delete docData.$createdAt;
    delete docData.$updatedAt;
    delete docData.$permissions;

    // Handle components
    let components: ContentComponent[] = [];
    if (doc.components && Array.isArray(doc.components)) {
      components = doc.components;
      delete docData.components;
    }

    // Auto-migrate if requested
    if (options.autoMigrate && !components.length) {
      try {
        components = await ContentMigrationService.migrateLegacyDocument(docData);
        docData.use_legacy_content = false;
      } catch (error) {
        console.warn('Auto-migration failed, importing as legacy:', error);
      }
    }

    // Import document
    if (options.overwriteExisting) {
      await database.updateDocument(config.website_db, config.about_us_db, docId, docData);
    } else {
      await database.createDocument(config.website_db, config.about_us_db, docId, docData);
    }

    // Import components
    for (const component of components) {
      const compId = options.preserveIds && component.$id ? component.$id : ID.unique();
      const compData = {
        ...component,
        $id: compId,
        parent_id: docId
      };

      delete compData.$createdAt;
      delete compData.$updatedAt;
      delete compData.$permissions;

      await database.createDocument(
        config.website_db,
        config.enhanced_text_components,
        compId,
        compData
      );
    }

    return docId;
  }
}

// Convenience exports
export const exportContent = ContentImportExportService.exportContent.bind(ContentImportExportService);
export const importContent = ContentImportExportService.importContent.bind(ContentImportExportService);
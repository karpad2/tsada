/**
 * Forms Service
 * Google Forms-style form builder and response management
 */

import { Databases, Query } from 'appwrite';
import { appw, config } from '@/appwrite';

export interface FormField {
  id: string;
  type: 'text' | 'textarea' | 'email' | 'number' | 'tel' | 'date' | 'time' | 'select' | 'radio' | 'checkbox' | 'file';
  label: string;
  description?: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // For select, radio, checkbox
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
}

export interface Form {
  $id?: string;
  title: string;
  description?: string;
  fields: FormField[];
  settings: {
    allowMultipleResponses: boolean;
    requireLogin: boolean;
    showProgressBar: boolean;
    confirmationMessage: string;
    collectEmail: boolean;
    active: boolean;
  };
  theme?: {
    primaryColor?: string;
    backgroundColor?: string;
    headerImage?: string;
  };
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  responsesCount?: number;
}

export interface FormResponse {
  $id?: string;
  formId: string;
  responses: Record<string, any>;
  submittedBy?: string;
  submittedAt: string;
  ipAddress?: string;
  userAgent?: string;
}

export class FormsService {
  private static instance: FormsService;
  private databases: Databases;

  static getInstance(): FormsService {
    if (!FormsService.instance) {
      FormsService.instance = new FormsService();
    }
    return FormsService.instance;
  }

  private constructor() {
    this.databases = new Databases(appw);
  }

  /**
   * Create a new form
   */
  async createForm(form: Form): Promise<Form> {
    try {
      const document = await this.databases.createDocument(
        config.website_db,
        config.forms || 'forms',
        'unique()',
        {
          title: form.title,
          description: form.description || '',
          fields: JSON.stringify(form.fields),
          settings: JSON.stringify(form.settings),
          theme: JSON.stringify(form.theme || {}),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          responsesCount: 0,
        }
      );

      return this.documentToForm(document);
    } catch (error) {
      console.error('Failed to create form:', error);
      throw error;
    }
  }

  /**
   * Update an existing form
   */
  async updateForm(formId: string, updates: Partial<Form>): Promise<Form> {
    try {
      const updateData: any = {
        updatedAt: new Date().toISOString(),
      };

      if (updates.title) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.fields) updateData.fields = JSON.stringify(updates.fields);
      if (updates.settings) updateData.settings = JSON.stringify(updates.settings);
      if (updates.theme) updateData.theme = JSON.stringify(updates.theme);

      const document = await this.databases.updateDocument(
        config.website_db,
        config.forms || 'forms',
        formId,
        updateData
      );

      return this.documentToForm(document);
    } catch (error) {
      console.error('Failed to update form:', error);
      throw error;
    }
  }

  /**
   * Get a form by ID
   */
  async getForm(formId: string): Promise<Form> {
    try {
      const document = await this.databases.getDocument(
        config.website_db,
        config.forms || 'forms',
        formId
      );

      return this.documentToForm(document);
    } catch (error) {
      console.error('Failed to get form:', error);
      throw error;
    }
  }

  /**
   * List all forms
   */
  async listForms(limit: number = 25, offset: number = 0): Promise<{ forms: Form[]; total: number }> {
    try {
      const result = await this.databases.listDocuments(
        config.website_db,
        config.forms || 'forms',
        [Query.orderDesc('createdAt'), Query.limit(limit), Query.offset(offset)]
      );

      return {
        forms: result.documents.map(doc => this.documentToForm(doc)),
        total: result.total,
      };
    } catch (error) {
      console.error('Failed to list forms:', error);
      throw error;
    }
  }

  /**
   * Delete a form
   */
  async deleteForm(formId: string): Promise<void> {
    try {
      await this.databases.deleteDocument(
        config.website_db,
        config.forms || 'forms',
        formId
      );
    } catch (error) {
      console.error('Failed to delete form:', error);
      throw error;
    }
  }

  /**
   * Submit a form response
   */
  async submitResponse(formId: string, responses: Record<string, any>, userId?: string): Promise<FormResponse> {
    try {
      // Validate responses against form fields
      const form = await this.getForm(formId);
      this.validateResponses(form, responses);

      const response: FormResponse = {
        formId,
        responses,
        submittedAt: new Date().toISOString(),
        submittedBy: userId,
      };

      const document = await this.databases.createDocument(
        config.website_db,
        config.form_responses || 'form_responses',
        'unique()',
        {
          formId,
          responses: JSON.stringify(responses),
          submittedAt: response.submittedAt,
          submittedBy: userId || '',
        }
      );

      // Increment responses count
      await this.databases.updateDocument(
        config.website_db,
        config.forms || 'forms',
        formId,
        {
          responsesCount: (form.responsesCount || 0) + 1,
        }
      );

      return {
        ...response,
        $id: document.$id,
      };
    } catch (error) {
      console.error('Failed to submit response:', error);
      throw error;
    }
  }

  /**
   * Get responses for a form
   */
  async getFormResponses(
    formId: string,
    limit: number = 25,
    offset: number = 0
  ): Promise<{ responses: FormResponse[]; total: number }> {
    try {
      const result = await this.databases.listDocuments(
        config.website_db,
        config.form_responses || 'form_responses',
        [Query.equal('formId', formId), Query.orderDesc('submittedAt'), Query.limit(limit), Query.offset(offset)]
      );

      return {
        responses: result.documents.map(doc => this.documentToResponse(doc)),
        total: result.total,
      };
    } catch (error) {
      console.error('Failed to get responses:', error);
      throw error;
    }
  }

  /**
   * Get a single response
   */
  async getResponse(responseId: string): Promise<FormResponse> {
    try {
      const document = await this.databases.getDocument(
        config.website_db,
        config.form_responses || 'form_responses',
        responseId
      );

      return this.documentToResponse(document);
    } catch (error) {
      console.error('Failed to get response:', error);
      throw error;
    }
  }

  /**
   * Delete a response
   */
  async deleteResponse(responseId: string): Promise<void> {
    try {
      await this.databases.deleteDocument(
        config.website_db,
        config.form_responses || 'form_responses',
        responseId
      );
    } catch (error) {
      console.error('Failed to delete response:', error);
      throw error;
    }
  }

  /**
   * Get form statistics
   */
  async getFormStats(formId: string): Promise<{
    totalResponses: number;
    fieldStats: Record<string, any>;
  }> {
    try {
      const { responses, total } = await this.getFormResponses(formId, 1000);
      const form = await this.getForm(formId);

      const fieldStats: Record<string, any> = {};

      form.fields.forEach(field => {
        fieldStats[field.id] = {
          label: field.label,
          type: field.type,
          responses: [],
        };

        if (field.type === 'select' || field.type === 'radio' || field.type === 'checkbox') {
          fieldStats[field.id].counts = {};
          field.options?.forEach(option => {
            fieldStats[field.id].counts[option] = 0;
          });
        }
      });

      responses.forEach(response => {
        Object.keys(response.responses).forEach(fieldId => {
          if (fieldStats[fieldId]) {
            const value = response.responses[fieldId];
            fieldStats[fieldId].responses.push(value);

            // Count for select/radio/checkbox
            if (fieldStats[fieldId].counts) {
              if (Array.isArray(value)) {
                value.forEach(v => {
                  if (fieldStats[fieldId].counts[v] !== undefined) {
                    fieldStats[fieldId].counts[v]++;
                  }
                });
              } else {
                if (fieldStats[fieldId].counts[value] !== undefined) {
                  fieldStats[fieldId].counts[value]++;
                }
              }
            }
          }
        });
      });

      return {
        totalResponses: total,
        fieldStats,
      };
    } catch (error) {
      console.error('Failed to get form stats:', error);
      throw error;
    }
  }

  /**
   * Validate responses against form fields
   */
  private validateResponses(form: Form, responses: Record<string, any>): void {
    form.fields.forEach(field => {
      const value = responses[field.id];

      // Required field check
      if (field.required && (value === undefined || value === null || value === '')) {
        throw new Error(`Field "${field.label}" is required`);
      }

      // Type-specific validation
      if (value !== undefined && value !== null && value !== '') {
        if (field.validation) {
          // Min/Max for numbers
          if (field.type === 'number' && typeof value === 'number') {
            if (field.validation.min !== undefined && value < field.validation.min) {
              throw new Error(`${field.label} must be at least ${field.validation.min}`);
            }
            if (field.validation.max !== undefined && value > field.validation.max) {
              throw new Error(`${field.label} must be at most ${field.validation.max}`);
            }
          }

          // Min/Max length for text
          if ((field.type === 'text' || field.type === 'textarea') && typeof value === 'string') {
            if (field.validation.minLength && value.length < field.validation.minLength) {
              throw new Error(`${field.label} must be at least ${field.validation.minLength} characters`);
            }
            if (field.validation.maxLength && value.length > field.validation.maxLength) {
              throw new Error(`${field.label} must be at most ${field.validation.maxLength} characters`);
            }
          }
        }
      }
    });
  }

  /**
   * Convert Appwrite document to Form
   */
  private documentToForm(doc: any): Form {
    return {
      $id: doc.$id,
      title: doc.title,
      description: doc.description,
      fields: JSON.parse(doc.fields),
      settings: JSON.parse(doc.settings),
      theme: doc.theme ? JSON.parse(doc.theme) : {},
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      responsesCount: doc.responsesCount || 0,
    };
  }

  /**
   * Convert Appwrite document to FormResponse
   */
  private documentToResponse(doc: any): FormResponse {
    return {
      $id: doc.$id,
      formId: doc.formId,
      responses: JSON.parse(doc.responses),
      submittedAt: doc.submittedAt,
      submittedBy: doc.submittedBy,
    };
  }
}

export default FormsService;

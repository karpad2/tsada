// Content Migration and Backward Compatibility Utilities
import { ID } from 'appwrite';
import type { ContentComponent, LegacyContent, ComponentType } from '@/types/contentTypes';

export interface LegacyDocument {
  $id: string;
  title_rs?: string;
  title_en?: string;
  title_hu?: string;
  text_rs?: string;
  text_en?: string;
  text_hu?: string;
  yt_video?: string[];
  has_gallery?: boolean;
  gallery?: any;
  has_documents?: boolean;
  video?: string;
  show_date?: boolean;
  use_legacy_content?: boolean;
  $createdAt?: string;
  $updatedAt?: string;
}

export interface MigrationOptions {
  preserveOriginal?: boolean; // Keep original legacy fields
  createBackup?: boolean; // Create backup before migration
  batchSize?: number; // Number of documents to process at once
}

export class ContentMigrationService {
  /**
   * Converts legacy document to new modular component system
   */
  static async migrateLegacyDocument(
    legacyDoc: LegacyDocument,
    options: MigrationOptions = {}
  ): Promise<ContentComponent[]> {
    const components: ContentComponent[] = [];
    let order = 0;

    console.log('Migrating legacy document:', legacyDoc);
    console.log('Has title_rs:', !!legacyDoc.title_rs);
    console.log('Has title_en:', !!legacyDoc.title_en);
    console.log('Has title_hu:', !!legacyDoc.title_hu);
    console.log('Has text_rs:', !!legacyDoc.text_rs);
    console.log('Has text_en:', !!legacyDoc.text_en);
    console.log('Has text_hu:', !!legacyDoc.text_hu);

    // 1. Create heading component from title
    if (legacyDoc.title_rs || legacyDoc.title_en || legacyDoc.title_hu) {
      console.log('Creating heading component');
      const headingComponent = this.createHeadingComponent(legacyDoc, order++);
      components.push(headingComponent);
    }

    // 2. Create text components from content
    if (legacyDoc.text_rs || legacyDoc.text_en || legacyDoc.text_hu) {
      console.log('Creating text component');
      const textComponent = this.createTextComponent(legacyDoc, order++);
      components.push(textComponent);
    }

    // 3. Create YouTube components
    if (legacyDoc.yt_video && legacyDoc.yt_video.length > 0) {
      for (const videoUrl of legacyDoc.yt_video) {
        const youtubeComponent = this.createYouTubeComponent(legacyDoc, videoUrl, order++);
        components.push(youtubeComponent);
      }
    }

    // 4. Create gallery component
    if (legacyDoc.has_gallery && legacyDoc.gallery) {
      const galleryComponent = this.createGalleryComponent(legacyDoc, order++);
      components.push(galleryComponent);
    }

    // 5. Create video component (custom video)
    if (legacyDoc.video) {
      const videoComponent = this.createVideoComponent(legacyDoc, order++);
      components.push(videoComponent);
    }

    // 6. Create document listing component
    if (legacyDoc.has_documents) {
      const documentsComponent = this.createDocumentsComponent(legacyDoc, order++);
      components.push(documentsComponent);
    }

    // Add metadata to all components (Appwrite will handle $createdAt and $updatedAt automatically)
    components.forEach(component => {
      // Remove created_at and updated_at as they are handled by Appwrite
      delete component.created_at;
      delete component.updated_at;
    });

    console.log('Final components count:', components.length);
    console.log('Generated components:', components);

    return components;
  }

  /**
   * Creates a heading component from legacy title
   */
  private static createHeadingComponent(legacyDoc: LegacyDocument, order: number): ContentComponent {
    return {
      $id: ID.unique(),
      type: 'heading',
      order,
      parent_id: legacyDoc.$id || '', // Ensure it's not null
      parent_type: 'document',
      content_rs: {
        title: legacyDoc.title_rs || '',
        subtitle: ''
      },
      content_en: {
        title: legacyDoc.title_en || '',
        subtitle: ''
      },
      content_hu: {
        title: legacyDoc.title_hu || '',
        subtitle: ''
      },
      language_metadata: {
        primary_language: 'rs',
        available_languages: this.getAvailableLanguages(legacyDoc, 'title'),
        translation_status: {
          rs: legacyDoc.title_rs ? 'complete' : 'missing',
          en: legacyDoc.title_en ? 'complete' : 'missing',
          hu: legacyDoc.title_hu ? 'complete' : 'missing'
        }
      },
      settings: {
        heading_level: 1,
        alignment: 'left',
        show_decorator: true,
        decorator_color: 'bg-blue-500'
      },
      visible: true,
      published: true,
      created_by: 'migration_system'
    };
  }

  /**
   * Creates a text component from legacy content
   */
  private static createTextComponent(legacyDoc: LegacyDocument, order: number): ContentComponent {
    return {
      $id: ID.unique(),
      type: 'text',
      order,
      parent_id: legacyDoc.$id || '', // Ensure it's not null
      parent_type: 'document',
      content_rs: {
        content: legacyDoc.text_rs || '',
        style: 'paragraph'
      },
      content_en: {
        content: legacyDoc.text_en || '',
        style: 'paragraph'
      },
      content_hu: {
        content: legacyDoc.text_hu || '',
        style: 'paragraph'
      },
      language_metadata: {
        primary_language: 'rs',
        available_languages: this.getAvailableLanguages(legacyDoc, 'text'),
        translation_status: {
          rs: legacyDoc.text_rs ? 'complete' : 'missing',
          en: legacyDoc.text_en ? 'complete' : 'missing',
          hu: legacyDoc.text_hu ? 'complete' : 'missing'
        }
      },
      settings: {
        layout: 'full',
        alignment: 'left',
        spacing: 'normal'
      },
      visible: true,
      published: true,
      created_by: 'migration_system'
    };
  }

  /**
   * Creates YouTube component from legacy video URL
   */
  private static createYouTubeComponent(
    legacyDoc: LegacyDocument,
    videoUrl: string,
    order: number
  ): ContentComponent {
    return {
      $id: ID.unique(),
      type: 'youtube',
      order,
      parent_id: legacyDoc.$id || '', // Ensure it's not null
      parent_type: 'document',
      content_rs: {
        youtube_url: videoUrl,
        autoplay: false,
        controls: true,
        muted: false,
        loop: false
      },
      content_en: {
        youtube_url: videoUrl,
        autoplay: false,
        controls: true,
        muted: false,
        loop: false
      },
      content_hu: {
        youtube_url: videoUrl,
        autoplay: false,
        controls: true,
        muted: false,
        loop: false
      },
      language_metadata: {
        primary_language: 'rs',
        available_languages: ['rs', 'en', 'hu'],
        translation_status: {
          rs: 'complete',
          en: 'complete',
          hu: 'complete'
        }
      },
      settings: {
        aspect_ratio: '16:9',
        alignment: 'center'
      },
      visible: true,
      published: true,
      created_by: 'migration_system'
    };
  }

  /**
   * Creates gallery component from legacy gallery
   */
  private static createGalleryComponent(legacyDoc: LegacyDocument, order: number): ContentComponent {
    const galleryId = typeof legacyDoc.gallery === 'object'
      ? legacyDoc.gallery?.$id || legacyDoc.gallery?.id
      : legacyDoc.gallery;

    return {
      $id: ID.unique(),
      type: 'gallery',
      order,
      parent_id: legacyDoc.$id || '', // Ensure it's not null
      parent_type: 'document',
      content_rs: {
        images: [{ id: galleryId }],
        layout: 'grid',
        columns: 3,
        show_captions: true,
        lightbox: true
      },
      content_en: {
        images: [{ id: galleryId }],
        layout: 'grid',
        columns: 3,
        show_captions: true,
        lightbox: true
      },
      content_hu: {
        images: [{ id: galleryId }],
        layout: 'grid',
        columns: 3,
        show_captions: true,
        lightbox: true
      },
      language_metadata: {
        primary_language: 'rs',
        available_languages: ['rs', 'en', 'hu'],
        translation_status: {
          rs: 'complete',
          en: 'complete',
          hu: 'complete'
        }
      },
      settings: {
        alignment: 'center'
      },
      visible: true,
      published: true,
      created_by: 'migration_system'
    };
  }

  /**
   * Creates video component from legacy video
   */
  private static createVideoComponent(legacyDoc: LegacyDocument, order: number): ContentComponent {
    return {
      $id: ID.unique(),
      type: 'video',
      order,
      parent_id: legacyDoc.$id || '', // Ensure it's not null
      parent_type: 'document',
      content_rs: {
        video_id: legacyDoc.video,
        autoplay: false,
        controls: true,
        muted: false,
        loop: false
      },
      content_en: {
        video_id: legacyDoc.video,
        autoplay: false,
        controls: true,
        muted: false,
        loop: false
      },
      content_hu: {
        video_id: legacyDoc.video,
        autoplay: false,
        controls: true,
        muted: false,
        loop: false
      },
      language_metadata: {
        primary_language: 'rs',
        available_languages: ['rs', 'en', 'hu'],
        translation_status: {
          rs: 'complete',
          en: 'complete',
          hu: 'complete'
        }
      },
      settings: {
        aspect_ratio: '16:9',
        alignment: 'center',
        show_controls: true
      },
      visible: true,
      published: true,
      created_by: 'migration_system'
    };
  }

  /**
   * Creates documents listing component
   */
  private static createDocumentsComponent(legacyDoc: LegacyDocument, order: number): ContentComponent {
    return {
      $id: ID.unique(),
      type: 'legacy_content',
      order,
      parent_id: legacyDoc.$id || '', // Ensure it's not null
      parent_type: 'document',
      content_rs: {
        title: 'Kapcsolódó dokumentumok',
        content: `<div class="documents-section"><DocLister _id="${legacyDoc.$id}" /></div>`
      },
      content_en: {
        title: 'Related Documents',
        content: `<div class="documents-section"><DocLister _id="${legacyDoc.$id}" /></div>`
      },
      content_hu: {
        title: 'Kapcsolódó dokumentumok',
        content: `<div class="documents-section"><DocLister _id="${legacyDoc.$id}" /></div>`
      },
      language_metadata: {
        primary_language: 'rs',
        available_languages: ['rs', 'en', 'hu'],
        translation_status: {
          rs: 'complete',
          en: 'complete',
          hu: 'complete'
        }
      },
      settings: {
        layout: 'full'
      },
      visible: true,
      published: true,
      created_by: 'migration_system'
    };
  }

  /**
   * Determines available languages based on legacy content
   */
  private static getAvailableLanguages(
    legacyDoc: LegacyDocument,
    contentType: 'title' | 'text'
  ): ('rs' | 'en' | 'hu')[] {
    const languages: ('rs' | 'en' | 'hu')[] = [];

    if (contentType === 'title') {
      if (legacyDoc.title_rs) languages.push('rs');
      if (legacyDoc.title_en) languages.push('en');
      if (legacyDoc.title_hu) languages.push('hu');
    } else if (contentType === 'text') {
      if (legacyDoc.text_rs) languages.push('rs');
      if (legacyDoc.text_en) languages.push('en');
      if (legacyDoc.text_hu) languages.push('hu');
    }

    return languages.length > 0 ? languages : ['rs'];
  }

  /**
   * Checks if document should use legacy content system
   */
  static shouldUseLegacyContent(document: any): boolean {
    // If explicitly set to use legacy content
    if (document.use_legacy_content === true) {
      return true;
    }

    // If explicitly set to use new system
    if (document.use_legacy_content === false) {
      return false;
    }

    // Auto-detect based on content structure
    const hasLegacyFields = !!(
      document.title_rs || document.title_en || document.title_hu ||
      document.text_rs || document.text_en || document.text_hu ||
      document.yt_video || document.has_gallery || document.has_documents
    );

    const hasModularComponents = !!(document.components && document.components.length > 0);

    // If it has both, prefer modular
    if (hasModularComponents) {
      return false;
    }

    // If it only has legacy fields, use legacy
    return hasLegacyFields;
  }

  /**
   * Creates a compatibility wrapper for legacy content
   */
  static createLegacyCompatibilityComponent(legacyDoc: LegacyDocument): ContentComponent {
    return {
      $id: ID.unique(),
      type: 'legacy_content',
      order: 0,
      parent_id: legacyDoc.$id,
      parent_type: 'document',
      content_rs: legacyDoc as any,
      content_en: legacyDoc as any,
      content_hu: legacyDoc as any,
      language_metadata: {
        primary_language: 'rs',
        available_languages: ['rs', 'en', 'hu'],
        translation_status: {
          rs: 'complete',
          en: 'complete',
          hu: 'complete'
        }
      },
      settings: {
        legacy_mode: true
      },
      visible: true,
      published: true,
      created_by: 'legacy_compatibility_system'
    };
  }

  /**
   * Converts modular components back to legacy format (for export/backup)
   */
  static convertToLegacyFormat(components: ContentComponent[]): Partial<LegacyDocument> {
    const legacy: Partial<LegacyDocument> = {};

    components.forEach(component => {
      switch (component.type) {
        case 'heading':
          if (!legacy.title_rs && component.content_rs?.title) {
            legacy.title_rs = component.content_rs.title;
          }
          if (!legacy.title_en && component.content_en?.title) {
            legacy.title_en = component.content_en.title;
          }
          if (!legacy.title_hu && component.content_hu?.title) {
            legacy.title_hu = component.content_hu.title;
          }
          break;

        case 'text':
          if (!legacy.text_rs && component.content_rs?.content) {
            legacy.text_rs = component.content_rs.content;
          }
          if (!legacy.text_en && component.content_en?.content) {
            legacy.text_en = component.content_en.content;
          }
          if (!legacy.text_hu && component.content_hu?.content) {
            legacy.text_hu = component.content_hu.content;
          }
          break;

        case 'youtube':
          if (!legacy.yt_video) {
            legacy.yt_video = [];
          }
          const youtubeUrl = component.content_rs?.youtube_url;
          if (youtubeUrl && !legacy.yt_video.includes(youtubeUrl)) {
            legacy.yt_video.push(youtubeUrl);
          }
          break;

        case 'gallery':
          legacy.has_gallery = true;
          if (component.content_rs?.images?.[0]?.id) {
            legacy.gallery = component.content_rs.images[0].id;
          }
          break;

        case 'video':
          if (component.content_rs?.video_id) {
            legacy.video = component.content_rs.video_id;
          }
          break;
      }
    });

    return legacy;
  }
}

// Export helper functions for easy use
export const migrateLegacyDocument = ContentMigrationService.migrateLegacyDocument.bind(ContentMigrationService);
export const shouldUseLegacyContent = ContentMigrationService.shouldUseLegacyContent.bind(ContentMigrationService);
export const createLegacyCompatibilityComponent = ContentMigrationService.createLegacyCompatibilityComponent.bind(ContentMigrationService);
export const convertToLegacyFormat = ContentMigrationService.convertToLegacyFormat.bind(ContentMigrationService);
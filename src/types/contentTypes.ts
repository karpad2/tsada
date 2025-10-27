// Enhanced Content System Types

export interface ContentComponent {
  $id: string;
  type: ComponentType;
  name?: string; // Azonosító név admin felületen (opcionális)
  order: number;
  parent_id: string; // Melyik dokumentumhoz/oldalhoz tartozik
  parent_type: 'document' | 'page' | 'news' | 'about'; // Backward compatibility

  // Többnyelvű tartalom
  content_rs: ComponentContent;
  content_en: ComponentContent;
  content_hu: ComponentContent;

  // Nyelvi metaadatok - minden komponensben tárolva van, hogy milyen nyelvű
  language_metadata: {
    primary_language: 'rs' | 'en' | 'hu'; // Elsődleges nyelv
    available_languages: ('rs' | 'en' | 'hu')[]; // Elérhető nyelvek
    current_editing_language?: 'rs' | 'en' | 'hu'; // Jelenleg szerkesztett nyelv
    translation_status: {
      rs: 'complete' | 'partial' | 'missing';
      en: 'complete' | 'partial' | 'missing';
      hu: 'complete' | 'partial' | 'missing';
    };
  };

  // Komponens specifikus beállítások
  settings: ComponentSettings;

  // Láthatóság és státusz
  visible: boolean;
  published: boolean;

  // Metadata (created_at and updated_at are handled automatically by Appwrite as $createdAt and $updatedAt)
  created_by: string;
}

export type ComponentType =
  | 'text'
  | 'rich_text'
  | 'heading'
  | 'gallery'
  | 'image'
  | 'video'
  | 'youtube'
  | 'form'
  | 'button'
  | 'divider'
  | 'table'
  | 'quote'
  | 'code'
  | 'embed'
  | 'download'
  | 'accordion'
  | 'tabs'
  | 'cards'
  | 'timeline'
  | 'contact_info'
  | 'map'
  | 'social_media'
  | 'newsletter'
  | 'legacy_content'; // Backward compatibility

export interface ComponentContent {
  // Általános mezők
  title?: string;
  subtitle?: string;
  description?: string;
  content?: string; // HTML tartalom

  // Speciális mezők komponens típusokhoz
  [key: string]: any;
}

export interface ComponentSettings {
  // Layout beállítások
  layout?: 'full' | 'container' | 'narrow';
  alignment?: 'left' | 'center' | 'right';
  spacing?: 'tight' | 'normal' | 'loose';

  // Stílus beállítások
  background_color?: string;
  text_color?: string;
  padding?: string;
  margin?: string;
  border_radius?: string;
  shadow?: boolean;

  // Animációk
  animation?: 'none' | 'fade' | 'slide' | 'zoom';
  animation_delay?: number;

  // Komponens specifikus beállítások
  [key: string]: any;
}

// Specifikus komponens típusok

export interface TextComponentContent extends ComponentContent {
  content: string;
  style: 'paragraph' | 'heading1' | 'heading2' | 'heading3' | 'quote' | 'caption';
}

export interface GalleryComponentContent extends ComponentContent {
  images: Array<{
    id: string;
    url?: string;
    caption?: string;
    alt_text?: string;
  }>;
  layout: 'grid' | 'carousel' | 'masonry' | 'slideshow';
  columns: number;
  show_captions: boolean;
  lightbox: boolean;
}

export interface AlbumGalleryComponentContent extends ComponentContent {
  gallery_id: string;
  title?: string;
  description?: string;
  show_captions: boolean;
}

export interface DocumentsComponentContent extends ComponentContent {
  title?: string;
  description?: string;
}

export interface VideoComponentContent extends ComponentContent {
  video_id?: string; // Appwrite storage
  youtube_url?: string;
  vimeo_url?: string;
  thumbnail_id?: string;
  autoplay: boolean;
  controls: boolean;
  muted: boolean;
  loop: boolean;
}

export interface FormComponentContent extends ComponentContent {
  fields: Array<{
    id: string;
    type: 'text' | 'email' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file' | 'date';
    name: string;
    label: string;
    placeholder?: string;
    required: boolean;
    validation?: string;
    options?: string[]; // select/radio esetén
  }>;
  submit_action: 'email' | 'webhook' | 'database';
  submit_target: string; // email cím, webhook URL, vagy database collection
  success_message: string;
  error_message: string;
  redirect_url?: string;
}

export interface ButtonComponentContent extends ComponentContent {
  text: string;
  url?: string;
  action?: 'link' | 'download' | 'modal' | 'scroll' | 'form_submit';
  target?: '_self' | '_blank' | '_parent';
  style: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size: 'small' | 'medium' | 'large';
  icon?: string;
  icon_position?: 'left' | 'right';
}

export interface TableComponentContent extends ComponentContent {
  headers: string[];
  rows: string[][];
  sortable: boolean;
  searchable: boolean;
  pagination: boolean;
  responsive: boolean;
}

export interface AccordionComponentContent extends ComponentContent {
  items: Array<{
    id: string;
    title: string;
    content: string;
    open_by_default?: boolean;
  }>;
  allow_multiple: boolean;
  style: 'default' | 'bordered' | 'filled';
}

export interface TabsComponentContent extends ComponentContent {
  tabs: Array<{
    id: string;
    title: string;
    content: string;
    icon?: string;
  }>;
  position: 'top' | 'left' | 'right' | 'bottom';
  style: 'default' | 'pills' | 'underline';
}

export interface ImageComponentContent extends ComponentContent {
  image_id?: string; // Appwrite storage
  url?: string; // External URL
  alt_text?: string;
  caption?: string;
}

export interface DividerComponentContent extends ComponentContent {
  text?: string; // Optional text in the middle of divider
}

export interface QuoteComponentContent extends ComponentContent {
  text: string;
  author?: string;
  source?: string;
  author_image_id?: string;
  author_image_url?: string;
}

export interface CodeComponentContent extends ComponentContent {
  code: string;
  language: string; // Programming language for syntax highlighting
  show_line_numbers: boolean;
  copy_button: boolean;
}

export interface EmbedComponentContent extends ComponentContent {
  embed_code: string; // HTML embed code
  embed_url?: string; // URL to be embedded
  width?: string;
  height?: string;
}

export interface DownloadComponentContent extends ComponentContent {
  file_id?: string; // Appwrite storage
  file_url?: string; // External URL
  filename: string;
  file_size?: number;
  file_type?: string;
}

export interface CardsComponentContent extends ComponentContent {
  cards: Array<{
    id: string;
    title: string;
    content: string;
    image_id?: string;
    image_url?: string;
    link_url?: string;
    link_text?: string;
  }>;
  layout: 'grid' | 'list' | 'carousel';
  columns: number;
}

export interface TimelineComponentContent extends ComponentContent {
  events: Array<{
    id: string;
    date: string;
    title: string;
    content: string;
    image_id?: string;
    image_url?: string;
  }>;
  style: 'vertical' | 'horizontal';
  show_dates: boolean;
}

export interface ContactInfoComponentContent extends ComponentContent {
  contact_items: Array<{
    id: string;
    type: 'phone' | 'email' | 'address' | 'website' | 'social';
    label: string;
    value: string;
    icon?: string;
    link?: string;
  }>;
  layout: 'list' | 'grid' | 'inline';
}

export interface MapComponentContent extends ComponentContent {
  latitude: number;
  longitude: number;
  zoom: number;
  address?: string;
  marker_title?: string;
  marker_description?: string;
  map_style: 'roadmap' | 'satellite' | 'hybrid' | 'terrain';
}

export interface SocialMediaComponentContent extends ComponentContent {
  platforms: Array<{
    id: string;
    platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'youtube' | 'tiktok' | 'other';
    url: string;
    username?: string;
    custom_icon?: string;
  }>;
  style: 'icons' | 'buttons' | 'cards';
  show_labels: boolean;
}

export interface NewsletterComponentContent extends ComponentContent {
  form_action: string; // Endpoint for newsletter signup
  privacy_text?: string;
  success_message: string;
  error_message: string;
}

// Legacy support interface for backward compatibility
export interface LegacyContent {
  title_rs: string;
  title_en: string;
  title_hu: string;
  text_rs: string;
  text_en: string;
  text_hu: string;
  yt_video?: string[];
  has_gallery?: boolean;
  gallery?: any;
  has_documents?: boolean;
  video?: string;
  show_date?: boolean;
}

// Content page structure
export interface ContentPage {
  $id: string;
  type: 'document' | 'page' | 'news' | 'about';
  title_rs: string;
  title_en: string;
  title_hu: string;
  slug?: string;

  // Legacy fields (backward compatibility)
  text_rs?: string;
  text_en?: string;
  text_hu?: string;

  // New modular system
  use_legacy_content: boolean; // Flag to switch between old and new system
  components?: string[]; // Array of ContentComponent IDs in order

  // Meta information
  published: boolean;
  featured: boolean;
  seo_title?: string;
  seo_description?: string;
  tags?: string[];

  created_by: string;
}
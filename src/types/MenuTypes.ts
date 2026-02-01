// ============================================================
// Menu System Type Definitions
// ============================================================

// --- Condition system ---

/**
 * Defines visibility conditions for menu groups and items.
 * All specified conditions must be met (AND logic).
 */
export interface MenuCondition {
  /** 'required' = must be logged in, 'forbidden' = must NOT be logged in */
  auth?: 'required' | 'forbidden'
  /** User must have one of these roles (implies auth: required) */
  roles?: string[]
  /** User must NOT have any of these roles */
  excludeRoles?: string[]
  /** A named dynamic setting that must be truthy */
  setting?: 'erasmus-apply' | 'erasmus-list'
}

// --- Code-defined registry types (MenuRegistry.ts) ---

export type MenuGroupType = 'dropdown' | 'direct-link' | 'language-selector'

export interface MenuItemDefinition {
  id: string
  labelKey?: string
  to?: string
  href?: string
  /** Replaced at runtime with items from NavigationService */
  dynamicSource?: 'about' | 'erasmus' | 'students' | 'documents'
  /** Route prefix for dynamic source items (e.g. '/renderer/about/') */
  dynamicRoutePrefix?: string
  condition?: MenuCondition
  /** Special action instead of navigation */
  isAction?: 'logout'
  children?: MenuItemDefinition[]
}

export interface MenuGroupDefinition {
  id: string
  type: MenuGroupType
  labelKey?: string
  /** For direct-link type groups */
  to?: string
  condition?: MenuCondition
  items: MenuItemDefinition[]
}

// --- Appwrite-stored config types (overlay on registry) ---

export interface MenuItemConfig {
  id: string
  enabled: boolean
  order: number
}

export interface MenuGroupConfig {
  id: string
  enabled: boolean
  order: number
  items?: MenuItemConfig[]
}

export interface CustomLink {
  id: string
  labels: Record<string, string>
  to?: string
  href?: string
  parentGroupId: string
  order: number
  enabled: boolean
}

export interface CustomGroup {
  id: string
  type: 'dropdown' | 'direct-link'
  labels: Record<string, string>
  to?: string
  order: number
  enabled: boolean
  items: CustomLink[]
}

export interface MenuConfig {
  version: number
  groups: MenuGroupConfig[]
  customLinks?: CustomLink[]
  customGroups?: CustomGroup[]
}

// --- Runtime resolved types ---

export interface ResolvedMenuItem {
  id: string
  label: string
  to?: string
  href?: string
  action?: () => void | Promise<void>
  flag?: string
  children?: ResolvedMenuItem[]
}

export interface ResolvedMenuGroup {
  id: string
  type: MenuGroupType
  label: string
  to?: string
  visible: boolean
  items: ResolvedMenuItem[]
}

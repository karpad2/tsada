import { Databases } from 'appwrite'
import { appw, config } from '@/appwrite'
import { DEFAULT_MENU_REGISTRY } from './MenuRegistry'
import type {
  MenuConfig,
  MenuGroupConfig,
  MenuItemConfig,
  MenuGroupDefinition,
  MenuItemDefinition,
  CustomLink,
  CustomGroup,
  ResolvedMenuGroup,
  ResolvedMenuItem,
  MenuCondition
} from '@/types/MenuTypes'
import type { NavigationData, MenuItem } from './NavigationService'

const MENU_CONFIG_DOC_ID = 'menu_config'

/**
 * Service for loading, saving, merging and resolving menu configuration.
 * Config is stored in the general_settings Appwrite collection.
 */
class MenuConfigService {
  private static instance: MenuConfigService
  private cachedConfig: MenuConfig | null = null

  static getInstance(): MenuConfigService {
    if (!MenuConfigService.instance) {
      MenuConfigService.instance = new MenuConfigService()
    }
    return MenuConfigService.instance
  }

  /**
   * Load menu config from Appwrite general_settings collection.
   * Returns null if no config is saved (use defaults).
   */
  async loadMenuConfig(): Promise<MenuConfig | null> {
    if (this.cachedConfig) return this.cachedConfig

    try {
      const databases = new Databases(appw)
      const doc = await databases.getDocument(
        config.website_db,
        config.general_settings,
        MENU_CONFIG_DOC_ID
      )

      if (doc.setting_data && doc.setting_status) {
        const parsed = JSON.parse(doc.setting_data) as MenuConfig
        this.cachedConfig = parsed
        return parsed
      }
      return null
    } catch {
      // Document doesn't exist yet - that's fine, use defaults
      return null
    }
  }

  /**
   * Save menu config to Appwrite.
   * The menu_config document must be pre-created via scripts/setup-menu-config.ts
   */
  async saveMenuConfig(menuConfig: MenuConfig): Promise<void> {
    const databases = new Databases(appw)
    await databases.updateDocument(
      config.website_db,
      config.general_settings,
      MENU_CONFIG_DOC_ID,
      {
        setting_status: true,
        setting_data: JSON.stringify(menuConfig)
      }
    )
    this.cachedConfig = menuConfig
  }

  /**
   * Reset menu config to defaults (clears saved data without deleting the document).
   */
  async deleteMenuConfig(): Promise<void> {
    try {
      const databases = new Databases(appw)
      await databases.updateDocument(
        config.website_db,
        config.general_settings,
        MENU_CONFIG_DOC_ID,
        {
          setting_status: false,
          setting_data: ''
        }
      )
    } catch {
      // Document might not exist yet
    }
    this.cachedConfig = null
  }

  /**
   * Clear cached config (call after language change, etc.)
   */
  clearCache(): void {
    this.cachedConfig = null
  }

  /**
   * Get the effective menu definition by merging saved config with the default registry.
   * Returns registry groups ordered and filtered by the saved config.
   */
  getEffectiveRegistry(savedConfig: MenuConfig | null): MenuGroupDefinition[] {
    if (!savedConfig) {
      return DEFAULT_MENU_REGISTRY.map((g, i) => ({ ...g, _order: i })) as any
    }

    const configMap = new Map<string, MenuGroupConfig>()
    for (const gc of savedConfig.groups) {
      configMap.set(gc.id, gc)
    }

    // Build result: registry groups with config overrides
    const result: Array<MenuGroupDefinition & { _order: number; _enabled: boolean }> = []

    for (const group of DEFAULT_MENU_REGISTRY) {
      const gc = configMap.get(group.id)
      const enabled = gc ? gc.enabled : true
      const order = gc ? gc.order : DEFAULT_MENU_REGISTRY.indexOf(group)

      // Apply item-level config
      let items = group.items
      if (gc?.items && gc.items.length > 0) {
        const itemConfigMap = new Map<string, MenuItemConfig>()
        for (const ic of gc.items) {
          itemConfigMap.set(ic.id, ic)
        }

        items = items
          .map((item, idx) => {
            const ic = itemConfigMap.get(item.id)
            return {
              ...item,
              _order: ic ? ic.order : idx,
              _enabled: ic ? ic.enabled : true
            }
          })
          .filter((item: any) => item._enabled)
          .sort((a: any, b: any) => a._order - b._order)
      }

      // Inject custom links into this group
      if (savedConfig.customLinks) {
        const customForGroup = savedConfig.customLinks
          .filter(cl => cl.parentGroupId === group.id && cl.enabled)

        for (const cl of customForGroup) {
          items = [...items, {
            id: cl.id,
            labelKey: undefined,
            _customLabels: cl.labels,
            to: cl.to,
            href: cl.href,
            _order: cl.order,
            _enabled: true
          } as any]
        }

        // Re-sort after adding custom links
        items = [...items].sort((a: any, b: any) => (a._order ?? 999) - (b._order ?? 999))
      }

      result.push({
        ...group,
        items,
        _order: order,
        _enabled: enabled
      } as any)
    }

    // Inject custom groups
    if (savedConfig.customGroups) {
      for (const cg of savedConfig.customGroups) {
        if (!cg.enabled) continue

        const customItems = cg.items
          .filter(cl => cl.enabled)
          .sort((a, b) => a.order - b.order)
          .map(cl => ({
            id: cl.id,
            labelKey: undefined,
            _customLabels: cl.labels,
            to: cl.to,
            href: cl.href,
            _order: cl.order,
            _enabled: true
          }))

        result.push({
          id: cg.id,
          type: cg.type,
          labelKey: undefined,
          to: cg.to,
          _customLabels: cg.labels,
          items: customItems,
          _order: cg.order,
          _enabled: true,
          _isCustomGroup: true
        } as any)
      }
    }

    return result
      .filter((g: any) => g._enabled)
      .sort((a: any, b: any) => a._order - b._order)
  }

  /**
   * Resolve the menu for rendering: apply conditions, resolve dynamic sources, translate labels.
   */
  resolveMenu(
    registry: MenuGroupDefinition[],
    navigationData: NavigationData | null,
    isAuthenticated: boolean,
    userRole: string | null,
    t: (key: string) => string,
    currentLanguage: string,
    actions: { logout: () => void | Promise<void> }
  ): ResolvedMenuGroup[] {
    const erasmusSettings = navigationData?.erasmusSettings || {
      list_enabled: false,
      apply_enabled: false,
      eu_funding_enabled: false
    }

    const checkCondition = (cond?: MenuCondition): boolean => {
      if (!cond) return true

      if (cond.auth === 'required' && !isAuthenticated) return false
      if (cond.auth === 'forbidden' && isAuthenticated) return false

      if (cond.roles && cond.roles.length > 0) {
        if (!isAuthenticated || !userRole) return false
        if (!cond.roles.includes(userRole)) return false
      }

      if (cond.excludeRoles && cond.excludeRoles.length > 0) {
        if (userRole && cond.excludeRoles.includes(userRole)) return false
      }

      if (cond.setting === 'erasmus-apply' && !erasmusSettings.apply_enabled) return false
      if (cond.setting === 'erasmus-list' && !erasmusSettings.list_enabled) return false

      return true
    }

    const resolveItem = (item: MenuItemDefinition): ResolvedMenuItem[] => {
      // Check item condition
      if (!checkCondition(item.condition)) return []

      // Dynamic source: expand into multiple items
      if (item.dynamicSource) {
        return resolveDynamicSource(item.dynamicSource, item.dynamicRoutePrefix || '/')
      }

      // Custom link with inline labels
      const customLabels = (item as any)._customLabels as Record<string, string> | undefined
      const label = customLabels
        ? (customLabels[currentLanguage] || customLabels['sr'] || customLabels['hu'] || Object.values(customLabels)[0] || '')
        : (item.labelKey ? t(item.labelKey) : '')

      // Action item
      if (item.isAction === 'logout') {
        return [{
          id: item.id,
          label,
          action: actions.logout
        }]
      }

      // Item with children (nested dropdown)
      if (item.children && item.children.length > 0) {
        const resolvedChildren = item.children.flatMap(child => resolveItem(child))
        if (resolvedChildren.length === 0) return []
        return [{
          id: item.id,
          label,
          children: resolvedChildren
        }]
      }

      // Regular link item
      return [{
        id: item.id,
        label,
        to: item.to,
        href: item.href
      }]
    }

    const resolveDynamicSource = (source: string, routePrefix: string): ResolvedMenuItem[] => {
      if (!navigationData) return []

      let items: MenuItem[] = []
      switch (source) {
        case 'about':
          items = navigationData.aboutItems || []
          break
        case 'erasmus':
          items = navigationData.erasmusItems || []
          break
        case 'students':
          items = navigationData.studentItems || []
          break
        case 'documents':
          items = navigationData.documentCategories || []
          break
      }

      return items.map(mi => ({
        id: `${source}_${mi.id}`,
        label: mi.title || mi.name || '',
        to: `${routePrefix}${mi.id}`
      }))
    }

    return registry.map(group => {
      const visible = checkCondition(group.condition)

      // Resolve label (support custom group labels)
      const customGroupLabels = (group as any)._customLabels as Record<string, string> | undefined
      const label = customGroupLabels
        ? (customGroupLabels[currentLanguage] || customGroupLabels['sr'] || customGroupLabels['hu'] || Object.values(customGroupLabels)[0] || '')
        : (group.labelKey ? t(group.labelKey) : '')

      // Resolve items
      const items = group.items.flatMap(item => resolveItem(item))

      return {
        id: group.id,
        type: group.type,
        label,
        to: group.to,
        visible,
        items
      } as ResolvedMenuGroup
    })
  }

  /**
   * Create a MenuConfig from the current registry (for the editor).
   * Captures current order and enabled state.
   */
  createConfigFromRegistry(registry: MenuGroupDefinition[]): MenuConfig {
    return {
      version: 1,
      groups: registry.map((group, groupIdx) => ({
        id: group.id,
        enabled: true,
        order: groupIdx,
        items: group.items.map((item, itemIdx) => ({
          id: item.id,
          enabled: true,
          order: itemIdx
        }))
      })),
      customLinks: []
    }
  }
}

export const menuConfigService = MenuConfigService.getInstance()

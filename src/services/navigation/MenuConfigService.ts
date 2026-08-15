import { DEFAULT_MENU_REGISTRY } from './MenuRegistry'
import type {
  MenuGroupDefinition,
  MenuItemDefinition,
  ResolvedMenuGroup,
  ResolvedMenuItem,
  MenuCondition
} from '@/types/MenuTypes'
import type { NavigationData, MenuItem } from './NavigationService'
import { defaultModuleMap, flagsFromWindows, isMenuSettingOpen } from '@/services/modules/registry'

/**
 * Menu service that reads the menu structure from menu.json (via MenuRegistry).
 * No Appwrite config overlay - edit src/config/menu.json directly.
 */
class MenuConfigService {
  private static instance: MenuConfigService

  static getInstance(): MenuConfigService {
    if (!MenuConfigService.instance) {
      MenuConfigService.instance = new MenuConfigService()
    }
    return MenuConfigService.instance
  }

  clearCache(): void {
    // No cache to clear - menu comes from static JSON
  }

  /**
   * Returns the menu registry directly from menu.json.
   */
  getEffectiveRegistry(): MenuGroupDefinition[] {
    return DEFAULT_MENU_REGISTRY
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
    const moduleFlags = navigationData?.moduleFlags || flagsFromWindows(defaultModuleMap())

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

      if (!isMenuSettingOpen(cond.setting, moduleFlags)) return false

      return true
    }

    const resolveItem = (item: MenuItemDefinition): ResolvedMenuItem[] => {
      if (!checkCondition(item.condition)) return []

      // Dynamic source: expand into multiple items
      if (item.dynamicSource) {
        return resolveDynamicSource(item.dynamicSource, item.dynamicRoutePrefix || '/')
      }

      const label = item.labelKey ? t(item.labelKey) : ''

      // Action item
      if (item.isAction === 'logout') {
        return [{ id: item.id, label, action: actions.logout }]
      }

      // Item with children (nested dropdown)
      if (item.children && item.children.length > 0) {
        const resolvedChildren = item.children.flatMap(child => resolveItem(child))
        if (resolvedChildren.length === 0) return []
        return [{ id: item.id, label, children: resolvedChildren }]
      }

      // Regular link item
      return [{ id: item.id, label, to: item.to, href: item.href }]
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
      const label = group.labelKey ? t(group.labelKey) : ''
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
}

export const menuConfigService = MenuConfigService.getInstance()

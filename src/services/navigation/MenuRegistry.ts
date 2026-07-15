import type { MenuGroupDefinition } from '@/types/MenuTypes'
import menuData from '@/config/menu.json'

/**
 * Menu structure loaded from menu.json.
 * To edit the menu, modify src/config/menu.json directly.
 */
export const DEFAULT_MENU_REGISTRY: MenuGroupDefinition[] = menuData as MenuGroupDefinition[]

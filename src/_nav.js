/**
 * _nav.js - Sidebar Navigation Configuration
 *
 * This file defines the structure and content of the sidebar navigation menu.
 * The navigation is rendered by AppSidebar component using CoreUI nav components.
 *
 * Navigation item types:
 * - CNavItem: Single navigation link
 * - CNavGroup: Expandable group of navigation items
 * - CNavTitle: Section title/divider
 *
 * Each item can have:
 * - component: CoreUI component type ('CNavItem', 'CNavGroup', 'CNavTitle')
 * - name: Display text
 * - to: Vue Router path (for CNavItem)
 * - icon: CoreUI icon name (from @coreui/icons)
 * - badge: Optional badge with color and text
 * - items: Array of child items (for CNavGroup)
 * - href: External link URL
 * - external: Boolean for external links
 *
 * @type {Array<Object>}
 */
export default [
  {
    component: 'CNavItem',
    name: 'Dashboard',
    to: '/dashboard',
    icon: 'cilSpeedometer',
  },

  {
    component: 'CNavItem',
    name: 'Participants',
    to: '/admin/participants',
    icon: 'cilPeople',
  },

  {
    component: 'CNavItem',
    name: 'Question Bank',
    to: '/admin/questions',
    icon: 'cilList',
  },

  {
    component: 'CNavItem',
    name: 'Draw Sections',
    to: '/admin/prizes',
    icon: 'cilLayers',
  },

  {
    component: 'CNavItem',
    name: 'Winners',
    to: '/admin/winners',
    icon: 'cilStar',
  },

  {
    component: 'CNavTitle',
    name: 'Public Pages',
  },

  {
    component: 'CNavItem',
    name: 'Registration',
    to: '/register',
    icon: 'cilUserFollow',
  },

  {
    component: 'CNavItem',
    name: 'Kiosk',
    to: '/kiosk',
    icon: 'cilLaptop',
  },
]

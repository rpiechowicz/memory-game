// Global declaration for unplugin-icons virtual modules
// This allows TypeScript to recognize imports like '~icons/mdi/arrow-right-bold'.
// Adjust the component type as needed.

declare module '~icons/*' {
  import type { FunctionalComponent, SVGAttributes } from 'vue'

  const component: FunctionalComponent<SVGAttributes>
  export default component
}

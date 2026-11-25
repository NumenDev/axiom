import { BookOpen, Compass, Map, Workflow } from 'lucide-react'
import { logicModule } from '../application/modules'
export const pages = {
  welcome: { title: 'Welcome', icon: Compass },
  logic: { title: logicModule.name, icon: Workflow },
  guide: { title: 'Workspace guide', icon: BookOpen },
  roadmap: { title: 'Module roadmap', icon: Map },
}
export type Page = keyof typeof pages
export type OpenPage = (id: Page) => void

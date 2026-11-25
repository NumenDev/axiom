import { Braces, BookOpen, Compass, Map, Workflow } from 'lucide-react'
import { logicModule, expressionModule } from '../application/modules'
export const pages = {
  welcome: { title: 'Welcome', icon: Compass },
  logic: { title: logicModule.name, icon: Workflow },
  expression: { title: expressionModule.name, icon: Braces },
  guide: { title: 'Workspace guide', icon: BookOpen },
  roadmap: { title: 'Module roadmap', icon: Map },
}
export type Page = keyof typeof pages
export type OpenPage = (id: Page) => void

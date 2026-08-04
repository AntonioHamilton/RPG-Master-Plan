import type { MasterPlanAPI } from '../shared/types/api'

declare global {
  interface Window {
    api: MasterPlanAPI
  }
}

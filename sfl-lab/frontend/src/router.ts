import { createRouter, createWebHistory } from 'vue-router'
import Shell from './components/Shell.vue'
import UploadView from './views/UploadView.vue'
import RawView from './views/RawView.vue'
import ProcessView from './views/ProcessView.vue'
import BalanceView from './views/BalanceView.vue'
import FlagsView from './views/FlagsView.vue'
import ResultsView from './views/ResultsView.vue'
import ReportView from './views/ReportView.vue'
import PlotView from './views/PlotView.vue'

export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: Shell,
      children: [
        { path: '', component: UploadView },
        { path: 'raw', component: RawView },
        { path: 'process', component: ProcessView },
        { path: 'balance', component: BalanceView },
        { path: 'flags', component: FlagsView },
        { path: 'results', component: ResultsView },
        { path: 'report', component: ReportView },
        { path: 'plot', component: PlotView },
        { path: ':pathMatch(.*)*', redirect: '/' },
      ],
    },
  ],
})

"""Demo URL routing."""

from django.urls import path
from apps.demo.views import DemoScenariosListView, DemoScenarioDetailView

urlpatterns = [
    path('scenarios/', DemoScenariosListView.as_view(), name='demo_scenarios_list'),
    path('scenarios/<str:scenario_id>/', DemoScenarioDetailView.as_view(), name='demo_scenario_detail'),
]

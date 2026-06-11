import { AppShell, Button, Group, Title } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { IconLeaf, IconList, IconAcorn, IconChartPie, IconPlant, IconFlask, IconBug } from '@tabler/icons-react';
import { NavLink, Route, Routes } from 'react-router-dom';
import { ClaimFormPage } from './pages/ClaimFormPage';
import { CropListPage } from './pages/CropListPage';
import { DashboardPage } from './pages/DashboardPage';
import { FertilizationRecordListPage } from './pages/FertilizationRecordListPage';
import { HarvestRecordListPage } from './pages/HarvestRecordListPage';
import { PestReportListPage } from './pages/PestReportListPage';
import { PlotDetailPage } from './pages/PlotDetailPage';
import { PlotListPage } from './pages/PlotListPage';
import { PlotLogPage } from './pages/PlotLogPage';

export function App() {
  return (
    <>
      <Notifications position="top-right" />
      <AppShell header={{ height: 'auto' }} padding="md">
        <AppShell.Header px="md" py="sm" withBorder>
          <Group justify="space-between" align="center" wrap="wrap" gap="md">
            <Group gap="xs">
              <IconLeaf size={24} color="var(--mantine-color-green-7)" />
              <Title order={4}>社区菜园认领</Title>
            </Group>
            <Group gap="xs" wrap="wrap">
              <Button
                component={NavLink}
                to="/dashboard"
                variant="subtle"
                leftSection={<IconChartPie size={16} />}
                size="sm"
              >
                数据概览
              </Button>
              <Button
                component={NavLink}
                to="/"
                variant="subtle"
                leftSection={<IconList size={16} />}
                size="sm"
              >
                地块列表
              </Button>
              <Button
                component={NavLink}
                to="/harvest-records"
                variant="subtle"
                leftSection={<IconAcorn size={16} />}
                size="sm"
              >
                收获记录
              </Button>
              <Button
                component={NavLink}
                to="/fertilization-records"
                variant="subtle"
                leftSection={<IconFlask size={16} />}
                size="sm"
              >
                施肥记录
              </Button>
              <Button
                component={NavLink}
                to="/pest-reports"
                variant="subtle"
                leftSection={<IconBug size={16} />}
                size="sm"
              >
                病虫害上报
              </Button>
              <Button
                component={NavLink}
                to="/crops"
                variant="subtle"
                leftSection={<IconPlant size={16} />}
                size="sm"
              >
                作物字典
              </Button>
              <Button component={NavLink} to="/register" variant="light" size="sm">
                认领登记
              </Button>
            </Group>
          </Group>
        </AppShell.Header>

        <AppShell.Main>
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/" element={<PlotListPage />} />
            <Route path="/plots/:plot_id" element={<PlotDetailPage />} />
            <Route path="/plots/:plot_id/logs" element={<PlotLogPage />} />
            <Route path="/harvest-records" element={<HarvestRecordListPage />} />
            <Route path="/fertilization-records" element={<FertilizationRecordListPage />} />
            <Route path="/pest-reports" element={<PestReportListPage />} />
            <Route path="/crops" element={<CropListPage />} />
            <Route path="/register" element={<ClaimFormPage />} />
          </Routes>
        </AppShell.Main>
      </AppShell>
    </>
  );
}

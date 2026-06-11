import { AppShell, Button, Group, Title } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { IconLeaf, IconList, IconAcorn, IconChartPie } from '@tabler/icons-react';
import { NavLink, Route, Routes } from 'react-router-dom';
import { ClaimFormPage } from './pages/ClaimFormPage';
import { DashboardPage } from './pages/DashboardPage';
import { HarvestRecordListPage } from './pages/HarvestRecordListPage';
import { PlotListPage } from './pages/PlotListPage';

export function App() {
  return (
    <>
      <Notifications position="top-right" />
      <AppShell header={{ height: 'auto' }} padding="md">
        <AppShell.Header px="md" py="sm">
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
              >
                数据概览
              </Button>
              <Button
                component={NavLink}
                to="/"
                variant="subtle"
                leftSection={<IconList size={16} />}
              >
                地块列表
              </Button>
              <Button
                component={NavLink}
                to="/harvest-records"
                variant="subtle"
                leftSection={<IconAcorn size={16} />}
              >
                收获记录
              </Button>
              <Button component={NavLink} to="/register" variant="light">
                认领登记
              </Button>
            </Group>
          </Group>
        </AppShell.Header>

        <AppShell.Main>
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/" element={<PlotListPage />} />
            <Route path="/harvest-records" element={<HarvestRecordListPage />} />
            <Route path="/register" element={<ClaimFormPage />} />
          </Routes>
        </AppShell.Main>
      </AppShell>
    </>
  );
}

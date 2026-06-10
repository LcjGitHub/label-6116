import { AppShell, Button, Group, Title } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { IconLeaf, IconList } from '@tabler/icons-react';
import { NavLink, Route, Routes } from 'react-router-dom';
import { ClaimFormPage } from './pages/ClaimFormPage';
import { PlotListPage } from './pages/PlotListPage';

export function App() {
  return (
    <>
      <Notifications position="top-right" />
      <AppShell header={{ height: 60 }} padding="md">
        <AppShell.Header px="md">
          <Group h="100%" justify="space-between">
            <Group gap="xs">
              <IconLeaf size={24} color="var(--mantine-color-green-7)" />
              <Title order={4}>社区菜园认领</Title>
            </Group>
            <Group gap="xs">
              <Button
                component={NavLink}
                to="/"
                variant="subtle"
                leftSection={<IconList size={16} />}
              >
                地块列表
              </Button>
              <Button component={NavLink} to="/register" variant="light">
                认领登记
              </Button>
            </Group>
          </Group>
        </AppShell.Header>

        <AppShell.Main>
          <Routes>
            <Route path="/" element={<PlotListPage />} />
            <Route path="/register" element={<ClaimFormPage />} />
          </Routes>
        </AppShell.Main>
      </AppShell>
    </>
  );
}

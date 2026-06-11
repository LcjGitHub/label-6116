import {
  Alert,
  Card,
  Container,
  Grid,
  Group,
  Loader,
  Paper,
  RingProgress,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconLeaf, IconPlant, IconCalendar, IconAlertCircle } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { fetchStatistics } from '../api/client';
import type { Statistics } from '../types';

const CROP_COLORS = [
  'green.6',
  'blue.6',
  'orange.6',
  'pink.6',
  'grape.6',
  'cyan.6',
  'yellow.6',
  'red.6',
];

function getCssColorVar(color: string) {
  return 'var(--mantine-color-' + color.replace('.6', '-6') + ')';
}

export function DashboardPage() {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStatistics = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchStatistics();
        setStatistics(data);
      } catch {
        setError('加载统计数据失败，请确认后端服务已启动');
      } finally {
        setLoading(false);
      }
    };

    loadStatistics();
  }, []);

  const totalPlots = statistics?.total_plots ?? 0;
  const cropTypes = statistics?.crop_types ?? 0;
  const upcomingHarvests = statistics?.upcoming_harvests ?? 0;
  const cropDistribution = statistics?.crop_distribution ?? [];

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <Title order={2}>数据概览</Title>
        </Group>

        {error && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="加载失败"
            color="red"
            variant="filled"
          >
            {error}
          </Alert>
        )}

        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          <Card withBorder padding="lg" radius="md">
            <Group justify="space-between" mb="xs">
              <Text size="sm" c="dimmed">
                总认领地块数
              </Text>
              <IconLeaf size={24} color="var(--mantine-color-green-7)" />
            </Group>
            {loading ? (
              <Group py="md">
                <Loader size="sm" />
              </Group>
            ) : (
              <>
                <Text size="40px" fw={700} c="green.7">
                  {totalPlots}
                </Text>
                <Text size="xs" c="dimmed" mt="xs">
                  块
                </Text>
              </>
            )}
          </Card>

          <Card withBorder padding="lg" radius="md">
            <Group justify="space-between" mb="xs">
              <Text size="sm" c="dimmed">
                作物种类
              </Text>
              <IconPlant size={24} color="var(--mantine-color-blue-7)" />
            </Group>
            {loading ? (
              <Group py="md">
                <Loader size="sm" />
              </Group>
            ) : (
              <>
                <Text size="40px" fw={700} c="blue.7">
                  {cropTypes}
                </Text>
                <Text size="xs" c="dimmed" mt="xs">
                  种
                </Text>
              </>
            )}
          </Card>

          <Card withBorder padding="lg" radius="md">
            <Group justify="space-between" mb="xs">
              <Text size="sm" c="dimmed">
                未来14天待收获
              </Text>
              <IconCalendar size={24} color="var(--mantine-color-orange-7)" />
            </Group>
            {loading ? (
              <Group py="md">
                <Loader size="sm" />
              </Group>
            ) : (
              <>
                <Text size="40px" fw={700} c="orange.7">
                  {upcomingHarvests}
                </Text>
                <Text size="xs" c="dimmed" mt="xs">
                  块
                </Text>
              </>
            )}
          </Card>
        </SimpleGrid>

        <Paper withBorder p="md" radius="md">
          <Title order={4} mb="md">
            作物分布
          </Title>
          {loading ? (
            <Group justify="center" p="xl">
              <Loader size="sm" />
            </Group>
          ) : cropDistribution.length > 0 ? (
            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Group justify="center" py="md" style={{ position: 'relative' }}>
                  <RingProgress
                    size={240}
                    thickness={18}
                    sections={cropDistribution.map((item, index) => ({
                      value: totalPlots > 0 ? (item.count / totalPlots) * 100 : 0,
                      color: CROP_COLORS[index % CROP_COLORS.length],
                      tooltip: `${item.crop_name}: ${item.count}块`,
                    }))}
                    label={
                      <Stack align="center" gap={0}>
                        <Text size="48px" fw={700} c="green.7">
                          {totalPlots}
                        </Text>
                        <Text size="sm" c="dimmed">
                          总地块数
                        </Text>
                      </Stack>
                    }
                  />
                </Group>
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Stack gap="sm" py="md">
                  {cropDistribution.map((item, index) => {
                    const percentage = totalPlots > 0 ? (item.count / totalPlots) * 100 : 0;
                    const color = CROP_COLORS[index % CROP_COLORS.length];
                    return (
                      <Group key={item.crop_name} justify="space-between">
                        <Group gap="xs">
                          <div
                            style={{
                              width: 12,
                              height: 12,
                              borderRadius: 2,
                              backgroundColor: getCssColorVar(color),
                            }}
                          />
                          <Text size="sm">{item.crop_name}</Text>
                        </Group>
                        <Group gap="xs">
                          <Text size="sm" fw={600}>
                            {item.count} 块
                          </Text>
                          <Text size="xs" c="dimmed">
                            ({percentage.toFixed(1)}%)
                          </Text>
                        </Group>
                      </Group>
                    );
                  })}
                </Stack>
              </Grid.Col>
            </Grid>
          ) : (
            <Text ta="center" c="dimmed" p="xl">
              暂无作物分布数据
            </Text>
          )}
        </Paper>
      </Stack>
    </Container>
  );
}

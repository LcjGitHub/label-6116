import {
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
import { IconLeaf, IconPlant, IconCalendar } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { fetchStatistics } from '../api/client';
import type { Statistics } from '../types';

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

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <Title order={2}>数据概览</Title>

        {error && (
          <Text c="red" size="sm">
            {error}
          </Text>
        )}

        {loading ? (
          <Group justify="center" p="xl">
            <Loader size="sm" />
          </Group>
        ) : statistics ? (
          <Stack gap="lg">
            <SimpleGrid cols={{ base: 1, sm: 3 }}>
              <Card withBorder padding="lg" radius="md">
                <Group justify="space-between" mb="xs">
                  <Text size="sm" c="dimmed">
                    总认领地块数
                  </Text>
                  <IconLeaf size={24} color="var(--mantine-color-green-7)" />
                </Group>
                <Text size="40px" fw={700} c="green.7">
                  {statistics.total_plots}
                </Text>
                <Text size="xs" c="dimmed" mt="xs">
                  块
                </Text>
              </Card>

              <Card withBorder padding="lg" radius="md">
                <Group justify="space-between" mb="xs">
                  <Text size="sm" c="dimmed">
                    作物种类
                  </Text>
                  <IconPlant size={24} color="var(--mantine-color-blue-7)" />
                </Group>
                <Text size="40px" fw={700} c="blue.7">
                  {statistics.crop_types}
                </Text>
                <Text size="xs" c="dimmed" mt="xs">
                  种
                </Text>
              </Card>

              <Card withBorder padding="lg" radius="md">
                <Group justify="space-between" mb="xs">
                  <Text size="sm" c="dimmed">
                    未来14天待收获
                  </Text>
                  <IconCalendar size={24} color="var(--mantine-color-orange-7)" />
                </Group>
                <Text size="40px" fw={700} c="orange.7">
                  {statistics.upcoming_harvests}
                </Text>
                <Text size="xs" c="dimmed" mt="xs">
                  块
                </Text>
              </Card>
            </SimpleGrid>

            <Paper withBorder p="md" radius="md">
              <Title order={4} mb="md">
                作物分布
              </Title>
              <Grid>
                {statistics.crop_distribution.length > 0 ? (
                  <>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <Group justify="center" py="md">
                        <RingProgress
                          size={240}
                          thickness={18}
                          sections={statistics.crop_distribution.map((item, index) => ({
                            value:
                              (item.count / statistics.total_plots) * 100,
                            color: [
                              'green.6',
                              'blue.6',
                              'orange.6',
                              'pink.6',
                              'grape.6',
                              'cyan.6',
                              'yellow.6',
                              'red.6',
                            ][index % 8],
                            tooltip: `${item.crop_name}: ${item.count}块`,
                          }))}
                        />
                      </Group>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <Stack gap="sm" py="md">
                        {statistics.crop_distribution.map((item, index) => {
                          const percentage =
                            (item.count / statistics.total_plots) * 100;
                          const color = [
                            'green.6',
                            'blue.6',
                            'orange.6',
                            'pink.6',
                            'grape.6',
                            'cyan.6',
                            'yellow.6',
                            'red.6',
                          ][index % 8];
                          return (
                            <Group key={item.crop_name} justify="space-between">
                              <Group gap="xs">
                                <div
                                  style={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: 2,
                                    backgroundColor:
                                      'var(--mantine-color-' +
                                      color.replace('.6', '-6') +
                                      ')',
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
                  </>
                ) : (
                  <Grid.Col span={12}>
                    <Text ta="center" c="dimmed" p="xl">
                      暂无作物分布数据
                    </Text>
                  </Grid.Col>
                )}
              </Grid>
            </Paper>
          </Stack>
        ) : null}
      </Stack>
    </Container>
  );
}

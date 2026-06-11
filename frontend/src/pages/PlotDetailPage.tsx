import { Badge, Button, Card, Container, Group, Loader, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { IconArrowLeft, IconFileText, IconAcorn } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { fetchPlot } from '../api/client';
import { useHarvestFilterStore } from '../store/harvestFilterStore';
import type { Plot, PlotStatus } from '../types';

function getStatusColor(status: PlotStatus): string {
  switch (status) {
    case '种植中':
      return 'green';
    case '已收获':
      return 'blue';
    case '空闲':
      return 'gray';
    default:
      return 'gray';
  }
}

export function PlotDetailPage() {
  const { plot_id } = useParams<{ plot_id: string }>();
  const plotId = plot_id ? Number(plot_id) : null;
  const navigate = useNavigate();
  const { reset: resetHarvestFilter, setPlotId: setHarvestPlotId } = useHarvestFilterStore();

  const [plot, setPlot] = useState<Plot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlot = useCallback(async () => {
    if (!plotId) {
      setError('地块编号无效');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPlot(plotId);
      setPlot(data);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err && err.response &&
        typeof err.response === 'object' && 'data' in err.response && err.response.data &&
        typeof err.response.data === 'object' && 'error' in err.response.data
          ? String(err.response.data.error)
          : '加载地块详情失败，请确认后端服务已启动';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [plotId]);

  useEffect(() => {
    loadPlot();
  }, [loadPlot]);

  const handleGoToHarvestRecords = () => {
    if (!plotId) return;
    resetHarvestFilter();
    setHarvestPlotId(plotId);
    navigate('/harvest-records');
  };

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="center" wrap="wrap" gap="md">
          <Group gap="xs">
            <Button
              component={Link}
              to="/"
              variant="subtle"
              leftSection={<IconArrowLeft size={16} />}
              size="sm"
            >
              返回地块列表
            </Button>
          </Group>
        </Group>

        {loading && (
          <Group justify="center" p="xl">
            <Loader size="sm" />
          </Group>
        )}

        {error && (
          <Text c="red" size="sm">
            {error}
          </Text>
        )}

        {!loading && !error && plot && (
          <>
            <Title order={2}>
              地块详情 - {plot.plot_number}
            </Title>

            <Paper withBorder p="lg" radius="md">
              <Title order={4} mb="md">
                认领信息
              </Title>
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={0}>
                <Group style={{ padding: '12px 16px', borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
                  <Text size="sm" c="dimmed" style={{ minWidth: 80 }}>地块编号</Text>
                  <Text size="sm" fw={500}>{plot.plot_number}</Text>
                </Group>
                <Group style={{ padding: '12px 16px', borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
                  <Text size="sm" c="dimmed" style={{ minWidth: 80 }}>状态</Text>
                  <Badge color={getStatusColor(plot.status)} size="md">
                    {plot.status}
                  </Badge>
                </Group>
                <Group style={{ padding: '12px 16px', borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
                  <Text size="sm" c="dimmed" style={{ minWidth: 80 }}>认领人</Text>
                  <Text size="sm" fw={500}>{plot.claimer}</Text>
                </Group>
                <Group style={{ padding: '12px 16px', borderBottom: '1px solid var(--mantine-color-gray-2)' }}>
                  <Text size="sm" c="dimmed" style={{ minWidth: 80 }}>作物</Text>
                  <Text size="sm" fw={500}>{plot.crop}</Text>
                </Group>
                <Group style={{ padding: '12px 16px' }}>
                  <Text size="sm" c="dimmed" style={{ minWidth: 80 }}>认领日期</Text>
                  <Text size="sm" fw={500}>{dayjs(plot.claim_date).format('YYYY-MM-DD')}</Text>
                </Group>
                <Group style={{ padding: '12px 16px' }}>
                  <Text size="sm" c="dimmed" style={{ minWidth: 80 }}>预计收获日</Text>
                  <Text size="sm" fw={500}>{dayjs(plot.expected_harvest_date).format('YYYY-MM-DD')}</Text>
                </Group>
              </SimpleGrid>
            </Paper>

            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <Card withBorder radius="md" padding="lg">
                <Group gap="xs" mb="md">
                  <IconAcorn size={20} color="var(--mantine-color-orange-7)" />
                  <Title order={5}>收获记录统计</Title>
                </Group>
                <Stack gap="sm">
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">记录条数</Text>
                    <Text size="sm" fw={600}>
                      {plot.harvest_record_count ?? 0} 条
                    </Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">最近收获日期</Text>
                    <Text size="sm" fw={600}>
                      {plot.latest_harvest_date
                        ? dayjs(plot.latest_harvest_date).format('YYYY-MM-DD')
                        : '暂无'}
                    </Text>
                  </Group>
                </Stack>
              </Card>

              <Card withBorder radius="md" padding="lg">
                <Group gap="xs" mb="md">
                  <IconFileText size={20} color="var(--mantine-color-blue-7)" />
                  <Title order={5}>种植日志统计</Title>
                </Group>
                <Stack gap="sm">
                  <Group justify="space-between">
                    <Text size="sm" c="dimmed">日志条数</Text>
                    <Text size="sm" fw={600}>
                      {plot.planting_log_count ?? 0} 条
                    </Text>
                  </Group>
                  <Group justify="space-between" align="flex-start">
                    <Text size="sm" c="dimmed">最近日志摘要</Text>
                    <Text size="sm" fw={600} style={{ maxWidth: 200, textAlign: 'right' }}>
                      {plot.latest_log_summary ?? '暂无'}
                    </Text>
                  </Group>
                </Stack>
              </Card>
            </SimpleGrid>

            <Group justify="center" gap="md" mt="md">
              <Button
                component={Link}
                to={`/plots/${plot.id}/logs`}
                size="md"
                leftSection={<IconFileText size={16} />}
              >
                查看种植日志
              </Button>
              <Button
                size="md"
                leftSection={<IconAcorn size={16} />}
                onClick={handleGoToHarvestRecords}
              >
                查看收获记录
              </Button>
            </Group>
          </>
        )}
      </Stack>
    </Container>
  );
}

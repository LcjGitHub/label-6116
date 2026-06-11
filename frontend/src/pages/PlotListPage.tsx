import {
  ActionIcon,
  Badge,
  Button,
  Container,
  Group,
  Loader,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconPlus, IconRefresh, IconTrash } from '@tabler/icons-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { deletePlot, fetchPlots } from '../api/client';
import { useFilterStore } from '../store/filterStore';
import { PLOT_STATUSES } from '../types';
import type { Plot, PlotStatus } from '../types';

function formatDate(value: string) {
  return value;
}

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

export function PlotListPage() {
  const { claimer, crop, status, setClaimer, setCrop, setStatus, reset } = useFilterStore();
  const [plots, setPlots] = useState<Plot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [debouncedClaimer] = useDebouncedValue(claimer, 300);
  const [debouncedCrop] = useDebouncedValue(crop, 300);

  const loadPlots = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPlots({
        claimer: debouncedClaimer || undefined,
        crop: debouncedCrop || undefined,
        status: status || undefined,
      });
      setPlots(data);
    } catch {
      setError('加载地块列表失败，请确认后端服务已启动');
    } finally {
      setLoading(false);
    }
  }, [debouncedClaimer, debouncedCrop, status]);

  useEffect(() => {
    loadPlots();
  }, [loadPlots]);

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await deletePlot(id);
      await loadPlots();
    } catch {
      setError('删除失败，请稍后重试');
    } finally {
      setDeletingId(null);
    }
  };

  const statusOptions = [
    { value: '', label: '全部' },
    ...PLOT_STATUSES.map((s) => ({ value: s, label: s })),
  ];

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <Title order={2}>地块列表</Title>
          <Button component={Link} to="/register" leftSection={<IconPlus size={16} />}>
            认领登记
          </Button>
        </Group>

        <Paper withBorder p="md" radius="md">
          <Group align="flex-end">
            <TextInput
              label="认领人"
              placeholder="筛选认领人"
              value={claimer}
              onChange={(event) => setClaimer(event.currentTarget.value)}
              style={{ flex: 1 }}
            />
            <TextInput
              label="作物"
              placeholder="筛选作物"
              value={crop}
              onChange={(event) => setCrop(event.currentTarget.value)}
              style={{ flex: 1 }}
            />
            <Select
              label="状态"
              placeholder="筛选状态"
              value={status}
              onChange={(value) => setStatus((value as PlotStatus | '') || '')}
              data={statusOptions}
              style={{ flex: 1 }}
            />
            <Button variant="light" leftSection={<IconRefresh size={16} />} onClick={reset}>
              重置
            </Button>
          </Group>
        </Paper>

        {error && (
          <Text c="red" size="sm">
            {error}
          </Text>
        )}

        <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
          {loading ? (
            <Group justify="center" p="xl">
              <Loader size="sm" />
            </Group>
          ) : plots.length === 0 ? (
            <Text ta="center" c="dimmed" p="xl">
              暂无地块数据
            </Text>
          ) : (
            <Table striped highlightOnHover withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>地块编号</Table.Th>
                  <Table.Th>认领人</Table.Th>
                  <Table.Th>作物</Table.Th>
                  <Table.Th>状态</Table.Th>
                  <Table.Th>认领日期</Table.Th>
                  <Table.Th>预计收获日</Table.Th>
                  <Table.Th w={80}>操作</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {plots.map((plot) => (
                  <Table.Tr key={plot.id}>
                    <Table.Td>{plot.plot_number}</Table.Td>
                    <Table.Td>{plot.claimer}</Table.Td>
                    <Table.Td>{plot.crop}</Table.Td>
                    <Table.Td>
                      <Badge color={getStatusColor(plot.status)} size="md">
                        {plot.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>{formatDate(plot.claim_date)}</Table.Td>
                    <Table.Td>{formatDate(plot.expected_harvest_date)}</Table.Td>
                    <Table.Td>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        aria-label="删除"
                        loading={deletingId === plot.id}
                        onClick={() => handleDelete(plot.id)}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Paper>
      </Stack>
    </Container>
  );
}

import {
  ActionIcon,
  Button,
  Container,
  Group,
  Loader,
  NumberInput,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  Textarea,
  Title,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconRefresh, IconTrash } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useCallback, useEffect, useState } from 'react';
import { createHarvestRecord, deleteHarvestRecord, fetchHarvestRecords, fetchPlots } from '../api/client';
import type { HarvestRecord as HarvestRecordType, HarvestRecordFormValues, Plot } from '../types';

function formatDate(value: string) {
  return value;
}

export function HarvestRecordListPage() {
  const [records, setRecords] = useState<HarvestRecordType[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [filterPlotId, setFilterPlotId] = useState<number | null>(null);

  const form = useForm<HarvestRecordFormValues>({
    initialValues: {
      plot_id: null,
      actual_harvest_date: null,
      harvest_weight: null,
      remark: '',
    },
    validate: {
      plot_id: (value) => (value ? null : '请选择地块'),
      actual_harvest_date: (value) => (value ? null : '请选择实际收获日期'),
      harvest_weight: (value) => {
        if (value === null || value === undefined) {
          return '请输入收获重量';
        }
        if (value <= 0) {
          return '收获重量必须大于0';
        }
        return null;
      },
    },
  });

  const loadPlots = useCallback(async () => {
    try {
      const data = await fetchPlots();
      setPlots(data);
    } catch {
      setError('加载地块列表失败，请确认后端服务已启动');
    }
  }, []);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = filterPlotId ? { plot_id: filterPlotId } : undefined;
      const data = await fetchHarvestRecords(params);
      setRecords(data);
    } catch {
      setError('加载收获记录失败，请确认后端服务已启动');
    } finally {
      setLoading(false);
    }
  }, [filterPlotId]);

  useEffect(() => {
    loadPlots();
  }, [loadPlots]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await deleteHarvestRecord(id);
      notifications.show({
        title: '删除成功',
        message: '收获记录已删除',
        color: 'green',
      });
      await loadRecords();
    } catch {
      notifications.show({
        title: '删除失败',
        message: '删除失败，请稍后重试',
        color: 'red',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (values: HarvestRecordFormValues) => {
    setSubmitting(true);
    try {
      await createHarvestRecord({
        plot_id: values.plot_id!,
        actual_harvest_date: dayjs(values.actual_harvest_date).format('YYYY-MM-DD'),
        harvest_weight: values.harvest_weight!,
        remark: values.remark.trim() || undefined,
      });
      notifications.show({
        title: '登记成功',
        message: '收获记录已保存',
        color: 'green',
      });
      form.reset();
      await loadRecords();
    } catch (err: unknown) {
      const message =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        'data' in err.response &&
        err.response.data &&
        typeof err.response.data === 'object' &&
        'error' in err.response.data
          ? String(err.response.data.error)
          : '提交失败，请稍后重试';
      notifications.show({
        title: '登记失败',
        message,
        color: 'red',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const plotOptions = plots.map((plot) => ({
    value: String(plot.id),
    label: `${plot.plot_number} - ${plot.crop} (${plot.claimer})`,
  }));

  const handleResetFilter = () => {
    setFilterPlotId(null);
  };

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <Title order={2}>收获记录</Title>
        </Group>

        <Paper withBorder p="md" radius="md">
          <Group align="flex-end">
            <Select
              label="地块筛选"
              placeholder="选择地块筛选"
              data={plotOptions}
              value={filterPlotId ? String(filterPlotId) : null}
              onChange={(value) => setFilterPlotId(value ? Number(value) : null)}
              style={{ flex: 1 }}
              clearable
              searchable
            />
            <Button variant="light" leftSection={<IconRefresh size={16} />} onClick={handleResetFilter}>
              重置
            </Button>
          </Group>
        </Paper>

        <Paper withBorder p="lg" radius="md">
          <Title order={4} mb="md">
            新增收获登记
          </Title>
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
              <Group grow>
                <Select
                  label="地块"
                  placeholder="选择地块"
                  data={plotOptions}
                  withAsterisk
                  searchable
                  {...form.getInputProps('plot_id', {
                    type: 'input',
                  })}
                  value={form.values.plot_id ? String(form.values.plot_id) : null}
                  onChange={(value) => form.setFieldValue('plot_id', value ? Number(value) : null)}
                />
                <DateInput
                  label="实际收获日期"
                  placeholder="选择收获日期"
                  valueFormat="YYYY-MM-DD"
                  withAsterisk
                  {...form.getInputProps('actual_harvest_date')}
                />
              </Group>
              <Group grow>
                <NumberInput
                  label="收获重量(公斤)"
                  placeholder="请输入收获重量"
                  min={0}
                  step={0.1}
                  withAsterisk
                  {...form.getInputProps('harvest_weight')}
                />
              </Group>
              <Textarea
                label="备注"
                placeholder="选填，可输入收获备注信息"
                autosize
                minRows={2}
                {...form.getInputProps('remark')}
              />
              <Group justify="flex-end" mt="sm">
                <Button type="submit" loading={submitting}>
                  提交登记
                </Button>
              </Group>
            </Stack>
          </form>
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
          ) : records.length === 0 ? (
            <Text ta="center" c="dimmed" p="xl">
              暂无收获记录数据
            </Text>
          ) : (
            <Table striped highlightOnHover withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>编号</Table.Th>
                  <Table.Th>地块编号</Table.Th>
                  <Table.Th>实际收获日期</Table.Th>
                  <Table.Th>收获重量(公斤)</Table.Th>
                  <Table.Th>备注</Table.Th>
                  <Table.Th w={80}>操作</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {records.map((record) => (
                  <Table.Tr key={record.id}>
                    <Table.Td>{record.id}</Table.Td>
                    <Table.Td>{record.plot_number}</Table.Td>
                    <Table.Td>{formatDate(record.actual_harvest_date)}</Table.Td>
                    <Table.Td>{record.harvest_weight.toFixed(1)}</Table.Td>
                    <Table.Td>{record.remark || '-'}</Table.Td>
                    <Table.Td>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        aria-label="删除"
                        loading={deletingId === record.id}
                        onClick={() => handleDelete(record.id)}
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

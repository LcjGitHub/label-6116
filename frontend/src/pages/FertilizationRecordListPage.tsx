import {
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
  TextInput,
  Title,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconRefresh } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useCallback, useEffect, useState } from 'react';
import { createFertilizationRecord, fetchFertilizationRecords, fetchPlots } from '../api/client';
import type { FertilizationRecord as FertilizationRecordType, FertilizationRecordFormValues, Plot } from '../types';

function formatDate(value: string) {
  return value;
}

export function FertilizationRecordListPage() {
  const [records, setRecords] = useState<FertilizationRecordType[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterPlotId, setFilterPlotId] = useState<number | null>(null);

  const form = useForm<FertilizationRecordFormValues>({
    initialValues: {
      plot_id: null,
      fertilization_date: null,
      fertilizer_name: '',
      amount_kg: null,
      operator: '',
    },
    validate: {
      plot_id: (value) => (value ? null : '请选择地块'),
      fertilization_date: (value) => (value ? null : '请选择施肥日期'),
      fertilizer_name: (value) => (value.trim() ? null : '请输入肥料名称'),
      amount_kg: (value) => {
        if (value === null || value === undefined) {
          return '请输入用量';
        }
        if (value <= 0) {
          return '用量必须大于0';
        }
        return null;
      },
      operator: (value) => (value.trim() ? null : '请输入操作人'),
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
      const data = await fetchFertilizationRecords({
        plot_id: filterPlotId ?? undefined,
      });
      setRecords(data);
    } catch {
      setError('加载施肥记录失败，请确认后端服务已启动');
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

  const handleReset = () => {
    setFilterPlotId(null);
  };

  const handleSubmit = async (values: FertilizationRecordFormValues) => {
    setSubmitting(true);
    try {
      await createFertilizationRecord({
        plot_id: values.plot_id!,
        fertilization_date: dayjs(values.fertilization_date).format('YYYY-MM-DD'),
        fertilizer_name: values.fertilizer_name.trim(),
        amount_kg: values.amount_kg!,
        operator: values.operator.trim(),
      });
      notifications.show({
        title: '登记成功',
        message: '施肥记录已保存',
        color: 'green',
      });
      form.setValues({
        plot_id: null,
        fertilization_date: null,
        fertilizer_name: '',
        amount_kg: null,
        operator: '',
      });
      form.clearErrors();
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

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <Title order={2}>施肥记录</Title>
        </Group>

        <Paper withBorder p="md" radius="md">
          <Group align="flex-end" grow>
            <Select
              label="地块"
              placeholder="选择地块筛选"
              data={plotOptions}
              value={filterPlotId ? String(filterPlotId) : null}
              onChange={(value) => setFilterPlotId(value ? Number(value) : null)}
              clearable
              searchable
            />
            <Button variant="light" leftSection={<IconRefresh size={16} />} onClick={handleReset}>
              重置
            </Button>
          </Group>
        </Paper>

        <Paper withBorder p="lg" radius="md">
          <Title order={4} mb="md">
            新增施肥登记
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
                  label="施肥日期"
                  placeholder="选择施肥日期"
                  valueFormat="YYYY-MM-DD"
                  withAsterisk
                  {...form.getInputProps('fertilization_date')}
                />
              </Group>
              <Group grow>
                <TextInput
                  label="肥料名称"
                  placeholder="请输入肥料名称"
                  withAsterisk
                  {...form.getInputProps('fertilizer_name')}
                />
                <NumberInput
                  label="用量(公斤)"
                  placeholder="请输入用量"
                  min={0.1}
                  step={0.1}
                  withAsterisk
                  {...form.getInputProps('amount_kg')}
                />
                <TextInput
                  label="操作人"
                  placeholder="请输入操作人"
                  withAsterisk
                  {...form.getInputProps('operator')}
                />
              </Group>
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
              暂无施肥记录数据
            </Text>
          ) : (
            <Table striped highlightOnHover withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>编号</Table.Th>
                  <Table.Th>地块编号</Table.Th>
                  <Table.Th>施肥日期</Table.Th>
                  <Table.Th>肥料名称</Table.Th>
                  <Table.Th>用量(公斤)</Table.Th>
                  <Table.Th>操作人</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {records.map((record) => (
                  <Table.Tr key={record.id}>
                    <Table.Td>{record.id}</Table.Td>
                    <Table.Td>{record.plot_number}</Table.Td>
                    <Table.Td>{formatDate(record.fertilization_date)}</Table.Td>
                    <Table.Td>{record.fertilizer_name}</Table.Td>
                    <Table.Td>{record.amount_kg.toFixed(1)}</Table.Td>
                    <Table.Td>{record.operator}</Table.Td>
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

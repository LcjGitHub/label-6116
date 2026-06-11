import {
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
  Textarea,
  Title,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconBug, IconRefresh } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useCallback, useEffect, useState } from 'react';
import { createPestReport, fetchPestReports, fetchPlots, updatePestReportStatus } from '../api/client';
import { PEST_TYPES, SEVERITY_LEVELS, TREATMENT_STATUSES } from '../types';
import type { PestReport as PestReportType, PestReportFormValues, Plot, SeverityLevel, TreatmentStatus } from '../types';

function formatDate(value: string) {
  return value;
}

function getSeverityColor(severity: SeverityLevel) {
  switch (severity) {
    case '轻微':
      return 'green';
    case '中等':
      return 'yellow';
    case '严重':
      return 'red';
    default:
      return 'gray';
  }
}

function getStatusColor(status: TreatmentStatus) {
  switch (status) {
    case '待处理':
      return 'orange';
    case '处理中':
      return 'blue';
    case '已处理':
      return 'green';
    default:
      return 'gray';
  }
}

export function PestReportListPage() {
  const [reports, setReports] = useState<PestReportType[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterPlotId, setFilterPlotId] = useState<number | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<SeverityLevel | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const form = useForm<PestReportFormValues>({
    initialValues: {
      plot_id: null,
      discovery_date: null,
      pest_type: null,
      severity: null,
      symptom_description: '',
    },
    validate: {
      plot_id: (value) => (value ? null : '请选择地块'),
      discovery_date: (value) => (value ? null : '请选择发现日期'),
      pest_type: (value) => (value ? null : '请选择病虫害类型'),
      severity: (value) => (value ? null : '请选择严重程度'),
      symptom_description: (value) => (value.trim() ? null : '请输入症状描述'),
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

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPestReports({
        plot_id: filterPlotId ?? undefined,
        severity: filterSeverity ?? undefined,
      });
      setReports(data);
    } catch {
      setError('加载病虫害上报失败，请确认后端服务已启动');
    } finally {
      setLoading(false);
    }
  }, [filterPlotId, filterSeverity]);

  useEffect(() => {
    loadPlots();
  }, [loadPlots]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleReset = () => {
    setFilterPlotId(null);
    setFilterSeverity(null);
  };

  const handleSubmit = async (values: PestReportFormValues) => {
    setSubmitting(true);
    try {
      await createPestReport({
        plot_id: values.plot_id!,
        discovery_date: dayjs(values.discovery_date).format('YYYY-MM-DD'),
        pest_type: values.pest_type!,
        severity: values.severity!,
        symptom_description: values.symptom_description.trim(),
      });
      notifications.show({
        title: '登记成功',
        message: '病虫害上报已保存',
        color: 'green',
      });
      form.setValues({
        plot_id: null,
        discovery_date: null,
        pest_type: null,
        severity: null,
        symptom_description: '',
      });
      form.clearErrors();
      await loadReports();
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

  const handleStatusChange = async (id: number, newStatus: TreatmentStatus) => {
    setUpdatingId(id);
    try {
      await updatePestReportStatus(id, newStatus);
      notifications.show({
        title: '更新成功',
        message: '处理状态已更新',
        color: 'green',
      });
      await loadReports();
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
          : '更新失败，请稍后重试';
      notifications.show({
        title: '更新失败',
        message,
        color: 'red',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const plotOptions = plots.map((plot) => ({
    value: String(plot.id),
    label: `${plot.plot_number} - ${plot.crop} (${plot.claimer})`,
  }));

  const pestTypeOptions = PEST_TYPES.map((type) => ({
    value: type,
    label: type,
  }));

  const severityOptions = SEVERITY_LEVELS.map((level) => ({
    value: level,
    label: level,
  }));

  const treatmentStatusOptions = TREATMENT_STATUSES.map((status) => ({
    value: status,
    label: status,
  }));

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <IconBug size={28} color="var(--mantine-color-red-7)" />
            <Title order={2}>病虫害上报</Title>
          </Group>
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
            <Select
              label="严重程度"
              placeholder="选择严重程度筛选"
              data={severityOptions}
              value={filterSeverity}
              onChange={(value) => setFilterSeverity((value as SeverityLevel) || null)}
              clearable
            />
            <Button variant="light" leftSection={<IconRefresh size={16} />} onClick={handleReset}>
              重置
            </Button>
          </Group>
        </Paper>

        <Paper withBorder p="lg" radius="md">
          <Title order={4} mb="md">
            新增病虫害上报
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
                  label="发现日期"
                  placeholder="选择发现日期"
                  valueFormat="YYYY-MM-DD"
                  withAsterisk
                  {...form.getInputProps('discovery_date')}
                />
              </Group>
              <Group grow>
                <Select
                  label="病虫害类型"
                  placeholder="选择类型"
                  data={pestTypeOptions}
                  withAsterisk
                  {...form.getInputProps('pest_type', {
                    type: 'input',
                  })}
                  value={form.values.pest_type}
                  onChange={(value) => form.setFieldValue('pest_type', value as any)}
                />
                <Select
                  label="严重程度"
                  placeholder="选择严重程度"
                  data={severityOptions}
                  withAsterisk
                  {...form.getInputProps('severity', {
                    type: 'input',
                  })}
                  value={form.values.severity}
                  onChange={(value) => form.setFieldValue('severity', value as any)}
                />
              </Group>
              <Textarea
                label="症状描述"
                placeholder="请详细描述病虫害症状"
                withAsterisk
                autosize
                minRows={3}
                {...form.getInputProps('symptom_description')}
              />
              <Group justify="flex-end" mt="sm">
                <Button type="submit" loading={submitting}>
                  提交上报
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
          ) : reports.length === 0 ? (
            <Text ta="center" c="dimmed" p="xl">
              暂无病虫害上报数据
            </Text>
          ) : (
            <Table striped highlightOnHover withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>编号</Table.Th>
                  <Table.Th>地块编号</Table.Th>
                  <Table.Th>发现日期</Table.Th>
                  <Table.Th>病虫害类型</Table.Th>
                  <Table.Th>严重程度</Table.Th>
                  <Table.Th>症状描述</Table.Th>
                  <Table.Th w={140}>处理状态</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {reports.map((report) => (
                  <Table.Tr key={report.id}>
                    <Table.Td>{report.id}</Table.Td>
                    <Table.Td>{report.plot_number}</Table.Td>
                    <Table.Td>{formatDate(report.discovery_date)}</Table.Td>
                    <Table.Td>{report.pest_type}</Table.Td>
                    <Table.Td>
                      <Badge color={getSeverityColor(report.severity)} variant="light">
                        {report.severity}
                      </Badge>
                    </Table.Td>
                    <Table.Td style={{ maxWidth: 300 }}>
                      <Text size="sm" lineClamp={2} title={report.symptom_description}>
                        {report.symptom_description}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Select
                        data={treatmentStatusOptions}
                        value={report.treatment_status}
                        onChange={(value) => value && handleStatusChange(report.id, value as TreatmentStatus)}
                        comboboxProps={{ withinPortal: true }}
                        variant="filled"
                        size="sm"
                        styles={{
                          input: {
                            backgroundColor: `var(--mantine-color-${getStatusColor(report.treatment_status)}-light)`,
                            color: `var(--mantine-color-${getStatusColor(report.treatment_status)}-9)`,
                            fontWeight: 500,
                          },
                        }}
                        disabled={updatingId === report.id}
                      />
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

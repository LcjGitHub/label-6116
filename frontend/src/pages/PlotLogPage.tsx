import {
  Button,
  Container,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  Textarea,
  TextInput,
  Timeline,
  Title,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconArrowLeft, IconLeaf } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { createPlantingLog, fetchPlantingLogs, fetchPlots } from '../api/client';
import type { PlantingLog as PlantingLogType, PlantingLogFormValues, Plot } from '../types';

export function PlotLogPage() {
  const { plot_id } = useParams<{ plot_id: string }>();
  const plotId = plot_id ? Number(plot_id) : null;

  const [plot, setPlot] = useState<Plot | null>(null);
  const [plotLoaded, setPlotLoaded] = useState(false);
  const [logs, setLogs] = useState<PlantingLogType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<PlantingLogFormValues>({
    initialValues: {
      log_date: new Date(),
      content: '',
      recorder: '',
    },
    validate: {
      log_date: (value) => (value ? null : '请选择记录日期'),
      content: (value) => (value.trim() ? null : '请输入日志内容'),
      recorder: (value) => (value.trim() ? null : '请输入记录人'),
    },
  });

  const plotExists = plotLoaded && plot !== null;
  const plotNotFound = plotLoaded && plot === null;
  const formDisabled = plotNotFound || submitting;

  const loadPlot = useCallback(async () => {
    if (!plotId) {
      setPlotLoaded(true);
      return;
    }
    try {
      const data = await fetchPlots();
      const found = data.find((p) => p.id === plotId);
      setPlot(found || null);
    } catch {
      setError('加载地块信息失败，请确认后端服务已启动');
    } finally {
      setPlotLoaded(true);
    }
  }, [plotId]);

  const loadLogs = useCallback(async () => {
    if (!plotId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPlantingLogs({ plot_id: plotId });
      setLogs(data);
    } catch {
      setError('加载种植日志失败，请确认后端服务已启动');
    } finally {
      setLoading(false);
    }
  }, [plotId]);

  useEffect(() => {
    loadPlot();
    loadLogs();
  }, [loadPlot, loadLogs]);

  const handleSubmit = async (values: PlantingLogFormValues) => {
    if (!plotId || plotNotFound) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await createPlantingLog({
        plot_id: plotId,
        log_date: dayjs(values.log_date).format('YYYY-MM-DD'),
        content: values.content.trim(),
        recorder: values.recorder.trim(),
      });
      notifications.show({
        title: '记录成功',
        message: '种植日志已保存',
        color: 'green',
      });
      form.setValues({
        log_date: new Date(),
        content: '',
        recorder: '',
      });
      form.clearErrors();
      setSubmitError(null);
      await loadLogs();
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
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
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

        <Title order={2}>
          {plotExists ? `${plot.plot_number} - ${plot.crop} (${plot.claimer})` : '种植日志'}
        </Title>

        {plotNotFound && (
          <Text c="red" size="sm">
            地块不存在
          </Text>
        )}

        {error && (
          <Text c="red" size="sm">
            {error}
          </Text>
        )}

        <Paper withBorder p="lg" radius="md">
          <Title order={4} mb="md">
            日志时间线
          </Title>
          {loading ? (
            <Group justify="center" p="xl">
              <Loader size="sm" />
            </Group>
          ) : logs.length === 0 ? (
            <Text ta="center" c="dimmed" p="xl">
              暂无种植日志
            </Text>
          ) : (
            <Timeline active={logs.length} bulletSize={24} lineWidth={2}>
              {logs.map((log) => (
                <Timeline.Item
                  key={log.id}
                  bullet={<IconLeaf size={12} />}
                  title={
                    <Group gap="sm">
                      <Text fw={600}>{dayjs(log.log_date).format('YYYY-MM-DD')}</Text>
                      <Text size="sm" c="dimmed">
                        记录人：{log.recorder}
                      </Text>
                    </Group>
                  }
                >
                  <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                    {log.content}
                  </Text>
                </Timeline.Item>
              ))}
            </Timeline>
          )}
        </Paper>

        <Paper withBorder p="lg" radius="md">
          <Title order={4} mb="md">
            新增日志
          </Title>
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
              <Group grow>
                <DateInput
                  label="记录日期"
                  placeholder="选择记录日期"
                  valueFormat="YYYY-MM-DD"
                  withAsterisk
                  disabled={formDisabled}
                  {...form.getInputProps('log_date')}
                />
                <TextInput
                  label="记录人"
                  placeholder="请输入记录人姓名"
                  withAsterisk
                  disabled={formDisabled}
                  {...form.getInputProps('recorder')}
                />
              </Group>
              <Textarea
                label="日志内容"
                placeholder="请输入种植日志内容"
                autosize
                minRows={3}
                withAsterisk
                disabled={formDisabled}
                {...form.getInputProps('content')}
              />
              {submitError && (
                <Text c="red" size="sm">
                  {submitError}
                </Text>
              )}
              <Group justify="flex-end" mt="sm">
                <Button
                  type="submit"
                  loading={submitting}
                  disabled={formDisabled}
                  leftSection={<IconLeaf size={16} />}
                >
                  保存日志
                </Button>
              </Group>
            </Stack>
          </form>
        </Paper>
      </Stack>
    </Container>
  );
}
